import React, {useState} from "react"
import axios from "axios"
import {Redirect} from "react-router-dom"
import {SANDBOX_CLIENT_ID, SERVER_HOST} from "../config/global_constants"
import {PayPalButtons, PayPalScriptProvider} from "@paypal/react-paypal-js"


export const BuyProduct = props => {
    // Redirect state for the post-payment status page.
    const [redirectToPayPalMessage, setRedirectToPayPalMessage] = useState(false)
    const [payPalMessageType, setPayPalMessageType] = useState(null)
    const [payPalOrderID, setPayPalOrderID] = useState(null)

    // Centralized redirect helper keeps status transitions consistent.
    const redirectWithStatus = (messageType, orderID = null) => {
        setPayPalMessageType(messageType)
        setPayPalOrderID(orderID)
        setRedirectToPayPalMessage(true)
    }

    // Creates PayPal order using current cart total in EUR.
    const createOrder = (_, actions) => {
        const amount = (Number(props.price) || 0).toFixed(2)
        return actions.order.create({purchase_units: [{amount: {value: amount}}]})
    }

    // After PayPal approval, persist sale in backend for either logged-in or guest checkout.
    const onApprove = paymentData => {
        const isLoggedIn = Number(localStorage.accessLevel) > 0 && !!localStorage.token

        const orderID = paymentData.orderID
        const endpoint = isLoggedIn
            ? `${SERVER_HOST}/sales/${orderID}/${props.price}`
            : `${SERVER_HOST}/sales/guest/${orderID}/${props.price}`

        const payload = isLoggedIn
            ? {
                items: props.items || [],
                customerName: localStorage.name || "Registered Customer"
            } : {
                items: props.items || [],
                customerName: props.guestDetails?.customerName || "",
                customerEmail: props.guestDetails?.customerEmail || "",
                customerAddress: props.guestDetails?.customerAddress || "",
                customerPhone: props.guestDetails?.customerPhone || ""
            }

        const requestConfig = isLoggedIn ? {headers: {authorization: localStorage.token}} : undefined

        axios.post(endpoint, payload, requestConfig)
            .then(() => {
                redirectWithStatus("SUCCESS", orderID)
            })
            .catch(() => {
                redirectWithStatus("ERROR")
            })
    }

    // Handles PayPal SDK/runtime errors.
    const onError = () => redirectWithStatus("ERROR")

    // Triggered when user closes PayPal popup or clicks cancel.
    const onCancel = () => redirectWithStatus("CANCEL")

    return (
        <div>
            {redirectToPayPalMessage ? <Redirect to={`/PayPalMessage/${payPalMessageType}/${payPalOrderID}`}/> : null}

            <PayPalScriptProvider options={{currency: "EUR", "client-id": SANDBOX_CLIENT_ID}}>
                <PayPalButtons style={{layout: "horizontal"}} createOrder={createOrder} onApprove={onApprove}
                               onError={onError} onCancel={onCancel}/>
            </PayPalScriptProvider>
        </div>
    )
}
