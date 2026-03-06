import React, {useEffect, useMemo, useState} from "react"
import axios from "axios"
import {Link} from "react-router-dom"
import {SERVER_HOST} from "../../config/global_constants"

const formatDateTime = (value) => {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return "Unknown date"
    return date.toLocaleString("en-IE", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
    })
}

const formatPrice = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

export const PurchaseHistory = () => {
    const [purchases, setPurchases] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")

    useEffect(() => {
        setIsLoading(true)
        setLoadError("")

        axios.get(`${SERVER_HOST}/sales/my-purchase-history`, {headers: {"authorization": localStorage.token}})
            .then((response) => {
                setPurchases(Array.isArray(response.data) ? response.data : [])
            })
            .catch((error) => {
                setPurchases([])
                setLoadError(error?.response?.data || "Failed to load purchase history")
            })
            .finally(() => setIsLoading(false))
    }, [])

    const rows = useMemo(() => purchases.map((purchase, index) => {
        const items = Array.isArray(purchase.items) ? purchase.items : []
        const itemsSummary = items.length > 0
            ? items.map((item) => `${item.name || "Item"} x ${Number(item.quantity) || 1}`).join(", ")
            : "No items"

        return {
            id: String(purchase._id || purchase.orderID || `purchase-row-${index}`),
            date: formatDateTime(purchase.createdAt),
            orderID: purchase.orderID || "-",
            total: formatPrice(purchase.total),
            itemsSummary
        }
    }), [purchases])

    return (
        <div className="container purchase-history-page">
            <div className="admin-stock-header purchase-history-header">
                <h2>Purchase History</h2>
                <Link className="blue-button" to="/DisplayAllProducts">Back to catalog</Link>
            </div>
            <p className="purchase-history-subtitle">Your recent orders.</p>

            {loadError ? <div className="admin-stock-global-error" role="alert">{loadError}</div> : null}
            {isLoading ? <div className="admin-stock-empty">Loading purchase history...</div> : null}

            {!isLoading && !loadError && rows.length === 0 ? (
                <div className="admin-stock-empty">No purchases yet.</div>
            ) : null}

            {!isLoading && rows.length > 0 ? (
                <div className="table-container purchase-history-table-wrap">
                    <table>
                        <thead>
                        <tr>
                            <th>Date</th>
                            <th>Order ID</th>
                            <th>Total</th>
                            <th>Items</th>
                        </tr>
                        </thead>
                        <tbody>
                        {rows.map((row) => (
                            <tr key={row.id}>
                                <td data-label="Date">{row.date}</td>
                                <td data-label="Order ID">{row.orderID}</td>
                                <td data-label="Total">{row.total}</td>
                                <td data-label="Items">{row.itemsSummary}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                </div>
            ) : null}

        </div>
    )
}
