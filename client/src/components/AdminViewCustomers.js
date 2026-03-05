import React, {useCallback, useEffect, useState} from "react"
import axios from "axios"
import {Link, Redirect} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"

export const AdminViewCustomers = () => {
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const [customers, setCustomers] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [sortConfig, setSortConfig] = useState({column: "name", direction: "asc"})

    const getErrorMessage = useCallback((error, fallbackMessage) => {
        const status = error?.response?.status
        if (status === 401 || status === 403) return "Your admin session expired. Please log in again."
        if (status && status >= 500) return "Server error. Please try again in a moment."
        if (error?.code === "ERR_NETWORK") return "Cannot connect to server. Check backend connection."

        const responseData = error?.response?.data
        if (typeof responseData === "string" && responseData.trim()) return responseData.trim()
        if (typeof responseData?.message === "string" && responseData.message.trim()) return responseData.message.trim()
        if (typeof error?.message === "string" && error.message.trim()) return error.message.trim()
        return fallbackMessage
    }, [])

    const loadCustomers = useCallback(() => {
        setIsLoading(true)
        setLoadError("")

        axios.get(`${SERVER_HOST}/users`, {headers: {"authorization": localStorage.token}})
            .then((response) => {
                setCustomers(Array.isArray(response.data) ? response.data : [])
            })
            .catch((error) => {
                setCustomers([])
                setLoadError(getErrorMessage(error, "Failed to load customers. Please try again."))
            })
            .finally(() => setIsLoading(false))
    }, [getErrorMessage])

    useEffect(() => {
        if (!isAdmin) return
        loadCustomers()
    }, [isAdmin, loadCustomers])

    if (!isAdmin) return <Redirect to="/DisplayAllProducts"/>

    const handleSort = (column) => {
        setSortConfig((previousConfig) => {
            if (previousConfig.column === column) {
                return {column, direction: previousConfig.direction === "asc" ? "desc" : "asc"}
            }
            return {column, direction: "asc"}
        })
    }

    const getSortIndicator = (column) => {
        if (sortConfig.column !== column) return ""
        return sortConfig.direction === "asc" ? "▲" : "▼"
    }

    const sortedCustomers = [...customers].sort((firstCustomer, secondCustomer) => {
        const directionFactor = sortConfig.direction === "asc" ? 1 : -1
        const firstValue = String(firstCustomer?.[sortConfig.column] || "").toLowerCase()
        const secondValue = String(secondCustomer?.[sortConfig.column] || "").toLowerCase()
        return firstValue.localeCompare(secondValue) * directionFactor
    })

    return (
        <div className="container admin-customers-page">
            <div className="admin-stock-header">
                <h2>View Customers</h2>
                <Link className="blue-button" to="/DisplayAllProducts">Back to catalog</Link>
            </div>

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

            {!isLoading && customers.length > 0 ? (
                <div className="table-container admin-customers-table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Photo</th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("name")}>
                                    Name {getSortIndicator("name")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("email")}>
                                    Email {getSortIndicator("email")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("phone")}>
                                    Phone {getSortIndicator("phone")}
                                </button>
                            </th>
                            <th>
                                <button type="button" className="table-sort-btn" onClick={() => handleSort("address")}>
                                    Address {getSortIndicator("address")}
                                </button>
                            </th>
                        </tr>
                        </thead>

                        <tbody>
                        {sortedCustomers.map((customer) => (
                            <tr key={customer._id}>
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
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : null}
        </div>
    )
}
