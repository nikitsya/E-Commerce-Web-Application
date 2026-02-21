import React from "react"
import {Link} from "react-router-dom"
import { ACCESS_LEVEL_ADMIN } from "../config/global_constants"



export const ProductTableRow = props => {
    const { product, onOpenDetails } = props;
    const images = Array.isArray(props.product.images) ? props.product.images : []
    const firstImage = images.length > 0 ? images[0] : ""

    const handleRowClick = () => onOpenDetails(product)

    const stopRowClick = (e) => e.stopPropagation()


    return (
        <tr onClick={handleRowClick} className="product-row-clickable">
            <td data-label="Product Name">{props.product.name}</td>
            <td data-label="Price">{props.product.price}</td>
            <td data-label="Images">{firstImage ? <img className="product-thumb" src={firstImage} alt={props.product.name} /> : "-"}</td>
            
            <td data-label="Capacity (ml)">{props.product.capacityMl ?? "-"}</td>
            <td data-label="Material">{props.product.material || "-"}</td>
            <td data-label="Color">{props.product.color || "-"}</td>
            <td data-label="Actions" onClick={stopRowClick}>

            {/* Edit and Delete only for ADMIN */}
            {sessionStorage.accessLevel >= ACCESS_LEVEL_ADMIN ? 
                <Link className="green-button" to={"/EditProduct/" + props.product._id}>Edit</Link> : null}  
            {sessionStorage.accessLevel >= ACCESS_LEVEL_ADMIN ?    
                <Link className="red-button" to={"/DeleteProduct/" + props.product._id}>Delete</Link> : null}  
            </td>
        </tr>
    )
}
