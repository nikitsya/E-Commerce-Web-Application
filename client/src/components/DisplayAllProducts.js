import React, {useEffect, useState} from "react"
import axios from "axios"
import {ProductTable} from "./ProductTable"
import {SERVER_HOST} from "../config/global_constants"


export const DisplayAllProducts = ({searchName = "", cartItems = [], onAddToCart}) => {
    const [products, setProducts] = useState([])

    useEffect(() => {
        axios.defaults.withCredentials = true // needed for sessions to work
        axios.get(`${SERVER_HOST}/products`)
            .then(res => {
                setProducts(Array.isArray(res.data) ? res.data : [])
            })
            .catch(() => {
                setProducts([])
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }, [])

    const normalizedSearch = searchName.trim().toLowerCase()

    const filteredProducts = products.filter((product) =>
        (product.name || "").toLowerCase().includes(normalizedSearch)
    );

    return (
        <div className="form-container">
            <div className="table-container">
                {filteredProducts.length === 0 ? (
                    <p>No products found</p>
                ) : (
                    <ProductTable products={filteredProducts} cartItems={cartItems} onAddToCart={onAddToCart}/>
                )}
            </div>
        </div>
    )
}
