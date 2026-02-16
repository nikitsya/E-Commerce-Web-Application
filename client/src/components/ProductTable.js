import React from "react"
import {ProductTableRow} from "./ProductTableRow"


export const ProductTable = props => {
    const products = Array.isArray(props.products) ? props.products : []

    return (
        <table>
            <thead>
            <tr>
                <th>id</th>
                <th>Product Name</th>
                <th>Price</th>
                <th> </th>
            </tr>
            </thead>
            <tbody>{products.map((product) => <ProductTableRow key={product._id} product={product}/>)}</tbody>
        </table>
    )
}
