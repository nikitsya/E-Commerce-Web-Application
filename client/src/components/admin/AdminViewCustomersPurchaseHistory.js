import React, {useCallback, useEffect, useMemo, useState} from "react"
import axios from "axios"
import {Link, Redirect, withRouter} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../../config/global_constants"
import {AdminPageHeader} from "./AdminPageHeader"
import {getAdminErrorMessage, getSortIndicator} from "./adminShared"
import {resolveImageSrc} from "../../utils/resolveImageSrc"

// Normalizes monetary values to EUR format used across admin reports.
const formatCurrency = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

// Formats purchase timestamps to a consistent Ireland locale view.
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

// Sort helper handles numeric/date columns and text columns in one place.
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

const AdminViewCustomersPurchaseHistoryComponent = ({location}) => {
    // Restrict purchase analytics page to admin users.
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const [purchases, setPurchases] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [customerType, setCustomerType] = useState("all")
    const [sortConfig, setSortConfig] = useState({column: "createdAt", direction: "desc"})
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedPurchase, setSelectedPurchase] = useState(null)

    const prefilledEmailFilter = useMemo(() => {
        // Supports deep-linking from "View Customers" with pre-applied email filter.
        const queryEmail = new URLSearchParams(location.search).get("email")
        return String(queryEmail || "").trim()
    }, [location.search])

    useEffect(() => {
        setSearchTerm(prefilledEmailFilter)
    }, [prefilledEmailFilter])

    const loadPurchaseHistory = useCallback(() => {
        setIsLoading(true)
        setLoadError("")

        // Loads the full purchase history for client-side filtering and sorting.
        axios.get(`${SERVER_HOST}/sales/customers/purchase-history`, {headers: {"authorization": localStorage.token}})
            .then((response) => {
                setPurchases(Array.isArray(response.data) ? response.data : [])
            })
            .catch((error) => {
                setPurchases([])
                setLoadError(getAdminErrorMessage(error, "Failed to load purchase history. Please try again."))
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        if (!isAdmin) return
        // Initial load for purchase-history table.
        loadPurchaseHistory()
    }, [isAdmin, loadPurchaseHistory])

    useEffect(() => {
        if (!selectedPurchase) return undefined

        const originalBodyOverflow = document.body.style.overflow
        const originalHtmlOverflow = document.documentElement.style.overflow
        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = originalBodyOverflow
            document.documentElement.style.overflow = originalHtmlOverflow
        }
    }, [selectedPurchase])

    useEffect(() => {
        if (!selectedPurchase) return undefined

        const handleEscapeKey = (event) => {
            if (event.key === "Escape") setSelectedPurchase(null)
        }

        window.addEventListener("keydown", handleEscapeKey)
        return () => window.removeEventListener("keydown", handleEscapeKey)
    }, [selectedPurchase])

    useEffect(() => {
        if (!selectedPurchase) return
        const stillExists = purchases.some((purchase) => String(purchase._id) === String(selectedPurchase._id))
        if (!stillExists) setSelectedPurchase(null)
    }, [purchases, selectedPurchase])

    const handleSort = (column) => {
        setSortConfig((previousConfig) => {
            if (previousConfig.column === column) {
                return {column, direction: previousConfig.direction === "asc" ? "desc" : "asc"}
            }
            return {column, direction: column === "createdAt" ? "desc" : "asc"}
        })
    }

    const filteredAndSortedPurchases = useMemo(() => {
        // Combines customer type filter, free-text search and dynamic sorting.
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
        // Calculates top-level metrics shown above the table.
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
            <AdminPageHeader title="Customer Purchase History"/>

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
                                <button type="button" className="table-sort-btn"
                                        onClick={() => handleSort("createdAt")}>
                                    Date {getSortIndicator(sortConfig, "createdAt")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("orderID")}>
                                    Order ID {getSortIndicator(sortConfig, "orderID")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn"
                                        onClick={() => handleSort("customerName")}>
                                    Customer {getSortIndicator(sortConfig, "customerName")}
                                </button>
                            </th>
                            <th>Type</th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("total")}>
                                    Total {getSortIndicator(sortConfig, "total")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn"
                                        onClick={() => handleSort("itemsCount")}>
                                    Items {getSortIndicator(sortConfig, "itemsCount")}
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
                                <tr
                                    key={purchase._id}
                                    className="product-row-clickable"
                                    onClick={() => setSelectedPurchase(purchase)}
                                >
                                    <td data-label="Date">{formatDateTime(purchase.createdAt)}</td>
                                    <td data-label="Order ID">{purchase.orderID || "Unknown order"}</td>
                                    <td data-label="Customer">
                                        <div
                                            className="admin-purchase-customer-name">{purchase.customerName || "Unknown customer"}</div>
                                        <div
                                            className="admin-purchase-customer-meta">{purchase.customerEmail || "Email not provided"}</div>
                                        {purchase.customerPhone ? (
                                            <div className="admin-purchase-customer-meta">{purchase.customerPhone}</div>
                                        ) : null}
                                        {purchase.customerAddress ? (
                                            <div
                                                className="admin-purchase-customer-meta">{purchase.customerAddress}</div>
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

            {selectedPurchase ? (
                <div className="modal-overlay" onClick={() => setSelectedPurchase(null)}>
                    <div
                        className="modal-card admin-details-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Purchase details"
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>Order {selectedPurchase.orderID || "-"}</h3>
                                <button type="button" className="blue-button modal-close-btn"
                                        onClick={() => setSelectedPurchase(null)}>
                                    Close
                                </button>
                            </div>

                            <div className="modal-stats">
                                <span className="modal-stat">{formatDateTime(selectedPurchase.createdAt)}</span>
                                <span className="modal-stat">{formatCurrency(selectedPurchase.total)}</span>
                                <span className="modal-stat">{selectedPurchase.isGuest ? "Guest" : "Registered"}</span>
                            </div>

                            <p className="modal-description">
                                {selectedPurchase.customerName || "Unknown customer"} | {selectedPurchase.customerEmail || "Email not provided"}
                            </p>
                            <p className="modal-description">
                                {selectedPurchase.customerPhone || "Phone not provided"} | {selectedPurchase.customerAddress || "Address not provided"}
                            </p>

                            <ul className="admin-detail-items-list">
                                {(Array.isArray(selectedPurchase.items) ? selectedPurchase.items : []).map((item, index) => {
                                    const quantity = Number(item?.quantity) || 1
                                    const lineTotal = (Number(item?.price) || 0) * quantity
                                    const imageSrc = resolveImageSrc(item?.image)

                                    return (
                                        <li key={`${selectedPurchase._id || selectedPurchase.orderID}-${String(item?._id || index)}`}>
                                            <span className="admin-detail-item-main">
                                                {imageSrc
                                                    ? <img className="purchase-history-item-image" src={imageSrc}
                                                           alt={item?.name || "Item"}/>
                                                    :
                                                    <span className="purchase-history-item-image-placeholder">-</span>}
                                                <span>{String(item?.name || "Unnamed item")} × {quantity}</span>
                                            </span>
                                            <span className="admin-detail-item-right">
                                                <strong>{formatCurrency(lineTotal)}</strong>
                                                {item?.isReturned ? (
                                                    <span className="purchase-returned-badge">Returned</span>
                                                ) : null}
                                            </span>
                                        </li>
                                    )
                                })}
                            </ul>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    )
}

export const AdminViewCustomersPurchaseHistory = withRouter(AdminViewCustomersPurchaseHistoryComponent)
