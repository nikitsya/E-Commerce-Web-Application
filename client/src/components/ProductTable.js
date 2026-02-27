import React, {useState} from "react"
import {ProductTableRow} from "./ProductTableRow"
import {ProductDetailsModal} from "./ProductDetailsModal";


export const ProductTable = props => {
    const products = Array.isArray(props.products) ? props.products : []
    const cartItems = Array.isArray(props.cartItems) ? props.cartItems : []
    const [selectedProduct, setSelectedProduct] = useState(null)
    const [sortConfig, setSortConfig] = useState({column: "name", direction: "asc"})
    const onAddToCart = props.onAddToCart
    const cartProductIdSet = new Set(cartItems.map((item) => item._id))

    const handleSort = (column) => {
        setSortConfig((previousConfig) => {
            if (previousConfig.column === column) {
                return {
                    column,
                    direction: previousConfig.direction === "asc" ? "desc" : "asc"
                }
            }

            return {
                column,
                direction: "asc"
            }
        })
    }

    const getSortIndicator = (column) => {
        if (sortConfig.column !== column) {
            return ""
        }

        return sortConfig.direction === "asc" ? "▲" : "▼"
    }

    const sortedProducts = [...products].sort((firstProduct, secondProduct) => {
        const directionFactor = sortConfig.direction === "asc" ? 1 : -1

        if (sortConfig.column === "price") {
            return ((Number(firstProduct.price) || 0) - (Number(secondProduct.price) || 0)) * directionFactor
        }

        if (sortConfig.column === "capacityMl") {
            return ((Number(firstProduct.capacityMl) || 0) - (Number(secondProduct.capacityMl) || 0)) * directionFactor
        }

        const firstValue = (firstProduct[sortConfig.column] || "").toString()
        const secondValue = (secondProduct[sortConfig.column] || "").toString()
        return firstValue.localeCompare(secondValue) * directionFactor
    })

    return (
        <>
            <table>
                <thead>
                <tr>
                    <th></th>
                    <th>
                        <button type="button" className="table-sort-btn" onClick={() => handleSort("name")}>
                            Product Name {getSortIndicator("name")}
                        </button>
                    </th>
                    <th>
                        <button type="button" className="table-sort-btn" onClick={() => handleSort("price")}>
                            Price {getSortIndicator("price")}
                        </button>
                    </th>
                    <th>
                        <button type="button" className="table-sort-btn" onClick={() => handleSort("capacityMl")}>
                            Capacity (ml) {getSortIndicator("capacityMl")}
                        </button>
                    </th>
                    <th>
                        <button type="button" className="table-sort-btn" onClick={() => handleSort("material")}>
                            Material {getSortIndicator("material")}
                        </button>
                    </th>
                    <th>
                        <button type="button" className="table-sort-btn" onClick={() => handleSort("color")}>
                            Color {getSortIndicator("color")}
                        </button>
                    </th>
                    <th></th>
                </tr>
                </thead>

                <tbody>{sortedProducts.map((product) => <ProductTableRow key={product._id} product={product}
                                                                         onOpenDetails={setSelectedProduct}
                                                                         isInCart={cartProductIdSet.has(product._id)}
                                                                         onAddToCart={onAddToCart}/>)}</tbody>
            </table>

            <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)}
                                 isInCart={selectedProduct ? cartProductIdSet.has(selectedProduct._id) : false}
                                 onAddToCart={onAddToCart}
            />
        </>
    )
}
