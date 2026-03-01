import React, {useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"
import {buildProductPayload, useProductForm} from "../hooks/useProductForm"
import {ProductFormFields} from "./ProductFormFields"


export const AddProduct = () => {
    // Reuse shared product-form state logic to keep Add/Edit behavior consistent.
    const {formValues, updateField} = useProductForm()
    // Non-admin users are redirected away from product creation page.
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(localStorage.accessLevel < ACCESS_LEVEL_ADMIN)

    const handleSubmit = e => {
        e.preventDefault()

        // Build normalized API payload from UI form values.
        const productObject = buildProductPayload(formValues)

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.post(`${SERVER_HOST}/products`, productObject, {headers: {"authorization": localStorage.token}})
            .then(() => setRedirectToDisplayAllProducts(true))
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }

    return (
        <div className="form-container">{redirectToDisplayAllProducts ? <Redirect to="/DisplayAllProducts"/> : null}
            <ProductFormFields
                formValues={formValues}
                onFieldChange={updateField}
                submitLabel="Add"
                onSubmit={handleSubmit}
            />
        </div>
    )
}
