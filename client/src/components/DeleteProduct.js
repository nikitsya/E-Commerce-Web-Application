import React, {useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {SERVER_HOST} from "../config/global_constants"


export const DeleteProduct = props => {
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [error, setError] = useState("")


    const handleConfirmDelete = () => {
        setIsDeleting(true)
        setError("")

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.delete(`${SERVER_HOST}/products/${props.match.params.id}`, {headers: {"authorization": localStorage.token}})
            .then(() => {
                setRedirectToDisplayAllProducts(true)
            })
            .catch(err => {
                setError(err?.response?.data || "Failed to delete product")
                setIsDeleting(false)
            })
    }

    const handleCancel = () => {
        setRedirectToDisplayAllProducts(true)
    }

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