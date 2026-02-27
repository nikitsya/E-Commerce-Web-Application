import React, {useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {ACCESS_LEVEL_ADMIN, SERVER_HOST} from "../config/global_constants"


export const AddProduct = () => {
    const [name, setName] = useState("")
    const [price, setPrice] = useState("")
    const [images, setImages] = useState("")
    const [description, setDescription] = useState("")
    const [capacityMl, setCapacityMl] = useState("")
    const [material, setMaterial] = useState("")
    const [color, setColor] = useState("")
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(localStorage.accessLevel < ACCESS_LEVEL_ADMIN)

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
        axios.post(`${SERVER_HOST}/products`, productObject, {headers: {"authorization": localStorage.token}})
            .then(res => setRedirectToDisplayAllProducts(true))
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

                <Button value="Add" className="green-button" onClick={handleSubmit}/>
                <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
            </form>
        </div>
    )
}
