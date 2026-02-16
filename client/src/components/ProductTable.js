import React from "react"
import {ProductTableRow} from "./ProductTableRow"


export const ProductTable = props => {
    const cars = Array.isArray(props.products) ? props.products : []

    return (
        <table>
            <thead>
            <tr>
                <th>id</th>
                <th>Product</th>
                <th>Price</th>
                <th> </th>
            </tr>
            </thead>
            <tbody>
            {cars.map((product) => <ProductTableRow key={product._id} product={product}/>)}
            </tbody>
        </table>
    )
}