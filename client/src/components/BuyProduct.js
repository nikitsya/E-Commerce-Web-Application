import React, {useState} from "react"
import axios from "axios"
import {Redirect} from "react-router-dom"
import {SANDBOX_CLIENT_ID, SERVER_HOST} from "../config/global_constants"
import {PayPalButtons, PayPalScriptProvider} from "@paypal/react-paypal-js"


export const BuyProduct = props =>
{
    const [redirectToPayPalMessage, setRedirectToPayPalMessage] = useState(false)
    const [payPalMessageType, setPayPalMessageType] = useState(null)
    const [payPalOrderID, setPayPalOrderID] = useState(null)


    const createOrder = (data, actions) =>
    {
        const amount = (Number(props.price) || 0).toFixed(2)
        return actions.order.create({purchase_units: [{amount: {value: amount}}]})
    }


    const onApprove = paymentData =>
    {
        const isLoggedIn = Number(localStorage.accessLevel) > 0 && !!localStorage.token

if (isLoggedIn) {
    axios.post(
        `${SERVER_HOST}/sales/${paymentData.orderID}/${props.price}`,
        {
            items: props.items || [],
            customerName: localStorage.name || "Registered Customer"
        },
        {headers: {authorization: localStorage.token}}
    )
    .then(() => {
        setPayPalMessageType("SUCCESS")
        setPayPalOrderID(paymentData.orderID)
        setRedirectToPayPalMessage(true)
    })
    .catch(() => {
        setPayPalMessageType("ERROR")
        setRedirectToPayPalMessage(true)
    })
} else {
    axios.post(
        `${SERVER_HOST}/sales/guest/${paymentData.orderID}/${props.price}`,
        {
            items: props.items || [],
            customerName: props.guestDetails?.customerName || "",
            customerEmail: props.guestDetails?.customerEmail || "",
            customerAddress: props.guestDetails?.customerAddress || "",
            customerPhone: props.guestDetails?.customerPhone || ""
        }
    )
    .then(() => {
        setPayPalMessageType("SUCCESS")
        setPayPalOrderID(paymentData.orderID)
        setRedirectToPayPalMessage(true)
    })
    .catch(() => {
        setPayPalMessageType("ERROR")
        setRedirectToPayPalMessage(true)
    })
}
    }


    const onError = err =>
    {
        setPayPalMessageType("ERROR")
        setRedirectToPayPalMessage(true)
    }


    const onCancel = cancelData =>
    {
        // The user pressed the Paypal checkout popup window cancel button or closed the Paypal checkout popup window
        setPayPalMessageType("CANCEL")
        setRedirectToPayPalMessage(true)
    }


    return (
    <div>
        {redirectToPayPalMessage ? <Redirect to= {`/PayPalMessage/${payPalMessageType}/${payPalOrderID}`}/> : null}            
    
        <PayPalScriptProvider options={{currency: "EUR", "client-id": SANDBOX_CLIENT_ID}}>
            <PayPalButtons style={{layout: "horizontal"}} createOrder={createOrder} onApprove={onApprove} onError={onError} onCancel={onCancel}/>
        </PayPalScriptProvider>
    </div>
    )
}