import React, {useEffect, useMemo, useState} from "react"
import axios from "axios"
import {Link, Redirect} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"


const getFirstImage = (product) => {
    if (!Array.isArray(product.images) || product.images.length === 0) return ""
    return product.images[0] || ""
}

const getErrorMessage = (error, fallbackMessage) => {
    const responseData = error?.response?.data
    if (typeof responseData === "string" && responseData.trim()) return responseData.trim()
    if (typeof responseData?.message === "string" && responseData.message.trim()) return responseData.message.trim()
    return fallbackMessage
}

export const AdminAdjustStock = () => {
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const [products, setProducts] = useState([])
    const [draftStockById, setDraftStockById] = useState({})
    const [isLoading, setIsLoading] = useState(true)
    const [loadError, setLoadError] = useState("")
    const [savingById, setSavingById] = useState({})
    const [saveErrorById, setSaveErrorById] = useState({})
    const [saveSuccessById, setSaveSuccessById] = useState({})

    const authConfig = useMemo(() => ({headers: {"authorization": localStorage.token}}), [])

    useEffect(() => {
        if (!isAdmin) return

        setIsLoading(true)
        setLoadError("")

        axios.get(`${SERVER_HOST}/products`, authConfig)
            .then((response) => {
                const nextProducts = Array.isArray(response.data) ? response.data : []
                setProducts(nextProducts)

                const nextDrafts = {}
                nextProducts.forEach((product) => {
                    nextDrafts[product._id] = String(product.stockQty ?? 0)
                })
                setDraftStockById(nextDrafts)
            })
            .catch((error) => {
                setProducts([])
                setLoadError(getErrorMessage(error, "Failed to load products. Please try again."))
            })
            .finally(() => setIsLoading(false))
    }, [authConfig, isAdmin])

    if (!isAdmin) return <Redirect to="/DisplayAllProducts"/>

    const handleDraftChange = (productId, nextValue) => {
        setDraftStockById((current) => ({...current, [productId]: nextValue}))
        setSaveErrorById((current) => ({...current, [productId]: ""}))
        setSaveSuccessById((current) => ({...current, [productId]: false}))
    }

    const handleSave = (productId) => {
        const nextStock = draftStockById[productId]

        setSavingById((current) => ({...current, [productId]: true}))
        setSaveErrorById((current) => ({...current, [productId]: ""}))
        setSaveSuccessById((current) => ({...current, [productId]: false}))

        axios.put(`${SERVER_HOST}/products/${productId}`, {stockQty: nextStock}, authConfig)
            .then((response) => {
                const updatedStock = response?.data?.stockQty
                setProducts((currentProducts) => currentProducts.map((product) => {
                    if (product._id !== productId) return product
                    return {...product, stockQty: updatedStock}
                }))
                setDraftStockById((current) => ({...current, [productId]: String(updatedStock)}))
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

            {loadError ? <div className="admin-stock-global-error">{loadError}</div> : null}
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
                                    className="admin-stock-input"
                                    type="number"
                                    value={draftStockById[product._id] ?? ""}
                                    onChange={(event) => handleDraftChange(product._id, event.target.value)}
                                />
                                <button
                                    type="button"
                                    className="green-button"
                                    onClick={() => handleSave(product._id)}
                                    disabled={Boolean(savingById[product._id])}
                                >
                                    {savingById[product._id] ? "Saving..." : "Save"}
                                </button>
                            </div>

                            {saveErrorById[product._id] ? (
                                <p className="admin-stock-row-error">{saveErrorById[product._id]}</p>
                            ) : null}

                            {saveSuccessById[product._id] ? (
                                <p className="admin-stock-row-success">Stock updated.</p>
                            ) : null}
                        </article>
                    ))}
                </div>
            ) : null}
        </div>
    )
}
