import React, {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {ACCESS_LEVEL_ADMIN} from "../../config/global_constants"


const formatPrice = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

export const ProductDetailsModal = ({
                                        product,
                                        onClose,
                                        onAddToCart,
                                        onRequestDelete,
                                        isInCart = false,
                                        cartQuantity = 0
                                    }) => {

    const [selectedImageIndex, setSelectedImageIndex] = useState(0)

    useEffect(() => {
        if (!product) return

        // Lock page scrolling while modal is open.
        const originalBodyOverflow = document.body.style.overflow
        const originalHtmlOverflow = document.documentElement.style.overflow

        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        // Restore original scroll behavior when modal closes/unmounts.
        return () => {
            document.body.style.overflow = originalBodyOverflow
            document.documentElement.style.overflow = originalHtmlOverflow
        }
    }, [product])

    useEffect(() => {
        setSelectedImageIndex(0)
    }, [product?._id])

    // Render nothing when no product is selected.
    if (!product) return null;

    // Normalize image data and split into hero + thumbnail gallery.
    const images = Array.isArray(product.images) ? product.images : []
    const selectedImage = images.length > 0 ? images[selectedImageIndex] || images[0] : ""

    // Display fallback when optional fields are missing.
    const capacityValue = product.capacityMl === null || typeof product.capacityMl === "undefined" ? "-" : `${product.capacityMl} ml`
    // Admin-only actions are shown based on access level in localStorage.
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const canAddToCart = typeof onAddToCart === "function"
    const canDeleteProduct = typeof onRequestDelete === "function"
    const stockQty = Number.isFinite(Number(product.stockQty)) ? Math.max(0, Math.floor(Number(product.stockQty))) : 0
    const isAtStockLimit = cartQuantity >= stockQty
    const isCartActionBlocked = !isInCart && (stockQty <= 0 || isAtStockLimit)
    const addToCartLabel = isInCart
        ? "Remove from Cart"
        : (stockQty <= 0 ? "Out of Stock" : (isAtStockLimit ? "Stock Limit Reached" : "Add to Cart"))
    const handleAddToCart = () => {
        if (!canAddToCart || isCartActionBlocked) return
        onAddToCart(product)
    }
    const handleDeleteClick = () => {
        if (!canDeleteProduct) return
        onRequestDelete(product)
    }

    return (
        // Clicking backdrop closes modal.
        <div className="modal-overlay" onClick={onClose}>
            {/* Stop click bubbling so interactions inside modal do not close it */}
            <div className="modal-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true"
                 aria-label={product.name}>
                <div className="modal-hero">
                    {selectedImage
                        ? (<img className="modal-hero-image" src={selectedImage} alt={product.name}/>)
                        : (<div className="modal-hero-empty">No image available</div>)
                    }
                </div>

                <div className="modal-content">
                    <div className="modal-header">
                        <h3>{product.name}</h3>
                        <button type="button" className="blue-button modal-close-btn" onClick={onClose}>Close</button>
                    </div>

                    <div className="modal-stats">
                        <span className="modal-stat">{formatPrice(product.price)}</span>
                        <span className="modal-stat">{capacityValue}</span>
                        <span className="modal-stat">{product.material || "-"}</span>
                        <span className="modal-stat">{product.color || "-"}</span>
                    </div>

                    <p className="modal-description">{product.description || "-"}</p>

                    {/* Product gallery thumbnails: click any thumbnail to make it the hero image */}
                    {images.length > 1 ? (
                        <div className="modal-images">
                            {images.map((src, i) => (
                                <button
                                    key={i}
                                    type="button"
                                    className={"modal-thumb-button " + (i === selectedImageIndex ? "is-active" : "")}
                                    onClick={() => setSelectedImageIndex(i)}
                                    aria-label={`Show image ${i + 1}`}
                                >
                                    <img className="modal-thumb" src={src} alt={`${product.name}-image-${i + 1}`}/>
                                </button>
                            ))}
                        </div>
                    ) : null}


                    <div className="modal-actions">
                        {/* Customer action: add item to cart */}
                        {canAddToCart ? (
                            <button
                                type="button"
                                className="icon-button add-to-cart-icon-button"
                                onClick={handleAddToCart}
                                disabled={isCartActionBlocked}
                                aria-label={addToCartLabel}
                                title={addToCartLabel}
                            >
                                <img
                                    className="add-to-cart-icon"
                                    src={isInCart ? "/images/buttons/added_to_cart.png" : "/images/buttons/add-to-cart.png"}
                                    alt={addToCartLabel}
                                />
                            </button>
                        ) : null}
                        {/* Admin actions: edit/delete selected product */}
                        {isAdmin ? <Link className="green-button" to={"/EditProduct/" + product._id}>Edit</Link> : null}
                        {isAdmin && canDeleteProduct ? (
                            <button type="button" className="red-button" onClick={handleDeleteClick}>Delete</button>
                        ) : null}
                    </div>
                </div>
            </div>
        </div>
    )
}
