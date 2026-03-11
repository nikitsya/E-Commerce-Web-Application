import React, {useEffect} from "react"
import {resolveImageSrc} from "../../utils/resolveImageSrc"


export const ProductDeleteModal = ({product, isDeleting = false, error = "", onConfirm, onClose}) => {
    useEffect(() => {
        if (!product) return

        // Lock page scrolling while confirmation modal is open.
        const originalBodyOverflow = document.body.style.overflow
        const originalHtmlOverflow = document.documentElement.style.overflow

        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = originalBodyOverflow
            document.documentElement.style.overflow = originalHtmlOverflow
        }
    }, [product])

    useEffect(() => {
        if (!product) return undefined

        const handleEscapeKey = (event) => {
            if (event.key === "Escape" && !isDeleting && typeof onClose === "function") onClose()
        }

        window.addEventListener("keydown", handleEscapeKey)
        return () => window.removeEventListener("keydown", handleEscapeKey)
    }, [product, isDeleting, onClose])

    if (!product) return null

    const images = Array.isArray(product.images) ? product.images : []
    const previewImage = images.length > 0 ? resolveImageSrc(images[0]) : ""

    const handleOverlayClick = () => {
        if (isDeleting) return
        if (typeof onClose === "function") onClose()
    }

    const handleConfirm = () => {
        if (typeof onConfirm === "function") onConfirm(product)
    }

    const handleCancel = () => {
        if (isDeleting) return
        if (typeof onClose === "function") onClose()
    }

    return (
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div
                className="confirm-delete-card"
                onClick={(event) => event.stopPropagation()}
                role="dialog"
                aria-modal="true"
                aria-label="Delete product confirmation"
            >
                <h3>Delete Product</h3>
                <p>
                    Are you sure you want to delete <strong>{product.name || "this product"}</strong>?
                </p>

                {previewImage ?
                    <img className="confirm-delete-image" src={previewImage} alt={product.name || "Product"}/> : null}

                {error ? <p className="confirm-delete-error" role="alert">{error}</p> : null}

                <div className="confirm-delete-actions">
                    <button type="button" className="red-button" onClick={handleConfirm} disabled={isDeleting}>
                        {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                    <button type="button" className="blue-button" onClick={handleCancel} disabled={isDeleting}>
                        Cancel
                    </button>
                </div>
            </div>
        </div>
    )
}
