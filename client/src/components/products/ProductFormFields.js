import React from "react"
import {Link} from "react-router-dom"
import {Button} from "../ui/Button"

// Shared product form fields used by both Add and Edit pages.
export const ProductFormFields = ({
                                      formValues,
                                      onFieldChange,
                                      submitLabel,
                                      onSubmit,
                                      errors = {},
                                      serverError = ""
                                  }) => {
    const imagePreviewList = String(formValues.images || "")
        .split(",")
        .map((value) => value.trim())
        .filter((value) => value !== "")

    return (

        <form>
            {/* API-level error shown once above field-level validation messages */}
            {serverError ? <div className="error-text">{serverError}</div> : null}

            <label>Name</label>
            <input
                autoFocus
                type="text"
                name="name"
                value={formValues.name}
                className={errors.name ? "field-error" : ""}
                onChange={onFieldChange(`name`)}
            />
            {errors.name ? <div className="error-text">{errors.name}</div> : null}

            <label>Price</label>
            <input
                type="text"
                name="price"
                value={formValues.price}
                className={errors.price ? "field-error" : ""}
                onChange={onFieldChange(`price`)}
            />
            {errors.price ? <div className="error-text">{errors.price}</div> : null}

            <label>Images (comma separated)</label>
            <input
                type="text"
                name="images"
                value={formValues.images}
                className={errors.images ? "field-error" : ""}
                onChange={onFieldChange(`images`)}
            />
            {errors.images ? <div className="error-text">{errors.images}</div> : null}

            {imagePreviewList.length > 0 ? (
                <div className="product-image-preview-grid">
                    {imagePreviewList.map((src, index) => (
                        <img
                            key={`${src}-${index}`}
                            className="product-image-preview-thumb"
                            src={src}
                            alt={`Product preview ${index + 1}`}
                        />
                    ))}
                </div>
            ) : null}

            <label>Description</label>
            <input type="text" name="description" value={formValues.description}
                   onChange={onFieldChange(`description`)}/>

            <label>Capacity (ml)</label>
            <input
                type="number"
                name="capacityMl"
                value={formValues.capacityMl}
                className={errors.capacityMl ? "field-error" : ""}
                onChange={onFieldChange(`capacityMl`)}
            />
            {errors.capacityMl ? <div className="error-text">{errors.capacityMl}</div> : null}

            <label>Material</label>
            <input type="text" name="material" value={formValues.material} onChange={onFieldChange(`material`)}/>

            <label>Color</label>
            <input type="text" name="color" value={formValues.color} onChange={onFieldChange(`color`)}/>

            <label>Stock quantity</label>
            <input
                type="number"
                name="stockQty"
                min="0"
                step="1"
                value={formValues.stockQty}
                className={errors.stockQty ? "field-error" : ""}
                onChange={onFieldChange(`stockQty`)}
            />
            {errors.stockQty ? <div className="error-text">{errors.stockQty}</div> : null}

            <label>Low stock threshold</label>
            <input
                type="number"
                name="lowStockThreshold"
                min="0"
                step="1"
                value={formValues.lowStockThreshold}
                className={errors.lowStockThreshold ? "field-error" : ""}
                onChange={onFieldChange(`lowStockThreshold`)}
            />
            {errors.lowStockThreshold ? <div className="error-text">{errors.lowStockThreshold}</div> : null}

            <Button value={submitLabel} className="green-button" onClick={onSubmit}/>
            <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
        </form>
    )
}
