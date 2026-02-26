import React, {useState} from "react"
import {ProductTableRow} from "./ProductTableRow"
import {ProductDetailsModal} from "./ProductDetailsModal";


export const ProductTable = props => {
    const products = Array.isArray(props.products) ? props.products : []
    const [selectedProduct, setSelectedProduct] = useState(null)
    const onAddToCart = props.onAddToCart

    return (
        <>
            <table>
                <thead>
                <tr>
                    <th>Product Name</th>
                    <th>Price</th>
                    <th>Images</th>

                    <th>Capacity (ml)</th>
                    <th>Material</th>
                    <th>Color</th>
                    <th></th>
                </tr>
                </thead>

                <tbody>{products.map((product) => <ProductTableRow key={product._id} product={product}
                                                                   onOpenDetails={setSelectedProduct}
                                                                   onAddToCart={onAddToCart}/>)}</tbody>
            </table>

            <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)}
                                 onAddToCart={onAddToCart}
            />
        </>
    )
}
