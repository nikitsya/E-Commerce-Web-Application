import React, {useEffect, useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"
import {buildProductPayload, mapProductToFormValues, useProductForm, validateProductForm} from "../hooks/useProductForm"
import {ProductFormFields} from "./ProductFormFields"

// Maps backend/network failures to user-friendly messages for edit flow.
const getEditProductErrorMessage = (error, fallbackMessage) => {
    if (!error?.response) {
        return "Network error: please check your connection and try again."
    }

    const {status, data} = error.response
    const backendMessage = typeof data === "string" && data.trim() ? data.trim() : ""

    if (status === 400 || status === 409 || status === 422) {
        return backendMessage || fallbackMessage
    }
    if (status === 401 || status === 403) {
        return "You do not have permission to edit products."
    }
    if (status === 404) {
        return "Product was not found."
    }

    return backendMessage || fallbackMessage
}

export const EditProduct = props => {
    // Shared form hook avoids duplicated handlers across Add/Edit product pages.
    const {formValues, updateField, replaceFormValues} = useProductForm()
    // Edit product access is restricted to administrators.
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(Number(localStorage.accessLevel) < ACCESS_LEVEL_ADMIN)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Reuse base field updater and clear stale errors for edited field.
    const handleFieldChange = (fieldName) => (event) => {
        updateField(fieldName)(event)
        setErrors((previousErrors) => ({...previousErrors, [fieldName]: ""}))
        setServerError("")
    }

    useEffect(() => {
        if (Number(localStorage.accessLevel) < ACCESS_LEVEL_ADMIN) return

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.get(`${SERVER_HOST}/products/${props.match.params.id}`, {headers: {"authorization": localStorage.token}})
            .then((res) => {
                // Map API product shape to editable text field values.
                replaceFormValues(mapProductToFormValues(res.data))
            })
            .catch((error) => setServerError(getEditProductErrorMessage(error, "Unable to load product")))
    }, [props.match.params.id, replaceFormValues])

    const handleSubmit = e => {
        e.preventDefault()
        if (isSubmitting) return

        setServerError("")

        // Block submit until local validation passes.
        const nextErrors = validateProductForm(formValues)
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }
        setErrors({})

        // Normalize and sanitize data before sending update request.
        const productObject = buildProductPayload(formValues)
        setIsSubmitting(true)

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.put(`${SERVER_HOST}/products/${props.match.params.id}`, productObject, {headers: {"authorization": localStorage.token}})
            .then(() => {
                setRedirectToDisplayAllProducts(true)
            })
            .catch((error) => setServerError(getEditProductErrorMessage(error, "Unable to update product")))
            .finally(() => setIsSubmitting(false))
    }

    return (
        <div className="form-container">{redirectToDisplayAllProducts ? <Redirect to="/DisplayAllProducts"/> : null}
            <ProductFormFields
                formValues={formValues}
                onFieldChange={handleFieldChange}
                submitLabel={isSubmitting ? "Updating..." : "Update"}
                onSubmit={handleSubmit}
                errors={errors}
                serverError={serverError}
            />
        </div>
    )
}
