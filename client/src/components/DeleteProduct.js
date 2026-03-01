import React, {useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {SERVER_HOST} from "../config/global_constants"


export const DeleteProduct = props => {
    // Redirect user back to catalog after successful delete or cancel action.
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(false)
    // Prevent duplicate delete requests while the first one is still in flight.
    const [isDeleting, setIsDeleting] = useState(false)
    // Stores backend error text for failed delete attempts.
    const [error, setError] = useState("")


    const handleConfirmDelete = () => {
        setIsDeleting(true)
        setError("")

        // Backend validates token and admin access before deleting the product.
        axios.delete(`${SERVER_HOST}/products/${props.match.params.id}`, {headers: {"authorization": localStorage.token}})
            .then(() => {
                setRedirectToDisplayAllProducts(true)
            })
            .catch(err => {
                // Show API error message when available, otherwise fallback text.
                setError(err?.response?.data || "Failed to delete product")
                setIsDeleting(false)
            })
    }

    // Cancel keeps data unchanged and returns user to product list.
    const handleCancel = () => {
        setRedirectToDisplayAllProducts(true)
    }

    // Use client-side redirect instead of history push to keep component simple.
    if (redirectToDisplayAllProducts) {
        return <Redirect to="/DisplayAllProducts"/>
    }

    return (
        <div className="form-container">
            <h2>Delete Product</h2>
            <p>Are you sure you want to delete this product?</p>

            {error ? <div className="error-text">{error}</div> : null}

            <button
                type="button"
                className="red-button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
            >
                {isDeleting ? "Deleting..." : "Delete"}
            </button>

            <button
                type="button"
                className="blue-button"
                onClick={handleCancel}
                disabled={isDeleting}
            >
                Cancel
            </button>
        </div>
    )
}
