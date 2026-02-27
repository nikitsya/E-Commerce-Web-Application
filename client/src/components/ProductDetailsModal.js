import React, {useEffect} from "react";
import {Link} from "react-router-dom";
import {ACCESS_LEVEL_ADMIN} from "../config/global_constants"

const formatPrice = (value) => `€ ${(Number(value) || 0).toFixed(2)}`

export const ProductDetailsModal = ({product, onClose, onAddToCart, isInCart = false}) => {
    useEffect(() => {
        if (!product) {
            return
        }

        const originalBodyOverflow = document.body.style.overflow
        const originalHtmlOverflow = document.documentElement.style.overflow

        document.body.style.overflow = "hidden"
        document.documentElement.style.overflow = "hidden"

        return () => {
            document.body.style.overflow = originalBodyOverflow
            document.documentElement.style.overflow = originalHtmlOverflow
        }
    }, [product])

    if (!product) return null;

    const images = Array.isArray(product.images) ? product.images : [];
    const isAdmin = Number(sessionStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const canAddToCart = typeof onAddToCart === "function"
    const handleAddToCart = () => {
        if (canAddToCart) {
            onAddToCart(product);
        }
    }

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h3>{product.name}</h3>
                    <button className="blue-button" onClick={onClose}>Close</button>
                </div>

                <p><strong>Price:</strong> {formatPrice(product.price)}</p>
                <p><strong>Description:</strong> {product.description || "-"}</p>
                <p><strong>Capacity (ml):</strong> {product.capacityMl ?? "-"}</p>
                <p><strong>Material:</strong> {product.material || "-"}</p>
                <p><strong>Color:</strong> {product.color || "-"}</p>

                <div className="modal-images">
                    {images.length === 0 ? "-" : images.map((src, i) => (
                        <img key={i} className="product-thumb" src={src} alt={`${product.name}-${i}`}/>
                    ))}
                </div>

                <div className="modal-actions">
                    {canAddToCart ? (
                        <button
                            type="button"
                            className="icon-button add-to-cart-icon-button"
                            onClick={handleAddToCart}
                            aria-label={isInCart ? "Added to Cart" : "Add to Cart"}
                            title={isInCart ? "Added to Cart" : "Add to Cart"}
                        >
                            <img
                                className="add-to-cart-icon"
                                src={isInCart ? "/images/buttons/added_to_cart.png" : "/images/buttons/add-to-cart.png"}
                                alt={isInCart ? "Added to Cart" : "Add to Cart"}
                            />
                        </button>
                    ) : null}
                    {isAdmin ? <Link className="green-button" to={"/EditProduct/" + product._id}>Edit</Link> : null}
                    {isAdmin ? <Link className="red-button" to={"/DeleteProduct/" + product._id}>Delete</Link> : null}
                </div>
            </div>
        </div>
    );
};
