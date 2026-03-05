import React, {useCallback, useEffect, useState} from "react"
import axios from "axios"
import {Link, Redirect} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"


const getFirstImage = (product) => {
    if (!Array.isArray(product.images) || product.images.length === 0) return ""
    return product.images[0] || ""
}

const getErrorMessage = (error, fallbackMessage) => {
    const status = error?.response?.status
    if (status === 401 || status === 403) return "Your admin session expired. Please log in again."
    if (status === 404) return "Product was not found. Refresh and try again."
    if (status && status >= 500) return "Server error. Please try again in a moment."
    if (error?.code === "ERR_NETWORK") return "Cannot connect to server. Check backend connection."

    const responseData = error?.response?.data
    if (typeof responseData === "string" && responseData.trim()) return responseData.trim()
    if (typeof responseData?.message === "string" && responseData.message.trim()) return responseData.message.trim()
    if (typeof error?.message === "string" && error.message.trim()) return error.message.trim()
    return fallbackMessage
}

const validateStockValue = (value) => {
    const textValue = String(value ?? "").trim()
    if (!textValue) return "Stock quantity is required."
    if (!/^\d+$/.test(textValue)) return "Stock quantity must be a whole number."

    const numberValue = Number(textValue)
    if (!Number.isInteger(numberValue) || numberValue < 0) return "Stock quantity must be 0 or more."

    return ""
}

export const AdminAdjustStock = () => {
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const [products, setProducts] = useState([])
    const [draftStockById, setDraftStockById] = useState({})
    const [fieldErrorById, setFieldErrorById] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [savingById, setSavingById] = useState({})
    const [saveErrorById, setSaveErrorById] = useState({})
    const [saveSuccessById, setSaveSuccessById] = useState({})

    const loadProducts = useCallback(() => {
        setIsLoading(true)
        setLoadError("")

        axios.get(`${SERVER_HOST}/products`, {headers: {"authorization": localStorage.token}})
            .then((response) => {
                const nextProducts = Array.isArray(response.data) ? response.data : []
                const nextDrafts = {}

                nextProducts.forEach((product) => {
                    nextDrafts[product._id] = String(product.stockQty ?? 0)
                })

                setProducts(nextProducts)
                setDraftStockById(nextDrafts)
                setFieldErrorById({})
            })
            .catch((error) => {
                setProducts([])
                setLoadError(getErrorMessage(error, "Failed to load products. Please try again."))
            })
            .finally(() => setIsLoading(false))
    }, [])

    useEffect(() => {
        if (!isAdmin) return
        loadProducts()
    }, [isAdmin, loadProducts])

    if (!isAdmin) return <Redirect to="/DisplayAllProducts"/>

    const getCurrentStock = (productId) => {
        const product = products.find((item) => item._id === productId)
        return Number(product?.stockQty ?? 0)
    }

    const canSave = (productId) => {
        const draftValue = String(draftStockById[productId] ?? "").trim()
        if (validateStockValue(draftValue)) return false
        return Number(draftValue) !== getCurrentStock(productId)
    }

    const handleDraftChange = (productId, nextValue) => {
        setDraftStockById((current) => ({...current, [productId]: nextValue}))
        setFieldErrorById((current) => ({...current, [productId]: validateStockValue(nextValue)}))
        setSaveErrorById((current) => ({...current, [productId]: ""}))
        setSaveSuccessById((current) => ({...current, [productId]: false}))
    }

    const handleSave = (productId) => {
        const draftValue = String(draftStockById[productId] ?? "").trim()
        const validationError = validateStockValue(draftValue)

        if (validationError) {
            setFieldErrorById((current) => ({...current, [productId]: validationError}))
            setSaveSuccessById((current) => ({...current, [productId]: false}))
            return
        }

        setSavingById((current) => ({...current, [productId]: true}))
        setSaveErrorById((current) => ({...current, [productId]: ""}))
        setSaveSuccessById((current) => ({...current, [productId]: false}))

        axios.put(
            `${SERVER_HOST}/products/${productId}`,
            {stockQty: Number(draftValue)},
            {headers: {"authorization": localStorage.token}}
        )
            .then((response) => {
                if (!response?.data || typeof response.data.stockQty === "undefined") {
                    throw new Error("Failed to save stock quantity.")
                }

                const updatedStock = Number(response.data.stockQty)
                setProducts((currentProducts) => currentProducts.map((product) => {
                    if (product._id !== productId) return product
                    return {...product, stockQty: updatedStock}
                }))
                setDraftStockById((current) => ({...current, [productId]: String(updatedStock)}))
                setFieldErrorById((current) => ({...current, [productId]: ""}))
                setSaveSuccessById((current) => ({...current, [productId]: true}))
            })
            .catch((error) => {
                setSaveErrorById((current) => ({
                    ...current,
                    [productId]: getErrorMessage(error, "Could not update stock for this product.")
                }))
            })
            .finally(() => {
                setSavingById((current) => ({...current, [productId]: false}))
            })
    }

    return (
        <div className="container admin-stock-page">
            <div className="admin-stock-header">
                <h2>Adjust Stock Levels</h2>
                <Link className="blue-button" to="/DisplayAllProducts">Back to catalog</Link>
            </div>

            {loadError ? (
                <div className="admin-stock-global-error" role="alert">
                    <p>{loadError}</p>
                    <button type="button" className="blue-button" onClick={loadProducts}>Retry</button>
                </div>
            ) : null}

            {isLoading ? <div className="admin-stock-empty">Loading products...</div> : null}

            {!isLoading && products.length === 0 && !loadError ? (
                <div className="admin-stock-empty">No products available.</div>
            ) : null}

            {!isLoading && products.length > 0 ? (
                <div className="admin-stock-list">
                    {products.map((product) => (
                        <article key={product._id} className="admin-stock-item">
                            <div className="admin-stock-main">
                                {getFirstImage(product) ? (
                                    <img
                                        className="admin-stock-image"
                                        src={getFirstImage(product)}
                                        alt={product.name}
                                    />
                                ) : (
                                    <div className="admin-stock-image-placeholder">No image</div>
                                )}

                                <div className="admin-stock-meta">
                                    <h3>{product.name}</h3>
                                    <p>Current quantity: {product.stockQty ?? 0}</p>
                                </div>
                            </div>

                            <div className="admin-stock-actions">
                                <input
                                    className={"admin-stock-input" + (fieldErrorById[product._id] ? " admin-stock-input-invalid" : "")}
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={draftStockById[product._id] ?? ""}
                                    onChange={(event) => handleDraftChange(product._id, event.target.value)}
                                    aria-invalid={Boolean(fieldErrorById[product._id])}
                                    aria-describedby={`stock-error-${product._id}`}
                                />

                                <button
                                    type="button"
                                    className="green-button"
                                    onClick={() => handleSave(product._id)}
                                    disabled={Boolean(savingById[product._id]) || !canSave(product._id)}
                                >
                                    {savingById[product._id] ? "Saving..." : "Save"}
                                </button>
                            </div>

                            {fieldErrorById[product._id] ? (
                                <p id={`stock-error-${product._id}`} className="admin-stock-row-error">{fieldErrorById[product._id]}</p>
                            ) : null}

                            {saveErrorById[product._id] ? (
                                <p className="admin-stock-row-error" role="alert">{saveErrorById[product._id]}</p>
                            ) : null}

                            {saveSuccessById[product._id] ? (
                                <p className="admin-stock-row-success" role="status">Stock updated.</p>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
