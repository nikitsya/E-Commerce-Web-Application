import React, {useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../../config/global_constants"
import {buildProductFormData, useProductForm, validateProductForm} from "../../hooks/useProductForm"
import {ProductFormFields} from "./ProductFormFields"


export const AddProduct = () => {
    // Reuse shared product-form state logic to keep Add/Edit behavior consistent.
    const {formValues, updateField} = useProductForm()
    // Non-admin users are redirected away from product creation page.
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(localStorage.accessLevel < ACCESS_LEVEL_ADMIN)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState("")
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [selectedImageFiles, setSelectedImageFiles] = useState([])

    // Maps backend/network failures to user-friendly messages for create flow.
    const getAddProductErrorMessage = (error) => {
        if (!error?.response) {
            return "Network error: please check your connection and try again."
        }

        const {status, data} = error.response
        const backendMessage = typeof data === "string" && data.trim() ? data.trim() : ""

        if (status === 400 || status === 409 || status === 422) {
            return backendMessage || "Product data is invalid. Please review the highlighted fields."
        }
        if (status === 401 || status === 403) {
            return "You do not have permission to add products."
        }

        return backendMessage || "Unable to add product right now. Please try again."
    }

    // Reuse base field updater and clear stale errors for edited field.
    const handleFieldChange = (fieldName) => (event) => {
        updateField(fieldName)(event)
        setErrors((previousErrors) => ({...previousErrors, [fieldName]: ""}))
        setServerError("")
    }

    // Handles selection of one or multiple product image files.
    const handleImageFilesChange = (event) => {
        const nextFiles = Array.from(event.target.files || [])
        setSelectedImageFiles(nextFiles)
        setErrors((previousErrors) => ({...previousErrors, images: ""}))
        setServerError("")
    }

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

        // Build multipart payload with text fields and selected product images.
        const formData = buildProductFormData(formValues, selectedImageFiles)
        setIsSubmitting(true)

        axios.post(`${SERVER_HOST}/products`, formData, {
            headers: {
                "authorization": localStorage.token
            }
        })
            .then(() => setRedirectToDisplayAllProducts(true))
            .catch(err => setServerError(getAddProductErrorMessage(err)))
            .finally(() => setIsSubmitting(false))
    }

    return (
        <div className="form-container">{redirectToDisplayAllProducts ? <Redirect to="/DisplayAllProducts"/> : null}
            <ProductFormFields
                formValues={formValues}
                onFieldChange={handleFieldChange}
                onImageFilesChange={handleImageFilesChange}
                selectedImageFiles={selectedImageFiles}
                submitLabel={isSubmitting ? "Adding..." : "Add"}
                onSubmit={handleSubmit}
                errors={errors}
                serverError={serverError}
            />
        </div>
    )
}
