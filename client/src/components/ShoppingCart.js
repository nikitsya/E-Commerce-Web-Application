import React from "react"

export const ShoppingCart = ({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) => {
    const items = Array.isArray(cartItems) ? cartItems : []

    return (
        <div className="form-container">
            <h2>Shopping Cart</h2>
        </div>
    )
}
