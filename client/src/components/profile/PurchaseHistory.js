import React, {useCallback, useEffect, useMemo, useState} from "react"
import axios from "axios"
import {Link} from "react-router-dom"
import {SERVER_HOST} from "../../config/global_constants"
import {getAdminErrorMessage, getSortIndicator} from "../admin/adminShared"
import {resolveImageSrc} from "../../utils/resolveImageSrc"

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

export const PurchaseHistory = () => {
    const [purchases, setPurchases] = useState([])
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [searchTerm, setSearchTerm] = useState("")
    const [periodFilter, setPeriodFilter] = useState("all")
    const [sortConfig, setSortConfig] = useState({column: "createdAt", direction: "desc"})

    const [returningItemKey, setReturningItemKey] = useState("")
    // Holds item pending return confirmation modal.
    const [itemToReturn, setItemToReturn] = useState(null)
    const [selectedPurchase, setSelectedPurchase] = useState(null)

    const loadPurchaseHistory = useCallback(() => {
        setIsLoading(true)
        setLoadError("")

        axios.get(`${SERVER_HOST}/sales/my-purchase-history`, {headers: {"authorization": localStorage.token}})
            .then((purchaseResponse) => {
                const nextPurchases = Array.isArray(purchaseResponse.data) ? purchaseResponse.data : []
                setPurchases(nextPurchases)
            })
            .catch((error) => {
                setPurchases([])
                setLoadError(getAdminErrorMessage(error, "Failed to load purchase history. Please try again."))
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        loadPurchaseHistory()
    }, [loadPurchaseHistory])

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

// Opens confirmation modal before triggering return API.
    const openReturnConfirm = (saleId, item) => {
        setLoadError("")
        setItemToReturn({
            saleId: String(saleId),
            itemId: String(item?._id || ""),
            itemName: String(item?.name || "Item")
        })
    }

// Closes return confirmation modal without API call.
    const closeReturnConfirm = () => {
        setItemToReturn(null)
    }

    // Handles logged-in item return request and refreshes the updated sale in local state.
    const handleReturnClick = (saleId, itemId) => {
        setLoadError("")
        // Build a stable key so only one clicked item shows loading state.
        const itemKey = `${saleId}:${itemId}`
        setReturningItemKey(itemKey)

        requestReturnItem(saleId, itemId)
            .then((res) => {
                setPurchases((previousPurchases) => {
                    const updatedSale = res.data
                    return previousPurchases.map((purchase) =>
                        String(purchase._id) === String(updatedSale._id) ? updatedSale : purchase
                    )
                })
            })
            .catch((error) => {
                setLoadError(getAdminErrorMessage(error, "Failed to return item. Please try again."))
            })
            // Always release button lock even if request fails.
            .finally(() => setReturningItemKey(""))
    }

    const requestReturnItem = (saleId, itemId) => {
        return axios.patch(
            `${SERVER_HOST}/sales/return-item/${saleId}/${itemId}`,
            {},
            {headers: {"authorization": localStorage.token}}
        )
    }


    const periodOptions = useMemo(() => {
        const periodsByValue = new Map()

        purchases.forEach((purchase) => {
            const parsedDate = new Date(purchase.createdAt)
            if (Number.isNaN(parsedDate.getTime())) return

            const month = String(parsedDate.getMonth() + 1).padStart(2, "0")
            const periodValue = `${parsedDate.getFullYear()}-${month}`
            if (!periodsByValue.has(periodValue)) {
                periodsByValue.set(periodValue, parsedDate.toLocaleString("en-IE", {
                    month: "long",
                    year: "numeric"
                }))
            }
        })

        return Array.from(periodsByValue.entries())
            .sort((first, second) => second[0].localeCompare(first[0]))
            .map(([value, label]) => ({value, label}))
    }, [purchases])

    const filteredAndSortedPurchases = useMemo(() => {
        const normalizedSearch = searchTerm.trim().toLowerCase()

        const filtered = purchases.filter((purchase) => {
            const items = Array.isArray(purchase.items) ? purchase.items : []
            const itemNames = items.map((item) => String(item?.name || "").toLowerCase()).join(" ")

            if (periodFilter !== "all") {
                const parsedDate = new Date(purchase.createdAt)
                if (Number.isNaN(parsedDate.getTime())) return false
                const purchaseMonth = String(parsedDate.getMonth() + 1).padStart(2, "0")
                const purchasePeriod = `${parsedDate.getFullYear()}-${purchaseMonth}`
                if (purchasePeriod !== periodFilter) return false
            }

            if (!normalizedSearch) return true

            const searchableText = [
                purchase.orderID,
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
    }, [periodFilter, purchases, searchTerm, sortConfig])

    const summary = useMemo(() => {
        let totalItems = 0

        filteredAndSortedPurchases.forEach((purchase) => {
            totalItems += Array.isArray(purchase.items)
                ? purchase.items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)
                : 0
        })

        return {
            orders: filteredAndSortedPurchases.length,
            totalItems
        }
    }, [filteredAndSortedPurchases])

    return (
        <div className="container admin-stock-page admin-purchase-history-page purchase-history-page">
            <div className="admin-stock-header purchase-history-header">
                <h2>Purchase History</h2>
                <Link className="blue-button" to="/DisplayAllProducts">Back to catalog</Link>
            </div>
            <p className="purchase-history-subtitle">Your recent orders.</p>

            <div className="admin-purchase-summary">
                <div><strong>{summary.orders}</strong> orders</div>
                <div><strong>{summary.totalItems}</strong> items</div>
            </div>

            <div className="admin-purchase-controls">
                <input
                    className="admin-purchase-search"
                    type="search"
                    placeholder="Search by order ID or item name"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                />
                <select
                    className="admin-purchase-select"
                    value={periodFilter}
                    onChange={(event) => setPeriodFilter(event.target.value)}
                >
                    <option value="all">All months</option>
                    {periodOptions.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </div>

            {searchTerm.trim() || periodFilter !== "all" ? (
                <div className="admin-purchase-filter-note">
                    Filters active.
                    <button
                        type="button"
                        className="admin-purchase-clear-filter"
                        onClick={() => {
                            setSearchTerm("")
                            setPeriodFilter("all")
                        }}
                    >
                        Clear
                    </button>
                </div>
            ) : null}

            {loadError ? (
                <div className="admin-stock-global-error" role="alert">
                    <p>{loadError}</p>
                    <button type="button" className="blue-button" onClick={loadPurchaseHistory}>Retry</button>
                </div>
            ) : null}
            {isLoading ? <div className="admin-stock-empty">Loading purchase history...</div> : null}

            {!isLoading && !loadError && filteredAndSortedPurchases.length === 0 ? (
                <div className="admin-stock-empty">No purchase history found for the current filters.</div>
            ) : null}

            {!isLoading && filteredAndSortedPurchases.length > 0 ? (
                <div className="table-container purchase-history-table-wrap">
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
                            <th>Items</th>
                        </tr>
                        </thead>
                        <tbody>
                        {filteredAndSortedPurchases.map((purchase, purchaseIndex) => {
                            const items = Array.isArray(purchase.items) ? purchase.items : []
                            const itemsCount = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

                            return (
                                <tr
                                    key={purchase._id || purchase.orderID || `purchase-row-${purchaseIndex}`}
                                    className="product-row-clickable"
                                    onClick={() => setSelectedPurchase(purchase)}
                                >
                                    <td data-label="Date">{formatDateTime(purchase.createdAt)}</td>
                                    <td data-label="Order ID">{purchase.orderID || "-"}</td>
                                    <td data-label="Total">{formatPrice(purchase.total)}</td>
                                    <td data-label="Items">{itemsCount}</td>
                                    <td data-label="Items">
                                        {items.length > 0 ? (
                                            <ul className="admin-purchase-items-list purchase-history-items-list">
                                                {items.map((item, itemIndex) => {
                                                    const imageSrc = resolveImageSrc(item?.image)
                                                    const quantity = Number(item.quantity) || 1
                                                    const lineTotal = (Number(item.price) || 0) * quantity
                                                    const itemKey = `${purchase._id}:${String(item?._id || "")}`
                                                    const isReturning = returningItemKey === itemKey

                                                    return (
                                                        <li
                                                            key={`${purchase._id || purchase.orderID || purchaseIndex}-${String(item?._id || "") || itemIndex}`}
                                                            onClick={(event) => event.stopPropagation()}
                                                        >
                                                            <span className="purchase-history-item-main">
                                                                {imageSrc ? (
                                                                    <img
                                                                        className="purchase-history-item-image"
                                                                        src={imageSrc}
                                                                        alt={item.name || "Item"}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="purchase-history-item-image-placeholder">-</span>
                                                                )}
                                                                <span>{item.name || "Item"} x {quantity}</span>
                                                            </span>
                                                            <div className="purchase-history-item-right">
                                                                <strong>{formatPrice(lineTotal)}</strong>
                                                                {item.isReturned ? (
                                                                    <span
                                                                        className="purchase-returned-badge">Returned</span>
                                                                ) : (
                                                                    <button
                                                                        type="button"
                                                                        className="purchase-return-btn"
                                                                        onClick={(event) => {
                                                                            event.stopPropagation()
                                                                            openReturnConfirm(purchase._id, item)
                                                                        }}
                                                                        disabled={isReturning}
                                                                    >
                                                                        {isReturning ? "Returning..." : "Return"}
                                                                    </button>
                                                                )}
                                                            </div>

                                                        </li>
                                                    )
                                                })}
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
                                <span className="modal-stat">{formatPrice(selectedPurchase.total)}</span>
                                <span className="modal-stat">
                                    {(Array.isArray(selectedPurchase.items) ? selectedPurchase.items : [])
                                        .reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)} items
                                </span>
                            </div>

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
                                                <span>{String(item?.name || "Unnamed item")} x {quantity}</span>
                                            </span>
                                            <span className="admin-detail-item-right">
                                                <strong>{formatPrice(lineTotal)}</strong>
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

            {itemToReturn ? (
                <div className="modal-overlay" onClick={closeReturnConfirm}>
                    <div
                        className="confirm-delete-card"
                        onClick={(event) => event.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-label="Confirm return item"
                    >
                        <h3>Confirm Return</h3>
                        <p>Return "{itemToReturn.itemName}"?</p>
                        <div className="modal-actions">
                            <button type="button" className="red-button" onClick={closeReturnConfirm}>
                                Cancel
                            </button>
                            <button
                                type="button"
                                className="green-button"
                                disabled={Boolean(returningItemKey)}
                                onClick={() => {
                                    handleReturnClick(itemToReturn.saleId, itemToReturn.itemId)
                                    closeReturnConfirm()
                                }}
                            >
                                Confirm Return
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}

        </div>
    )
}
