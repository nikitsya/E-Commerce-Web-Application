import React from "react"
import {Link} from "react-router-dom"
import { ACCESS_LEVEL_ADMIN } from "../config/global_constants"


export const ProductTableRow = props => {
    const { product, onOpenDetails } = props;
    const onAddToCart = props.onAddToCart
    const canAddToCart = typeof onAddToCart === "function"
    const isAdmin = Number(sessionStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
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
            <td data-label="Product Name">{props.product.name}</td>
            <td data-label="Price">{props.product.price}</td>
            <td data-label="Images">{firstImage ? <img className="product-thumb" src={firstImage} alt={props.product.name} /> : "-"}</td>
            
            <td data-label="Capacity (ml)">{props.product.capacityMl ?? "-"}</td>
            <td data-label="Material">{props.product.material || "-"}</td>
            <td data-label="Color">{props.product.color || "-"}</td>
            <td data-label="Actions" onClick={stopRowClick}>
            {canAddToCart ? (
                <button
                    type="button"
                    className="icon-button add-to-cart-icon-button"
                    onClick={handleAddToCartClick}
                    aria-label="Add to Cart"
                    title="Add to Cart"
                >
                    <img className="add-to-cart-icon" src="/images/buttons/add-to-cart.png" alt="Add to Cart"/>
                </button>
            ) : null}

            {/* Edit and Delete only for ADMIN */}
            {isAdmin ? 
                <Link className="green-button" to={"/EditProduct/" + props.product._id}>Edit</Link> : null}  
            {isAdmin ?    
                <Link className="red-button" to={"/DeleteProduct/" + props.product._id}>Delete</Link> : null}  
            </td>
        </tr>
    )
}
