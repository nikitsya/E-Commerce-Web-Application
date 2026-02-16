import React from "react"
import {Link} from "react-router-dom"


export const ProductTableRow = props => {
    return (
        <tr>
            <td>{props.product._id}</td>
            <td>{props.product.product}</td>
            <td>{props.product.price}</td>
            <td>
                <Link className="green-button" to={"/EditProduct/" + props.product._id}>Edit</Link>
                <Link className="red-button" to={"/DeleteProduct/" + props.product._id}>Delete</Link>
            </td>
        </tr>
    )
}