import {useEffect, useState} from "react"

const CART_STORAGE_KEY = "shoppingCartItems"

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
            .map((item) => ({
                _id: item._id,
                name: item.name || "",
                price: Number(item.price) || 0,
                image: item.image || "",
                quantity: Number(item.quantity) > 0 ? Math.floor(Number(item.quantity)) : 1
            }))
    } catch {
        return []
    }
}

export const useShoppingCart = () => {
    const [cartItems, setCartItems] = useState(() => readCartFromStorage())

    useEffect(() => {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems))
    }, [cartItems])

    const addToCart = (product) => {
        if (!product || !product._id) {
            return
        }

        setCartItems((previousItems) => {
            const existingItem = previousItems.find((item) => item._id === product._id)

            if (existingItem) {
                return previousItems.map((item) =>
                    item._id === product._id
                        ? {...item, quantity: item.quantity + 1}
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
                    quantity: 1
                }
            ]
        })
    }

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
            previousItems.map((item) =>
                item._id === productId
                    ? {...item, quantity: normalizedQuantity}
                    : item
            )
        )
    }

    const removeCartItem = (productId) => {
        setCartItems((previousItems) => previousItems.filter((item) => item._id !== productId))
    }

    const clearCart = () => {
        setCartItems([])
    }

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
