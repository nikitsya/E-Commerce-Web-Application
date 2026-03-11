import React from "react"
import {Link} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN} from "../../config/global_constants"
import {resolveImageSrc} from "../../utils/resolveImageSrc"

const formatPrice = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

export const ProductTableRow = props => {
    // Row receives selected product and callbacks from ProductTable.
    const {product, onOpenDetails, isInCart = false, cartQuantity = 0} = props;
    const onAddToCart = props.onAddToCart
    const onRequestDelete = props.onRequestDelete
    // Admin view shows edit/delete actions instead of add-to-cart.
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const canAddToCart = !isAdmin && typeof onAddToCart === "function"
    const stockQty = Number.isFinite(Number(product.stockQty)) ? Math.max(0, Math.floor(Number(product.stockQty))) : 0
    const isAtStockLimit = cartQuantity >= stockQty
    const isCartActionBlocked = !isInCart && (stockQty <= 0 || isAtStockLimit)
    const addToCartLabel = isInCart
        ? "Remove from Cart"
        : (stockQty <= 0 ? "Out of Stock" : (isAtStockLimit ? "Stock Limit Reached" : "Add to Cart"))
    // First image is used as table thumbnail preview.
    const images = Array.isArray(product.images) ? product.images : []
    const firstImage = images.length > 0 ? resolveImageSrc(images[0]) : ""

    // Clicking any non-action area of the row opens product details modal.
    const handleRowClick = () => onOpenDetails(product)
    // Action cell/button clicks should not trigger modal open.
    const stopRowClick = (e) => e.stopPropagation()
    const handleAddToCartClick = (e) => {
        e.stopPropagation()
        if (isCartActionBlocked) return
        if (onAddToCart) onAddToCart(product)
    }
    const handleDeleteClick = (e) => {
        e.stopPropagation()
        if (typeof onRequestDelete === "function") onRequestDelete(product)
    }

    return (
        <tr onClick={handleRowClick} className="product-row-clickable">
            <td data-label="Images">{firstImage
                ? <img className="product-thumb" src={firstImage} alt={product.name}/>
                : "-"}
            </td>
            <td data-label="Product Name">{product.name}</td>
            <td data-label="Price">{formatPrice(product.price)}</td>
            <td data-label="Capacity (ml)">{product.capacityMl ?? "-"}</td>
            <td data-label="Material">{product.material || "-"}</td>
            <td data-label="Color">{product.color || "-"}</td>
            <td data-label="Actions" onClick={stopRowClick}>
                <div className={"product-actions-wrap " + (isAdmin ? "admin-actions-wrap" : "")}>
                    {/* Customer action: add product to cart */}
                    {canAddToCart ? (
                        <button
                            type="button"
                            className="icon-button add-to-cart-icon-button"
                            onClick={handleAddToCartClick}
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

                    {/* Admin actions: edit link and delete confirmation trigger */}
                    {isAdmin ? (
                        <Link
                            className="icon-button admin-action-link"
                            to={"/EditProduct/" + product._id}
                            aria-label="Edit product"
                            title="Edit product"
                        >
                            <img className="admin-action-icon" src="/images/buttons/admin/edit.png" alt="Edit"/>
                        </Link>
                    ) : null}

                    {isAdmin ? (
                        <button
                            type="button"
                            className="icon-button admin-action-link"
                            onClick={handleDeleteClick}
                            aria-label="Delete product"
                            title="Delete product"
                        >
                            <img className="admin-action-icon" src="/images/buttons/admin/delete.png" alt="Delete"/>
                        </button>
                    ) : null}
                </div>
            </td>
        </tr>
    )
}
