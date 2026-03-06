import React from "react"
import {Link} from "react-router-dom"


// Centralized copy and CTA config for each PayPal checkout result state.
const STATUS_CONTENT = {
    SUCCESS: {
        heading: "Payment Completed",
        subtitle: "Your order has been confirmed.",
        message: "Your PayPal transaction was successful. We are preparing your order now.",
        badge: "Success",
        toneClass: "paypal-tone-success",
        primaryButtonClass: "green-button",
        primaryButton: "Continue Shopping",
        primaryTarget: "/DisplayAllProducts",
        secondaryButton: "Back to Cart",
        secondaryTarget: "/Cart"
    },
    CANCEL: {
        heading: "Payment Cancelled",
        subtitle: "",
        message: "You cancelled the PayPal checkout before payment was completed.",
        badge: "",
        toneClass: "paypal-tone-cancel",
        primaryButtonClass: "red-button",
        primaryButton: "Try Checkout Again",
        primaryTarget: "/Cart",
        secondaryButton: "Continue Shopping",
        secondaryTarget: "/DisplayAllProducts"
    },
    ERROR: {
        heading: "Payment Error",
        subtitle: "Checkout did not complete.",
        message: "An error happened while processing your PayPal transaction. Please try again.",
        badge: "Error",
        toneClass: "paypal-tone-error",
        primaryButtonClass: "red-button",
        primaryButton: "Return to Cart",
        primaryTarget: "/Cart",
        secondaryButton: "Continue Shopping",
        secondaryTarget: "/DisplayAllProducts"
    },
    DEFAULT: {
        heading: "Payment Status Unavailable",
        subtitle: "We could not verify this transaction status.",
        message: "Please return to your cart and try checkout again.",
        badge: "Unknown",
        toneClass: "paypal-tone-default",
        primaryButtonClass: "blue-button",
        primaryButton: "Return to Cart",
        primaryTarget: "/Cart",
        secondaryButton: "Continue Shopping",
        secondaryTarget: "/DisplayAllProducts"
    }
}

export const PayPalMessage = (props) => {
    const messageType = props.match.params.messageType
    // Fallback to DEFAULT when route value is unknown or missing.
    const currentContent = STATUS_CONTENT[messageType] || STATUS_CONTENT.DEFAULT
    const payPalPaymentID = props.match.params.payPalPaymentID
    // Route params may contain literal "null"/"undefined" strings from redirects.
    const hasPaymentID = messageType === "SUCCESS" && payPalPaymentID && payPalPaymentID !== "null" && payPalPaymentID !== "undefined"

    return (
        <div className={`form-container paypal-status-page ${currentContent.toneClass}`}>
            {currentContent.badge ? (
                <p className={`paypal-status-badge ${currentContent.toneClass}`}>{currentContent.badge}</p>
            ) : null}
            <h2>{currentContent.heading}</h2>
            {currentContent.subtitle ? <p className="paypal-status-subtitle">{currentContent.subtitle}</p> : null}
            <p className="paypal-status-message">{currentContent.message}</p>

            {hasPaymentID ? (
                <div className="paypal-status-id-wrap">
                    <span>PayPal Confirmation ID</span>
                    <code>{payPalPaymentID}</code>
                </div>
            ) : null}

            <div className="paypal-status-actions">
                <Link className={`${currentContent.primaryButtonClass} paypal-status-button`} to={currentContent.primaryTarget}>
                    {currentContent.primaryButton}
                </Link>
                <Link className="blue-button paypal-status-button" to={currentContent.secondaryTarget}>
                    {currentContent.secondaryButton}
                </Link>
            </div>
        </div>
    )
}