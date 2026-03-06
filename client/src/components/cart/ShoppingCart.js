import React, {useRef, useState} from "react"
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
    // Quantity badge/count should represent units, not unique product rows.
    const totalItemQuantity = items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

    // Logged-in users can skip guest details form.
    const isLoggedIn = Number(localStorage.accessLevel) > 0 && !!localStorage.token

    // Guest checkout contact fields sent to backend guest sales endpoint.
    const [guestDetails, setGuestDetails] = useState({
        customerName: "",
        customerEmail: "",
        customerAddress: "",
        customerPhone: ""
    })
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
    const checkoutPanelRef = useRef(null)

    const handleGuestFieldChange = (field, value) => {
        // Update one guest field in a predictable way.
        setGuestDetails((prev) => ({...prev, [field]: value}))
    }

    const handleOpenCheckout = () => {
        // Keep summary compact until user explicitly opens checkout.
        setIsCheckoutOpen(true)
        setTimeout(() => {
            if (checkoutPanelRef.current) {
                // Reveal the checkout section after it mounts.
                checkoutPanelRef.current.scrollIntoView({behavior: "smooth", block: "start"})
            }
        }, 0)
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
            <div className="form-container cart-empty">
                <h2>Shopping Cart</h2>
                <p>Your cart is empty. Add your first bottle to get started.</p>
                <Link className="green-button cart-empty-link" to="/DisplayAllProducts">Explore Products</Link>
            </div>
        )
    }

    return (
        <div className="form-container cart-page">
            <div className="cart-title-row">
                <h2>Shopping Cart</h2>
            </div>

            <div className="cart-list">
                {items.map((item) => {
                    // Per-item calculated values for display.
                    const price = Number(item.price)
                    const quantity = Number(item.quantity) || 1
                    const stockQty = Math.max(0, Math.floor(Number(item.stockQty)))
                    const isAtStockLimit = stockQty <= 0 || quantity >= stockQty
                    const subtotal = price * quantity

                    return (
                        <article className="cart-item" key={item._id}>
                            <div className="cart-item-image-wrap">
                                {item.image
                                    ? <img className="product-thumb cart-item-image" src={item.image} alt={item.name}/>
                                    : <div className="cart-item-no-image">No image</div>
                                }
                            </div>

                            <div className="cart-item-info">
                                <div className="cart-item-head">
                                    <h3>{item.name}</h3>
                                    <p className="cart-item-unit-price">{formatPrice(price)}</p>
                                </div>
                                <p className="cart-item-unit-label">Unit price</p>

                                <div className="cart-quantity-row">
                                    <button
                                        type="button"
                                        className="cart-qty-button"
                                        aria-label={`Decrease quantity for ${item.name}`}
                                        onClick={() => onUpdateQuantity(item._id, quantity - 1)}
                                    >
                                        -
                                    </button>
                                    <span className="cart-quantity-value">{quantity}</span>
                                    <button
                                        type="button"
                                        className="cart-qty-button"
                                        aria-label={`Increase quantity for ${item.name}`}
                                        title={isAtStockLimit ? "Stock limit reached" : "Increase quantity"}
                                        disabled={isAtStockLimit}
                                        onClick={() => onUpdateQuantity(item._id, quantity + 1)}
                                    >
                                        +
                                    </button>
                                </div>

                                <p className="cart-item-subtotal"><span>Subtotal</span> <strong>{formatPrice(subtotal)}</strong>
                                </p>

                                <button
                                    type="button"
                                    className="red-button cart-item-remove"
                                    onClick={() => onRemoveItem(item._id)}
                                >
                                    Remove
                                </button>
                            </div>
                        </article>
                    )
                })}
            </div>

            <aside className="cart-summary">
                <div className="cart-summary-head">
                    <h3>Order Summary</h3>
                    <p>Ready for checkout</p>
                </div>

                <div className="cart-summary-line">
                    <span>Items</span>
                    <strong>{totalItemQuantity}</strong>
                </div>
                <div className="cart-summary-line">
                    <span>Subtotal</span>
                    <strong>{formatPrice(total)}</strong>
                </div>
                <div className="cart-summary-line">
                    <span>Shipping</span>
                    <span className="cart-summary-muted">Calculated at checkout</span>
                </div>
                <div className="cart-summary-total">
                    <span>Total</span>
                    <strong>{formatPrice(total)}</strong>
                </div>

                <button type="button" className="green-button cart-checkout-button" onClick={handleOpenCheckout}>
                    {isCheckoutOpen ? "Checkout Open" : "Proceed to Checkout"}
                </button>
                {!isCheckoutOpen ? <p className="cart-checkout-note">Secure PayPal checkout is ready.</p> : null}

                {/* Checkout details and payment controls are intentionally hidden until the user opens checkout. */}
                {isCheckoutOpen ? (
                    <div className="cart-checkout-panel" ref={checkoutPanelRef}>
                        {!isLoggedIn ? (
                            <div className="cart-guest-card">
                                <h4>Guest Checkout Details</h4>
                                <p>Enter your contact details to continue.</p>

                                <input
                                    className={guestValidationErrors.customerName ? "field-error" : ""}
                                    type="text"
                                    placeholder="Name"
                                    value={guestDetails.customerName}
                                    onChange={(e) => handleGuestFieldChange("customerName", e.target.value)}
                                />
                                {guestValidationErrors.customerName ?
                                    <div className="error-text">{guestValidationErrors.customerName}</div> : null}

                                <input
                                    className={guestValidationErrors.customerEmail ? "field-error" : ""}
                                    type="email"
                                    placeholder="Email"
                                    value={guestDetails.customerEmail}
                                    onChange={(e) => handleGuestFieldChange("customerEmail", e.target.value)}
                                />
                                {guestValidationErrors.customerEmail ?
                                    <div className="error-text">{guestValidationErrors.customerEmail}</div> : null}

                                <input
                                    className={guestValidationErrors.customerAddress ? "field-error" : ""}
                                    type="text"
                                    placeholder="Address"
                                    value={guestDetails.customerAddress}
                                    onChange={(e) => handleGuestFieldChange("customerAddress", e.target.value)}
                                />
                                {guestValidationErrors.customerAddress ?
                                    <div className="error-text">{guestValidationErrors.customerAddress}</div> : null}

                                <input
                                    className={guestValidationErrors.customerPhone ? "field-error" : ""}
                                    type="text"
                                    placeholder="Phone"
                                    value={guestDetails.customerPhone}
                                    onChange={(e) => handleGuestFieldChange("customerPhone", e.target.value)}
                                />
                                {guestValidationErrors.customerPhone ?
                                    <div className="error-text">{guestValidationErrors.customerPhone}</div> : null}
                            </div>
                        ) : null}

                        <div className="cart-payment-wrap">
                            {canPayAsGuest
                                ? (<BuyProduct price={total} items={items} guestDetails={guestDetails}/>)
                                : (<div className="error-text">Please fill in all guest checkout fields correctly before
                                    payment.</div>)
                            }
                        </div>
                    </div>
                ) : null}

                <div className="cart-summary-actions">
                    <button type="button" className="red-button" onClick={onClearCart}>Clear Cart</button>
                    <Link className="green-button" to="/DisplayAllProducts">Continue Shopping</Link>
                </div>
            </aside>
        </div>
    )
}
