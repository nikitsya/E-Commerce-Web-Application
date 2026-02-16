import React, {useState, useEffect} from "react"
import {Link} from "react-router-dom"
import axios from "axios"
import {ProductTable} from "./ProductTable"
import {SERVER_HOST} from "../config/global_constants"


export const DisplayAllProducts = () => {
    const [products, setProducts] = useState([])

    useEffect(() => {
        axios.get(`${SERVER_HOST}/products`)
            .then(res => {setProducts(Array.isArray(res.data) ? res.data : [])})
            .catch(() => {setProducts([])})
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }, [])

    return (
        <div className="form-container">
            <div className="table-container">
                <ProductTable products={products} />
                <div className="add-new-product">
                    <Link to={"/AddProduct"}>Add New Product</Link>
                </div>
            </div>
        </div>
    )
}