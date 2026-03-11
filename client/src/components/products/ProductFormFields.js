import React, {useEffect, useMemo} from "react"
import {Link} from "react-router-dom"
import {Button} from "../ui/Button"
import {resolveImageSrc} from "../../utils/resolveImageSrc"

// Shared product form fields used by both Add and Edit pages.
export const ProductFormFields = ({
                                      formValues,
                                      onFieldChange,
                                      onImageFilesChange,
                                      selectedImageFiles = [],
                                      submitLabel,
                                      onSubmit,
                                      errors = {},
                                      serverError = ""
                                  }) => {
    const existingImagePreviewList = Array.isArray(formValues.images)
        ? formValues.images.map((image) => resolveImageSrc(image)).filter((image) => image !== "")
        : []

    const selectedImagePreviewList = useMemo(
        () => (Array.isArray(selectedImageFiles) ? selectedImageFiles.map((file) => URL.createObjectURL(file)) : []),
        [selectedImageFiles]
    )

    useEffect(() => () => {
        selectedImagePreviewList.forEach((previewUrl) => URL.revokeObjectURL(previewUrl))
    }, [selectedImagePreviewList])

    const imagePreviewList = selectedImagePreviewList.length > 0 ? selectedImagePreviewList : existingImagePreviewList

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

            <label>Images</label>
            <div className="form-helper-text">Upload one or more image files. Selecting new files will replace current images.</div>
            <input
                type="file"
                name="productImages"
                multiple
                accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                className={errors.images ? "field-error" : ""}
                onChange={onImageFilesChange}
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
