import React, {useCallback, useEffect, useMemo, useState} from "react"
import axios from "axios"
import {Link, Redirect} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../../config/global_constants"
import {AdminPageHeader} from "./AdminPageHeader"
import {getAdminErrorMessage, getSortIndicator} from "./adminShared"
import {AdminDeleteCustomerModal} from "./AdminDeleteCustomerModal"

export const AdminViewCustomers = () => {
    // Restrict customer list and purchase metadata to admin users.
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const [customers, setCustomers] = useState([])
    const [orderedCustomerEmails, setOrderedCustomerEmails] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [deleteError, setDeleteError] = useState("")
    const [customerToDelete, setCustomerToDelete] = useState(null)
    const [isDeletingCustomer, setIsDeletingCustomer] = useState(false)
    const [sortConfig, setSortConfig] = useState({column: "name", direction: "asc"})
    const [searchTerm, setSearchTerm] = useState("")
    const [orderFilter, setOrderFilter] = useState("all")
    const [selectedCustomer, setSelectedCustomer] = useState(null)

    const loadCustomers = useCallback(() => {
        setIsLoading(true)
        setLoadError("")

        // Pull both customer profiles and purchase-history summary in parallel.
        Promise.all([
            axios.get(`${SERVER_HOST}/users`, {headers: {"authorization": localStorage.token}}),
            axios.get(`${SERVER_HOST}/sales/customers/purchase-history`, {headers: {"authorization": localStorage.token}})
        ])
            .then(([customersResponse, purchaseHistoryResponse]) => {
                const nextCustomers = Array.isArray(customersResponse.data) ? customersResponse.data : []
                const purchaseHistory = Array.isArray(purchaseHistoryResponse.data) ? purchaseHistoryResponse.data : []
                const emailsWithOrders = Array.from(new Set(
                    purchaseHistory
                        .map((purchase) => String(purchase?.customerEmail || "").trim().toLowerCase())
                        .filter((email) => email !== "")
                ))

                setCustomers(nextCustomers)
                setOrderedCustomerEmails(emailsWithOrders)
            })
            .catch((error) => {
                setCustomers([])
                setOrderedCustomerEmails([])
                setLoadError(getAdminErrorMessage(error, "Failed to load customers. Please try again."))
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        if (!isAdmin) return
        // Initial dataset for the admin customer screen.
        loadCustomers()
    }, [isAdmin, loadCustomers])

    useEffect(() => {
        if (!selectedCustomer) return undefined

        const originalBodyOverflow = document.body.style.overflow
        const originalHtmlOverflow = document.documentElement.style.overflow
        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = originalBodyOverflow
            document.documentElement.style.overflow = originalHtmlOverflow
        }
    }, [selectedCustomer])

    useEffect(() => {
        if (!selectedCustomer) return undefined

        const handleEscapeKey = (event) => {
            if (event.key === "Escape") setSelectedCustomer(null)
        }

        window.addEventListener("keydown", handleEscapeKey)
        return () => window.removeEventListener("keydown", handleEscapeKey)
    }, [selectedCustomer])

    useEffect(() => {
        if (!selectedCustomer) return
        const stillExists = customers.some((customer) => String(customer._id) === String(selectedCustomer._id))
        if (!stillExists) setSelectedCustomer(null)
    }, [customers, selectedCustomer])

    const handleSort = (column) => {
        setSortConfig((previousConfig) => {
            if (previousConfig.column === column) {
                return {column, direction: previousConfig.direction === "asc" ? "desc" : "asc"}
            }
            return {column, direction: "asc"}
        })
    }

    const openDeleteCustomerModal = (customer) => {
        setDeleteError("")
        setCustomerToDelete(customer)
    }

    const closeDeleteCustomerModal = () => {
        if (isDeletingCustomer) return
        setDeleteError("")
        setCustomerToDelete(null)
    }

    const handleDeleteCustomer = (customer) => {
        const customerID = String(customer?._id || "").trim()
        if (!customerID) return

        setIsDeletingCustomer(true)
        setDeleteError("")

        axios.delete(`${SERVER_HOST}/users/${customerID}`, {headers: {"authorization": localStorage.token}})
            .then(() => {
                const removedEmail = String(customer?.email || "").trim().toLowerCase()
                setCustomers((previousCustomers) =>
                    previousCustomers.filter((existingCustomer) => String(existingCustomer?._id || "") !== customerID)
                )
                if (removedEmail) {
                    setOrderedCustomerEmails((previousEmails) => previousEmails.filter((email) => email !== removedEmail))
                }
                setCustomerToDelete(null)
            })
            .catch((error) => {
                setDeleteError(getAdminErrorMessage(
                    error,
                    "Failed to delete customer. Please try again.",
                    {notFoundMessage: "Customer was already removed. Refresh and try again."}
                ))
            })
            .finally(() => setIsDeletingCustomer(false))
    }

    const orderedCustomerEmailSet = useMemo(() => new Set(orderedCustomerEmails), [orderedCustomerEmails])

    const filteredAndSortedCustomers = useMemo(() => {
        // Combines text search, order-presence filter and sortable columns.
        const normalizedSearch = searchTerm.trim().toLowerCase()

        const filteredCustomers = customers.filter((customer) => {
            const customerEmail = String(customer?.email || "").trim().toLowerCase()
            const hasOrders = customerEmail !== "" && orderedCustomerEmailSet.has(customerEmail)

            if (orderFilter === "with-orders" && !hasOrders) return false
            if (orderFilter === "without-orders" && hasOrders) return false
            if (!normalizedSearch) return true

            const searchableText = [
                customer.name,
                customer.email,
                customer.phone,
                customer.address
            ].map((value) => String(value || "").toLowerCase()).join(" ")

            return searchableText.includes(normalizedSearch)
        })

        return filteredCustomers.sort((firstCustomer, secondCustomer) => {
            const directionFactor = sortConfig.direction === "asc" ? 1 : -1
            const firstValue = String(firstCustomer?.[sortConfig.column] || "").toLowerCase()
            const secondValue = String(secondCustomer?.[sortConfig.column] || "").toLowerCase()
            return firstValue.localeCompare(secondValue) * directionFactor
        })
    }, [customers, orderFilter, orderedCustomerEmailSet, searchTerm, sortConfig])

    if (!isAdmin) return <Redirect to="/DisplayAllProducts"/>

    return (
        <div className="container admin-customers-page">
            <AdminPageHeader title="View Customers"/>

            <div className="admin-purchase-summary">
                <div><strong>{filteredAndSortedCustomers.length}</strong> customers shown</div>
                <div><strong>{customers.length}</strong> total customers</div>
            </div>

            <div className="admin-purchase-controls">
                <input
                    className="admin-purchase-search"
                    type="search"
                    placeholder="Search by name, email, phone or address"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />

                <select
                    className="admin-purchase-select"
                    value={orderFilter}
                    onChange={(event) => setOrderFilter(event.target.value)}
                >
                    <option value="all">All customers</option>
                    <option value="with-orders">With orders</option>
                    <option value="without-orders">Without orders</option>
                </select>
            </div>

            {searchTerm.trim() || orderFilter !== "all" ? (
                <div className="admin-purchase-filter-note">
                    Filters active.
                    <button
                        type="button"
                        className="admin-purchase-clear-filter"
                        onClick={() => {
                            setSearchTerm("")
                            setOrderFilter("all")
                        }}
                    >
                        Clear
                    </button>
                </div>
            ) : null}

            {loadError ? (
                <div className="admin-stock-global-error" role="alert">
                    <p>{loadError}</p>
                    <button type="button" className="blue-button" onClick={loadCustomers}>Retry</button>
                </div>
            ) : null}

            {isLoading ? <div className="admin-stock-empty">Loading customers...</div> : null}

            {!isLoading && customers.length === 0 && !loadError ? (
                <div className="admin-stock-empty">No customers available.</div>
            ) : null}

            {!isLoading && customers.length > 0 && filteredAndSortedCustomers.length === 0 && !loadError ? (
                <div className="admin-stock-empty">No customers found for the current filters.</div>
            ) : null}

            {!isLoading && filteredAndSortedCustomers.length > 0 ? (
                <div className="table-container admin-customers-table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Photo</th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("name")}>
                                    Name {getSortIndicator(sortConfig, "name")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("email")}>
                                    Email {getSortIndicator(sortConfig, "email")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("phone")}>
                                    Phone {getSortIndicator(sortConfig, "phone")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("address")}>
                                    Address {getSortIndicator(sortConfig, "address")}
                                </button>
                            </th>
                            <th>History</th>
                            <th>Actions</th>
                        </tr>
                        </thead>

                        <tbody>
                        {filteredAndSortedCustomers.map((customer) => (
                            <tr
                                key={customer._id}
                                className="product-row-clickable"
                                onClick={() => setSelectedCustomer(customer)}
                            >
                                <td data-label="Photo">
                                    {customer.profilePhoto ? (
                                        <img
                                            className="admin-customer-thumb"
                                            src={`data:;base64,${customer.profilePhoto}`}
                                            alt={customer.name || "Customer"}
                                        />
                                    ) : (
                                        <div className="admin-customer-thumb-placeholder">-</div>
                                    )}
                                </td>
                                <td data-label="Name">{customer.name || "Unknown customer"}</td>
                                <td data-label="Email">{customer.email || "Not provided"}</td>
                                <td data-label="Phone">{customer.phone || "Not provided"}</td>
                                <td data-label="Address">{customer.address || "Not provided"}</td>
                                <td data-label="History" onClick={(event) => event.stopPropagation()}>
                                    {customer.email ? (
                                        <Link
                                            className="blue-button admin-customer-history-link"
                                            to={`/AdminViewCustomersPurchaseHistory?email=${encodeURIComponent(customer.email)}`}
                                        >
                                            View
                                        </Link>
                                    ) : (
                                        <span>Unavailable</span>
                                    )}
                                </td>
                                <td data-label="Actions" onClick={(event) => event.stopPropagation()}>
                                    <button
                                        type="button"
                                        className="icon-button admin-action-link admin-customer-delete-icon-button"
                                        onClick={() => openDeleteCustomerModal(customer)}
                                        disabled={isDeletingCustomer}
                                        aria-label="Delete customer"
                                        title="Delete customer"
                                    >
                                        <img className="admin-action-icon" src="/images/buttons/admin/delete.png"
                                             alt="Delete"/>
                                    </button>
                                </td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

            {selectedCustomer ? (
                <div className="modal-overlay" onClick={() => setSelectedCustomer(null)}>
                    <div
                        className="modal-card admin-details-modal"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Customer details"
                    >
                        <div className="modal-content">
                            <div className="modal-header">
                                <h3>{selectedCustomer.name || "Customer details"}</h3>
                                <button type="button" className="blue-button modal-close-btn"
                                        onClick={() => setSelectedCustomer(null)}>
                                    Close
                                </button>
                            </div>

                            <div className="modal-stats">
                                <span className="modal-stat">{selectedCustomer.email || "Email not provided"}</span>
                                <span className="modal-stat">{selectedCustomer.phone || "Phone not provided"}</span>
                                <span className="modal-stat">
                                    {orderedCustomerEmailSet.has(String(selectedCustomer.email || "").toLowerCase())
                                        ? "Has purchase history"
                                        : "No purchases yet"}
                                </span>
                            </div>

                            {selectedCustomer.profilePhoto ? (
                                <img
                                    className="confirm-delete-image admin-details-photo"
                                    src={`data:;base64,${selectedCustomer.profilePhoto}`}
                                    alt={selectedCustomer.name || "Customer"}
                                />
                            ) : null}

                            <p className="modal-description">
                                Address: {selectedCustomer.address || "Not provided"}
                            </p>
                        </div>
                    </div>
                </div>
            ) : null}

            <AdminDeleteCustomerModal
                customer={customerToDelete}
                isDeleting={isDeletingCustomer}
                error={deleteError}
                onConfirm={handleDeleteCustomer}
                onClose={closeDeleteCustomerModal}
            />
        </div>
    )
}
