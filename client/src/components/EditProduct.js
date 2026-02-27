import React, {useEffect, useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {ACCESS_LEVEL_CUSTOMER, SERVER_HOST} from "../config/global_constants"

export const EditProduct = props => {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [images, setImages] = useState("")
    const [description, setDescription] = useState("")
    const [capacityMl, setCapacityMl] = useState("")
    const [material, setMaterial] = useState("")
    const [color, setColor] = useState("")
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(localStorage.accessLevel < ACCESS_LEVEL_CUSTOMER)


    useEffect(() => {
        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.get(`${SERVER_HOST}/products/${props.match.params.id}`, {headers: {"authorization": localStorage.token}})
            .then((res) => {
                setName(res.data.name || res.data.product || "")
                setPrice(res.data.price)
                setImages(Array.isArray(res.data.images) ? res.data.images.join(`, `) : "")
                setDescription(res.data.description || "")
                setCapacityMl(res.data.capacityMl ?? "")
                setMaterial(res.data.material || "")
                setColor(res.data.color || "")
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }, [props.match.params.id])

    const handleNameChange = e => {
        setName(e.target.value)
    }

    const handlePriceChange = e => {
        setPrice(e.target.value)
    }

    const handleImagesChange = e => {
        setImages(e.target.value)
    }

    const handleDescriptionChange = e => {
        setDescription(e.target.value)
    }

    const handleCapacityMlChange = e => {
        setCapacityMl(e.target.value)
    }

    const handleMaterialChange = e => {
        setMaterial(e.target.value)
    }

    const handleColorChange = e => {
        setColor(e.target.value)
    }

    const handleSubmit = e => {
        e.preventDefault()

        const productObject = {
            name: name.trim(),
            price: Number(price),
            images: images.split(`,`).map((value) => value.trim()).filter((value) => value !== ``),
            description: description.trim(),
            capacityMl: capacityMl === `` ? undefined : Number(capacityMl),
            material: material.trim(),
            color: color.trim()
        }

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.put(`${SERVER_HOST}/products/${props.match.params.id}`, productObject, {headers: {"authorization": localStorage.token}})
            .then(() => {
                setRedirectToDisplayAllProducts(true)
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }

    return (
        <div className="form-container">{redirectToDisplayAllProducts ? <Redirect to="/DisplayAllProducts"/> : null}
            <form>
                <label>Name</label>
                <input autoFocus type="text" name="name" value={name} onChange={handleNameChange}/>

                <label>Price</label>
                <input type="text" name="price" value={price} onChange={handlePriceChange}/>

                <label>Images (comma separated)</label>
                <input type="text" name="images" value={images} onChange={handleImagesChange}/>

                <label>Description</label>
                <input type="text" name="description" value={description} onChange={handleDescriptionChange}/>

                <label>Capacity (ml)</label>
                <input type="number" name="capacityMl" value={capacityMl} onChange={handleCapacityMlChange}/>

                <label>Material</label>
                <input type="text" name="material" value={material} onChange={handleMaterialChange}/>

                <label>Color</label>
                <input type="text" name="color" value={color} onChange={handleColorChange}/>

                <Button value="Update" className="green-button" onClick={handleSubmit}/>
                <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
            </form>
        </div>
    )
}
