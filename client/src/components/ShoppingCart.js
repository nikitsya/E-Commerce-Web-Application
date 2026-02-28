import React, {useState}  from "react"
import {Link} from "react-router-dom"
import {BuyProduct} from "./BuyProduct"


const formatPrice = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

export const ShoppingCart = ({cartItems, onUpdateQuantity, onRemoveItem, onClearCart}) => {
    const items = Array.isArray(cartItems) ? cartItems : []

    const total = items.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
    }, 0)

    const isLoggedIn = Number(localStorage.accessLevel) > 0 && !!localStorage.token

    const [guestDetails, setGuestDetails] = useState({
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        customerPhone: ""
    })

    const [guestErrors, setGuestErrors] = useState({})

    const handleGuestFieldChange = (field, value) => {
    setGuestDetails((prev) => ({...prev, [field]: value}))
    setGuestErrors((prev) => ({...prev, [field]: ""}))
    }

    const validateGuestDetails = () => {
    const next = {}

    if (!guestDetails.customerName.trim()) next.customerName = "Name is required"
    if (!guestDetails.customerEmail.trim()) next.customerEmail = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.customerEmail)) next.customerEmail = "Invalid email format"

    if (!guestDetails.customerAddress.trim()) next.customerAddress = "Address is required"
    if (!/^\d{7,15}$/.test(guestDetails.customerPhone.trim())) next.customerPhone = "Phone must be 7-15 digits"

    return next
    }


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
                            <div className="cart-item-image-wrap">
                                {item.image
                                    ? <img className="product-thumb cart-item-image" src={item.image} alt={item.name}/>
                                    : <div className="cart-item-no-image">No image</div>
                                }
                            </div>

                            <div className="cart-item-info">
                                <h3>{item.name}</h3>
                                <p><strong>Price:</strong> {formatPrice(price)}</p>

                                <div className="cart-quantity-row">
                                    <button
                                        type="button"
                                        className="blue-button"
                                        onClick={() => onUpdateQuantity(item._id, quantity - 1)}
                                    >
                                        -
                                    </button>
                                    <span className="cart-quantity-value">{quantity}</span>
                                    <button
                                        type="button"
                                        className="blue-button"
                                        onClick={() => onUpdateQuantity(item._id, quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <p><strong>Subtotal:</strong> {formatPrice(subtotal)}</p>

                                <button
                                    type="button"
                                    className="red-button"
                                    onClick={() => onRemoveItem(item._id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>

            <div className="cart-summary">
                <p><strong>Total:</strong> {formatPrice(total)}</p>

                <BuyProduct price={total} items={items} />

                <div className="cart-summary-actions">
                    <button type="button" className="red-button" onClick={onClearCart}>Clear Cart</button>
                    <Link className="green-button" to="/DisplayAllProducts">Continue Shopping</Link>
                </div>
            </div>
        </div>
    )
}
