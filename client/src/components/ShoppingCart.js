import React from "react"

export const ShoppingCart = ({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) => {
    const items = Array.isArray(cartItems) ? cartItems : []

    const total = items.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
    }, 0)

    return (
        <div className="form-container">
            <h2>Shopping Cart</h2>
        </div>
    )
}
