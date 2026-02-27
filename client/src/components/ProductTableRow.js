import React from "react"
import {Link} from "react-router-dom"
import {ACCESS_LEVEL_ADMIN} from "../config/global_constants"

const formatPrice = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

export const ProductTableRow = props => {
    const {product, onOpenDetails, isInCart = false} = props;
    const onAddToCart = props.onAddToCart
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const canAddToCart = !isAdmin && typeof onAddToCart === "function"
    const images = Array.isArray(props.product.images) ? props.product.images : []
    const firstImage = images.length > 0 ? images[0] : ""

    const handleRowClick = () => onOpenDetails(product)

    const stopRowClick = (e) => e.stopPropagation()
    const handleAddToCartClick = (e) => {
        e.stopPropagation()
        if (onAddToCart) {
            onAddToCart(product)
        }
    }


    return (
        <tr onClick={handleRowClick} className="product-row-clickable">
            <td data-label="Images">{firstImage ?
                <img className="product-thumb" src={firstImage} alt={props.product.name}/> : "-"}</td>
            <td data-label="Product Name">{props.product.name}</td>
            <td data-label="Price">{formatPrice(props.product.price)}</td>

            <td data-label="Capacity (ml)">{props.product.capacityMl ?? "-"}</td>
            <td data-label="Material">{props.product.material || "-"}</td>
            <td data-label="Color">{props.product.color || "-"}</td>
            <td data-label="Actions" onClick={stopRowClick}>
                <div className={"product-actions-wrap " + (isAdmin ? "admin-actions-wrap" : "")}>
                    {canAddToCart ? (
                        <button
                            type="button"
                            className="icon-button add-to-cart-icon-button"
                            onClick={handleAddToCartClick}
                            aria-label={isInCart ? "Added to Cart" : "Add to Cart"}
                            title={isInCart ? "Added to Cart" : "Add to Cart"}
                        >
                            <img
                                className="add-to-cart-icon"
                                src={isInCart ? "/images/buttons/added_to_cart.png" : "/images/buttons/add-to-cart.png"}
                                alt={isInCart ? "Added to Cart" : "Add to Cart"}
                            />
                        </button>
                    ) : null}

                    {isAdmin ? (
                        <Link
                            className="icon-button admin-action-link"
                            to={"/EditProduct/" + props.product._id}
                            aria-label="Edit product"
                            title="Edit product"
                        >
                            <img className="admin-action-icon" src="/images/buttons/admin/edit.png" alt="Edit"/>
                        </Link>
                    ) : null}

                    {isAdmin ? (
                        <Link
                            className="icon-button admin-action-link"
                            to={"/DeleteProduct/" + props.product._id}
                            aria-label="Delete product"
                            title="Delete product"
                        >
                            <img className="admin-action-icon" src="/images/buttons/admin/delete.png" alt="Delete"/>
                        </Link>
                    ) : null}
                </div>
            </td>
        </tr>
    )
}
