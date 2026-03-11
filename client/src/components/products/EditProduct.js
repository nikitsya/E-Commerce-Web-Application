import React, {useEffect, useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../../config/global_constants"
import {
    buildProductFormData,
    mapProductToFormValues,
    useProductForm,
    validateProductForm
} from "../../hooks/useProductForm"
import {ProductFormFields} from "./ProductFormFields"

// Prevents rendering raw HTML error pages inside form error UI.
const extractSafeBackendMessage = (data) => {
    const text = typeof data === "string" ? data.trim() : ""
    if (!text) return ""

    const normalized = text.toLowerCase()
    const looksLikeHtml = normalized.includes("<!doctype") || normalized.includes("<html") || normalized.includes("<body")
    if (looksLikeHtml) return ""

    return text
}

// Maps backend/network failures to user-friendly messages for edit flow.
const getEditProductErrorMessage = (error, fallbackMessage) => {
    if (!error?.response) {
        return "Network error: please check your connection and try again."
    }

    const {status, data} = error.response
    const backendMessage = extractSafeBackendMessage(data)

    if (status === 400 || status === 409 || status === 422) {
        return backendMessage || fallbackMessage
    }
    if (status === 401 || status === 403) {
        return "You do not have permission to edit products."
    }
    if (status === 404) {
        return backendMessage || "Product was not found."
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
    const [selectedImageFiles, setSelectedImageFiles] = useState([])

    // Reuse base field updater and clear stale errors for edited field.
    const handleFieldChange = (fieldName) => (event) => {
        updateField(fieldName)(event)
        setErrors((previousErrors) => ({...previousErrors, [fieldName]: ""}))
        setServerError("")
    }

    // Handles replacement upload of one or multiple product image files.
    const handleImageFilesChange = (event) => {
        const nextFiles = Array.from(event.target.files || [])
        setSelectedImageFiles(nextFiles)
        setErrors((previousErrors) => ({...previousErrors, images: ""}))
        setServerError("")
    }

    useEffect(() => {
        if (Number(localStorage.accessLevel) < ACCESS_LEVEL_ADMIN) return

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.get(`${SERVER_HOST}/products/${props.match.params.id}`, {headers: {"authorization": localStorage.token}})
            .then((res) => {
                // Map API product shape to editable text field values.
                replaceFormValues(mapProductToFormValues(res.data))
                setSelectedImageFiles([])
            })
            .catch((error) => setServerError(getEditProductErrorMessage(error, "Unable to load product")))
    }, [props.match.params.id, replaceFormValues])

    const handleSubmit = e => {
        e.preventDefault()
        if (isSubmitting) return

        setServerError("")

        // Block submit until local validation passes.
        const nextErrors = validateProductForm(formValues, {selectedImageFiles})
        if (Object.keys(nextErrors).length > 0) {
            setErrors(nextErrors)
            return
        }
        setErrors({})

        // Build multipart payload with text fields and optional replacement images.
        const formData = buildProductFormData(formValues, selectedImageFiles)
        setIsSubmitting(true)

        axios.put(`${SERVER_HOST}/products/${props.match.params.id}`, formData, {
            headers: {
                "authorization": localStorage.token
            }
        })
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
                onImageFilesChange={handleImageFilesChange}
                selectedImageFiles={selectedImageFiles}
                submitLabel={isSubmitting ? "Updating..." : "Update"}
                onSubmit={handleSubmit}
                errors={errors}
                serverError={serverError}
            />
        </div>
    )
}
