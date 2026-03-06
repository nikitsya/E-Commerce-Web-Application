import React, {useCallback, useEffect, useMemo, useState} from "react"
import axios from "axios"
import {Link, Redirect, withRouter} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../../config/global_constants"

const formatCurrency = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

const formatDateTime = (value) => {
    const parsedDate = new Date(value)
    if (Number.isNaN(parsedDate.getTime())) return "Unknown date"

    return parsedDate.toLocaleString("en-IE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

const getSortValue = (purchase, column) => {
    if (column === "createdAt") return new Date(purchase.createdAt).getTime() || 0
    if (column === "total") return Number(purchase.total) || 0
    if (column === "itemsCount") {
        return Array.isArray(purchase.items)
            ? purchase.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
            : 0
    }
    return String(purchase?.[column] || "").toLowerCase()
}

const getErrorMessage = (error, fallbackMessage) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) return "Your admin session expired. Please log in again."
    if (status && status >= 500) return "Server error. Please try again in a moment."
    if (error?.code === "ERR_NETWORK") return "Cannot connect to server. Check backend connection."

    const responseData = error?.response?.data
    if (typeof responseData === "string" && responseData.trim()) return responseData.trim()
    if (typeof responseData?.message === "string" && responseData.message.trim()) return responseData.message.trim()
    if (typeof error?.message === "string" && error.message.trim()) return error.message.trim()
    return fallbackMessage
}

const AdminViewCustomersPurchaseHistoryComponent = ({location}) => {
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const [purchases, setPurchases] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [customerType, setCustomerType] = useState("all")
    const [sortConfig, setSortConfig] = useState({column: "createdAt", direction: "desc"})
    const [searchTerm, setSearchTerm] = useState("")

    const prefilledEmailFilter = useMemo(() => {
        const queryEmail = new URLSearchParams(location.search).get("email")
        return String(queryEmail || "").trim()
    }, [location.search])

    useEffect(() => {
        setSearchTerm(prefilledEmailFilter)
    }, [prefilledEmailFilter])

    const loadPurchaseHistory = useCallback(() => {
        setIsLoading(true)
        setLoadError("")

        axios.get(`${SERVER_HOST}/sales/customers/purchase-history`, {headers: {"authorization": localStorage.token}})
            .then((response) => {
                setPurchases(Array.isArray(response.data) ? response.data : [])
            })
            .catch((error) => {
                setPurchases([])
                setLoadError(getErrorMessage(error, "Failed to load purchase history. Please try again."))
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        if (!isAdmin) return
        loadPurchaseHistory()
    }, [isAdmin, loadPurchaseHistory])

    const handleSort = (column) => {
        setSortConfig((previousConfig) => {
            if (previousConfig.column === column) {
                return {column, direction: previousConfig.direction === "asc" ? "desc" : "asc"}
            }
            return {column, direction: column === "createdAt" ? "desc" : "asc"}
        })
    }

    const getSortIndicator = (column) => {
        if (sortConfig.column !== column) return ""
        return sortConfig.direction === "asc" ? "▲" : "▼"
    }

    const filteredAndSortedPurchases = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase()

        const filtered = purchases.filter((purchase) => {
            if (customerType === "guest" && !purchase.isGuest) return false
            if (customerType === "registered" && purchase.isGuest) return false
            if (!normalizedSearch) return true

            const itemNames = Array.isArray(purchase.items)
                ? purchase.items.map((item) => String(item?.name || "").toLowerCase()).join(" ")
                : ""

            const searchableText = [
                purchase.orderID,
                purchase.customerName,
                purchase.customerEmail,
                purchase.customerPhone,
                purchase.customerAddress,
                itemNames
            ].map((value) => String(value || "").toLowerCase()).join(" ")

            return searchableText.includes(normalizedSearch)
        })

        return filtered.sort((firstPurchase, secondPurchase) => {
            const directionFactor = sortConfig.direction === "asc" ? 1 : -1
            const firstValue = getSortValue(firstPurchase, sortConfig.column)
            const secondValue = getSortValue(secondPurchase, sortConfig.column)

            if (typeof firstValue === "number" && typeof secondValue === "number") {
                return (firstValue - secondValue) * directionFactor
            }

            return String(firstValue).localeCompare(String(secondValue)) * directionFactor
        })
    }, [customerType, purchases, searchTerm, sortConfig])

    const summary = useMemo(() => {
        const uniqueCustomers = new Set()
        let revenue = 0

        filteredAndSortedPurchases.forEach((purchase) => {
            revenue += Number(purchase.total) || 0
            const customerKey = String(purchase.customerEmail || purchase.customerName || "").toLowerCase()
            if (customerKey) uniqueCustomers.add(customerKey)
        })

        return {
            orderCount: filteredAndSortedPurchases.length,
            customerCount: uniqueCustomers.size,
            revenue
        }
    }, [filteredAndSortedPurchases])

    if (!isAdmin) return <Redirect to="/DisplayAllProducts"/>

    return (
        <div className="container admin-stock-page admin-purchase-history-page">
            <div className="admin-stock-header">
                <h2>Customer Purchase History</h2>
                <Link className="blue-button" to="/DisplayAllProducts">Back to catalog</Link>
            </div>

            <div className="admin-purchase-summary">
                <div><strong>{summary.orderCount}</strong> orders</div>
                <div><strong>{summary.customerCount}</strong> customers</div>
                <div><strong>{formatCurrency(summary.revenue)}</strong> revenue</div>
            </div>

            <div className="admin-purchase-controls">
                <input
                    className="admin-purchase-search"
                    type="search"
                    placeholder="Search by order, customer, email, phone, address or item"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />

                <select
                    className="admin-purchase-select"
                    value={customerType}
                    onChange={(event) => setCustomerType(event.target.value)}
                >
                    <option value="all">All customers</option>
                    <option value="registered">Registered only</option>
                    <option value="guest">Guest only</option>
                </select>
            </div>

            {prefilledEmailFilter ? (
                <div className="admin-purchase-filter-note">
                    Filtered from customer list: <strong>{prefilledEmailFilter}</strong>
                    <Link to="/AdminViewCustomersPurchaseHistory" className="admin-purchase-clear-filter">Clear</Link>
                </div>
            ) : null}

            {loadError ? (
                <div className="admin-stock-global-error" role="alert">
                    <p>{loadError}</p>
                    <button type="button" className="blue-button" onClick={loadPurchaseHistory}>Retry</button>
                </div>
            ) : null}

            {isLoading ? <div className="admin-stock-empty">Loading purchase history...</div> : null}

            {!isLoading && filteredAndSortedPurchases.length === 0 && !loadError ? (
                <div className="admin-stock-empty">No purchase history found for the current filters.</div>
            ) : null}

            {!isLoading && filteredAndSortedPurchases.length > 0 ? (
                <div className="table-container admin-purchase-table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("createdAt")}>
                                    Date {getSortIndicator("createdAt")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("orderID")}>
                                    Order ID {getSortIndicator("orderID")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("customerName")}>
                                    Customer {getSortIndicator("customerName")}
                                </button>
                            </th>
                            <th>Type</th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("total")}>
                                    Total {getSortIndicator("total")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("itemsCount")}>
                                    Items {getSortIndicator("itemsCount")}
                                </button>
                            </th>
                            <th>Details</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filteredAndSortedPurchases.map((purchase) => {
                            const items = Array.isArray(purchase.items) ? purchase.items : []
                            const itemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

                            return (
                                <tr key={purchase._id}>
                                    <td data-label="Date">{formatDateTime(purchase.createdAt)}</td>
                                    <td data-label="Order ID">{purchase.orderID || "Unknown order"}</td>
                                    <td data-label="Customer">
                                        <div className="admin-purchase-customer-name">{purchase.customerName || "Unknown customer"}</div>
                                        <div className="admin-purchase-customer-meta">{purchase.customerEmail || "Email not provided"}</div>
                                        {purchase.customerPhone ? (
                                            <div className="admin-purchase-customer-meta">{purchase.customerPhone}</div>
                                        ) : null}
                                        {purchase.customerAddress ? (
                                            <div className="admin-purchase-customer-meta">{purchase.customerAddress}</div>
                                        ) : null}
                                    </td>
                                    <td data-label="Type">{purchase.isGuest ? "Guest" : "Registered"}</td>
                                    <td data-label="Total">{formatCurrency(purchase.total)}</td>
                                    <td data-label="Items">{itemsCount}</td>
                                    <td data-label="Details">
                                        {items.length > 0 ? (
                                            <ul className="admin-purchase-items-list">
                                                {items.map((item, index) => (
                                                    <li key={`${purchase._id}-${item._id || index}`}>
                                                        <span>{item.name || "Unnamed item"} × {Number(item.quantity) || 1}</span>
                                                        <strong>{formatCurrency((Number(item.price) || 0) * (Number(item.quantity) || 1))}</strong>
                                                    </li>
                                                ))}
                                            </ul>
                                        ) : (
                                            <span className="admin-purchase-no-items">No items</span>
                                        )}
                                    </td>
                                </tr>
                            )
                        })}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}

export const AdminViewCustomersPurchaseHistory = withRouter(AdminViewCustomersPurchaseHistoryComponent)
