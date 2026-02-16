import React, {useState, useEffect} from "react"
import {Redirect, Link} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"

export const EditProduct = props => {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(false)

    useEffect(() => {
        axios.get(`${SERVER_HOST}/products/${props.match.params.id}`)
            .then((res) => {
                setName(res.data.name || res.data.product || "")
                setPrice(res.data.price)
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }, [props.match.params.id])

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

        axios.put(`${SERVER_HOST}/products/${props.match.params.id}`, productObject)
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

                <Button value="Update" className="green-button" onClick={handleSubmit}/>
                <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
            </form>
        </div>
    )
}
