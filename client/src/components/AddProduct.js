import React, {useState} from "react"
import {Redirect, Link} from "react-router-dom"
import axios from "axios"
import {SERVER_HOST} from "../config/global_constants"


export const AddProduct = () => {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(false)

    const handleNameChange = e => {
        setName(e.target.value)
    }

    const handlePriceChange = e => {
        setPrice(e.target.value)
    }

    const handleSubmit = e => {
        e.preventDefault()

        const productObject = {
            name: name.trim(),
            price: Number(price)
        }

        axios.post(`${SERVER_HOST}/products`, productObject)
            .then(() => {setRedirectToDisplayAllProducts(true)})
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }

    return (
        <div className="form-container">{redirectToDisplayAllProducts ? <Redirect to="/DisplayAllProducts"/> : null}
            <form>
                <label>Name</label>
                <input autoFocus type="text" name="name" value={name} onChange={handleNameChange} />

                <label>Price</label>
                <input type="text" name="price" value={price} onChange={handlePriceChange} />

                <button className="green-button" onClick={handleSubmit}>Add</button>
                <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
            </form>
        </div>
    )
}
