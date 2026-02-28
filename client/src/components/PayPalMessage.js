import React, {useState, useEffect} from "react"
import {Link} from "react-router-dom"


export const PayPalMessage = props =>
{
    const [heading, setHeading] = useState("")
    const [message, setMessage] = useState("")
    const [buttonColour, setButtonColour] = useState("red-button")

    const messageType = props.match.params.messageType
    const payPalPaymentID = props.match.params.payPalPaymentID


    useEffect(() =>
    {
        if(messageType === "SUCCESS")
        {
            setHeading("PayPal Transaction Confirmation")
            setMessage("Your PayPal transaction was successful.")
            setButtonColour("green-button")
        }
        else if(messageType === "CANCEL")
        {
            setHeading("PayPal Transaction Cancelled")
            setMessage("You cancelled your PayPal transaction. Therefore, the transaction was not completed.")
            setButtonColour("red-button")
        }
        else if(messageType === "ERROR")
        {
            setHeading("PayPal Transaction Error")
            setMessage("An error occured when trying to perform your PayPal transaction. The transaction was not completed. Please try to perform your transaction again.")
            setButtonColour("red-button")
        }
        else
        {
            setHeading("PayPal Transaction Status")
            setMessage("Invalid PayPal transaction status.")
            setButtonColour("red-button")
        }

    }, [messageType])


    return (
    <div className="payPalMessage">
        <h3>{heading}</h3>
        <p>{props.match.params.message}</p>
        <p>{message}</p>
    
        {props.match.params.messageType === "SUCCESS" ? <p>Your PayPal payment confirmation is <span id="payPalPaymentID">{props.match.params.payPalPaymentID}</span></p> : null}
    
        <p id="payPalPaymentIDButton"><Link className={buttonColour} to={"/DisplayAllProducts"}>Continue</Link></p>                                     
    </div>
    )
}