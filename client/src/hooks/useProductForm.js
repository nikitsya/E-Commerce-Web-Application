import {useCallback, useState} from "react"

// Baseline field values shared by product create/edit screens.
const INITIAL_PRODUCT_FORM = {
    name: "",
    price: "",
    images: "",
    description: "",
    capacityMl: "",
    material: "",
    color: ""
}

// Converts API product response into form-friendly string values.
export const mapProductToFormValues = (product = {}) => ({
    name: product.name || product.product || "",
    price: product.price ?? "",
    images: Array.isArray(product.images) ? product.images.join(`, `) : "",
    description: product.description || "",
    capacityMl: product.capacityMl ?? "",
    material: product.material || "",
    color: product.color || ""
})

// Converts form state back into normalized payload expected by backend routes.
export const buildProductPayload = (formValues) => ({
    name: String(formValues.name || "").trim(),
    price: Number(formValues.price),
    images: String(formValues.images || "")
        .split(`,`)
        .map((value) => value.trim())
        .filter((value) => value !== ``),
    description: String(formValues.description || "").trim(),
    capacityMl: formValues.capacityMl === `` ? undefined : Number(formValues.capacityMl),
    material: String(formValues.material || "").trim(),
    color: String(formValues.color || "").trim()
})

export const useProductForm = (initialValues = INITIAL_PRODUCT_FORM) => {
    const [formValues, setFormValues] = useState({
        ...INITIAL_PRODUCT_FORM,
        ...initialValues
    })

    // Returns stable change handlers for individual form fields.
    const updateField = useCallback((fieldName) => (event) => {
        const {value} = event.target
        setFormValues((previousValues) => ({
            ...previousValues,
            [fieldName]: value
        }))
    }, [])

    // Replaces all fields at once (useful when preloading Edit form data).
    const replaceFormValues = useCallback((nextValues = {}) => {
        setFormValues({
            ...INITIAL_PRODUCT_FORM,
            ...nextValues
        })
    }, [])

    return {
        formValues,
        updateField,
        replaceFormValues
    }
}
