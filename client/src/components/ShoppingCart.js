import React, {useState} from "react"
import {Link} from "react-router-dom"
import {BuyProduct} from "./BuyProduct"


const formatPrice = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

export const ShoppingCart = ({cartItems, onUpdateQuantity, onRemoveItem, onClearCart}) => {
    // Defensive fallback when parent has not loaded cart items yet.
    const items = Array.isArray(cartItems) ? cartItems : []

    // Aggregate cart total used in order summary and PayPal amount.
    const total = items.reduce((sum, item) => {
        const price = Number(item.price) || 0
        const quantity = Number(item.quantity) || 0
        return sum + (price * quantity)
    }, 0)

    // Logged-in users can skip guest details form.
    const isLoggedIn = Number(localStorage.accessLevel) > 0 && !!localStorage.token

    // Guest checkout contact fields sent to backend guest sales endpoint.
    const [guestDetails, setGuestDetails] = useState({
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        customerPhone: ""
    })

    // Field-level guest validation errors shown under corresponding inputs.
    const [guestErrors, setGuestErrors] = useState({})

    const handleGuestFieldChange = (field, value) => {
        // Update one field and clear that field's previous error.
        setGuestDetails((prev) => ({...prev, [field]: value}))
        setGuestErrors((prev) => ({...prev, [field]: ""}))
    }

    const validateGuestDetails = () => {
        // Build full validation map for guest checkout gating.
        const next = {}

        if (!guestDetails.customerName.trim()) next.customerName = "Name is required"
        if (!guestDetails.customerEmail.trim()) next.customerEmail = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestDetails.customerEmail)) next.customerEmail = "Invalid email format"

        if (!guestDetails.customerAddress.trim()) next.customerAddress = "Address is required"
        if (!/^\d{7,15}$/.test(guestDetails.customerPhone.trim())) next.customerPhone = "Phone must be 7-15 digits"

        return next
    }

    // Guests can proceed only when all required fields are valid.
    const guestValidationErrors = !isLoggedIn ? validateGuestDetails() : {}
    const canPayAsGuest = isLoggedIn || Object.keys(guestValidationErrors).length === 0

    // Dedicated empty-cart state instead of checkout layout.
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
        <div className="form-container cart-page">
            <h2>Shopping Cart</h2>

            <div className="cart-list">
                {items.map((item) => {
                    // Per-item calculated values for display.
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
                                    {/* Quantity is managed by cart hook callbacks passed from App */}
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

                {/* Guest form is shown only for non-authenticated checkout */}
                {!isLoggedIn ? (
                    <div className="form-container">
                        <h3>Guest Checkout Details</h3>

                        <input
                            className={guestErrors.customerName ? "field-error" : ""}
                            type="text"
                            placeholder="Name"
                            value={guestDetails.customerName}
                            onChange={(e) => handleGuestFieldChange("customerName", e.target.value)}
                        />
                        {guestErrors.customerName ? <div className="error-text">{guestErrors.customerName}</div> : null}

                        <input
                            className={guestErrors.customerEmail ? "field-error" : ""}
                            type="email"
                            placeholder="Email"
                            value={guestDetails.customerEmail}
                            onChange={(e) => handleGuestFieldChange("customerEmail", e.target.value)}
                        />
                        {guestErrors.customerEmail ?
                            <div className="error-text">{guestErrors.customerEmail}</div> : null}

                        <input
                            className={guestErrors.customerAddress ? "field-error" : ""}
                            type="text"
                            placeholder="Address"
                            value={guestDetails.customerAddress}
                            onChange={(e) => handleGuestFieldChange("customerAddress", e.target.value)}
                        />
                        {guestErrors.customerAddress ?
                            <div className="error-text">{guestErrors.customerAddress}</div> : null}

                        <input
                            className={guestErrors.customerPhone ? "field-error" : ""}
                            type="text"
                            placeholder="Phone"
                            value={guestDetails.customerPhone}
                            onChange={(e) => handleGuestFieldChange("customerPhone", e.target.value)}
                        />
                        {guestErrors.customerPhone ?
                            <div className="error-text">{guestErrors.customerPhone}</div> : null}
                    </div>
                ) : null}

                {/* Render PayPal checkout only when current checkout mode is valid */}
                {canPayAsGuest
                    ? (<BuyProduct price={total} items={items} guestDetails={guestDetails}/>)
                    : (<div className="error-text">Please fill in all guest checkout fields correctly before
                        payment.</div>)
                }

                <div className="cart-summary-actions">
                    {/* Global cart actions */}
                    <button type="button" className="red-button" onClick={onClearCart}>Clear Cart</button>
                    <Link className="green-button" to="/DisplayAllProducts">Continue Shopping</Link>
                </div>
            </div>
        </div>
    )
}
