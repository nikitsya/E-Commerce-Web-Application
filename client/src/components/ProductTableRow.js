import React from "react"
import {Link} from "react-router-dom"


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
            
                <Link className="green-button" to={"/EditProduct/" + props.product._id}>Edit</Link>
                <Link className="red-button" to={"/DeleteProduct/" + props.product._id}>Delete</Link>
            </td>
        </tr>
    )
}
