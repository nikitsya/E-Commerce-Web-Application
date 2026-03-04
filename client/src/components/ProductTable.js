import React, {useState} from "react"
import {ProductTableRow} from "./ProductTableRow"
import {ProductDetailsModal} from "./ProductDetailsModal";


export const ProductTable = props => {
    // Defensive normalization for incoming props.
    const products = Array.isArray(props.products) ? props.products : []
    const cartItems = Array.isArray(props.cartItems) ? props.cartItems : []
    // Selected row product is displayed in details modal.
    const [selectedProduct, setSelectedProduct] = useState(null)
    const sortConfig = props.sortConfig || {column: "name", direction: "asc"}
    const onSortChange = props.onSortChange || (() => {})
    const onAddToCart = props.onAddToCart
    // Fast lookup for "already in cart" state by product id.
    const cartProductIdSet = new Set(cartItems.map((item) => item._id))
    const cartQuantityByProductId = new Map(
        cartItems.map((item) => [item._id, Number(item.quantity) || 0])
    )

    const handleSort = (column) => {
        // Toggle sort direction when same column is clicked, otherwise reset to ascending.
        onSortChange((previousConfig) => {
            if (previousConfig.column === column) {
                return { column, direction: previousConfig.direction === "asc" ? "desc" : "asc"}
            }
            return { column, direction: "asc" }
        })
    }

    const getSortIndicator = (column) => {
        if (sortConfig.column !== column) return ""
        return sortConfig.direction === "asc" ? "▲" : "▼"
    }

    // Sorting keeps numeric columns numeric and other columns lexical.
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

                <tbody>
                {sortedProducts.map((product) => <ProductTableRow key={product._id} product={product}
                                                                  onOpenDetails={setSelectedProduct}
                                                                  isInCart={cartProductIdSet.has(product._id)}
                                                                  cartQuantity={cartQuantityByProductId.get(product._id) || 0}
                                                                  onAddToCart={onAddToCart}/>)}
                </tbody>
            </table>

            {/* Details modal opens when a row sets selectedProduct */}
            <ProductDetailsModal product={selectedProduct} onClose={() => setSelectedProduct(null)}
                                 isInCart={selectedProduct ? cartProductIdSet.has(selectedProduct._id) : false}
                                 cartQuantity={selectedProduct ? (cartQuantityByProductId.get(selectedProduct._id) || 0) : 0}
                                 onAddToCart={onAddToCart}
            />
        </>
    )
}
