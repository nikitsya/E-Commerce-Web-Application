import React from "react"
import {Link} from "react-router-dom";

const formatPrice = (value) => Number(value).toFixed(2)

export const ShoppingCart = ({ cartItems, onUpdateQuantity, onRemoveItem, onClearCart }) => {
    const items = Array.isArray(cartItems) ? cartItems : []

    const total = items.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
    }, 0)

    if (items.length === 0) {
        return (
            <div className="form-container">
                <h2>Shopping Cart</h2>
                <p>Your cart is empty.</p>
                <Link className="green-button" to="/DisplayAllProducts">Continue Shopping</Link>
            </div>
        )
    }

    return (
        <div className="form-container">
            <h2>Shopping Cart</h2>

            <div className="cart-list">
                {items.map((item) => {
                    const price = Number(item.price)
                    const quantity = Number(item.quantity) || 1
                    const subtotal = price * quantity

                    return (
                        <div className="cart-item" key={item._id}>
                            <h3>{item.name}</h3>

                            <div className="cart-item-image-wrap">
                                {item.image
                                    ? <img className="product-thumb cart-item-image" src={item.image} alt={item.name} />
                                    : <div className="cart-item-no-image">No image</div>
                                }
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="cart-summary">
                <p><strong>Total:</strong> ${formatPrice(total)}</p>
                <div className="cart-summary-actions">
                    <button type="button" className="red-button" onClick={onClearCart}>Clear Cart</button>
                    <Link className="green-button" to="/DisplayAllProducts">Continue Shopping</Link>
                </div>
            </div>

        </div>
    )
}
