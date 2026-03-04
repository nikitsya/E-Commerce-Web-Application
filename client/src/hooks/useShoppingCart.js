import {useEffect, useState} from "react"

const CART_STORAGE_KEY = "shoppingCartItems"
const DEFAULT_CART_QUANTITY = 1

const normalizeStockQty = (value, fallback = 0) => {
    const normalizedFallback = Number.isFinite(Number(fallback)) ? Math.max(0, Math.floor(Number(fallback))) : 0
    const parsedValue = Math.floor(Number(value))

    if (!Number.isFinite(parsedValue) || parsedValue < 0) {
        return normalizedFallback
    }

    return parsedValue
}

// Reads cart snapshot from localStorage and normalizes values.
// Any malformed payload gracefully falls back to an empty cart.
const readCartFromStorage = () => {
    if (typeof window === "undefined") {
        return []
    }

    try {
        const rawCart = localStorage.getItem(CART_STORAGE_KEY)
        if (!rawCart) {
            return []
        }

        const parsedCart = JSON.parse(rawCart)
        if (!Array.isArray(parsedCart)) {
            return []
        }

        return parsedCart
            .filter((item) => item && item._id)
            .map((item) => {
                const quantity = Number(item.quantity) > 0 ? Math.floor(Number(item.quantity)) : DEFAULT_CART_QUANTITY
                const stockQty = normalizeStockQty(item.stockQty, quantity)

                return {
                    // Keep a consistent item shape used by cart UI and checkout flow.
                    _id: item._id,
                    name: item.name || "",
                    price: Number(item.price) || 0,
                    image: item.image || "",
                    quantity: Math.min(quantity, stockQty),
                    stockQty
                }
            })
            .filter((item) => item.quantity > 0)
    } catch {
        return []
    }
}

export const useShoppingCart = () => {
    // Initialize state lazily so storage is read only once on mount.
    const [cartItems, setCartItems] = useState(() => readCartFromStorage())

    useEffect(() => {
        // Skip storage writes outside browser environments (tests/SSR).
        if (typeof window === "undefined") {
            return
        }
        // Persist current cart after every cart state change.
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    }, [cartItems])

    // Adds a product to cart or increments quantity if it already exists.
    const addToCart = (product) => {
        if (!product || !product._id) {
            return
        }

        const stockQty = normalizeStockQty(product.stockQty)
        if (stockQty <= 0) {
            return
        }

        setCartItems((previousItems) => {
            const existingItem = previousItems.find((item) => item._id === product._id)

            if (existingItem) {
                return previousItems.map((item) =>
                    item._id === product._id
                        ? {
                            ...item,
                            stockQty,
                            quantity: item.quantity < stockQty ? item.quantity + 1 : item.quantity
                        }
                        : item
                )
            }

            return [
                ...previousItems,
                {
                    _id: product._id,
                    name: product.name || "",
                    price: Number(product.price) || 0,
                    image: Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : "",
                    quantity: DEFAULT_CART_QUANTITY,
                    stockQty
                }
            ]
        })
    }

    // Updates quantity for a cart item; removes it when quantity is zero or less.
    const updateCartItemQuantity = (productId, nextQuantity) => {
        const normalizedQuantity = Math.floor(Number(nextQuantity))

        if (!Number.isFinite(normalizedQuantity)) {
            return
        }

        if (normalizedQuantity <= 0) {
            setCartItems((previousItems) => previousItems.filter((item) => item._id !== productId))
            return
        }

        setCartItems((previousItems) =>
            previousItems.flatMap((item) => {
                if (item._id !== productId) {
                    return [item]
                }

                const stockQty = normalizeStockQty(item.stockQty, item.quantity)
                const clampedQuantity = Math.min(normalizedQuantity, stockQty)
                if (clampedQuantity <= 0) {
                    return []
                }

                return [{...item, stockQty, quantity: clampedQuantity}]
            })
        )
    }

    // Removes a single item by product id.
    const removeCartItem = (productId) => {
        setCartItems((previousItems) => previousItems.filter((item) => item._id !== productId))
    }

    // Clears the full cart, typically after successful checkout.
    const clearCart = () => {
        setCartItems([])
    }

    // Badge value shown in navigation (sum of item quantities).
    const cartItemsCount = cartItems.reduce((total, item) => total + item.quantity, 0)

    return {
        cartItems,
        cartItemsCount,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart
    }
}
