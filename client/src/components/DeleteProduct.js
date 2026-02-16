import React, {useState, useEffect} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {SERVER_HOST} from "../config/global_constants"


export const DeleteProduct = props => {
    const [redirectToDisplayAllProducts, setRedirectToDisplayAllProducts] = useState(false)

    useEffect(() => {
        axios.delete(`${SERVER_HOST}/products/${props.match.params.id}`)
            .then(() => {
                setRedirectToDisplayAllProducts(true)
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }, [props.match.params.id])


    return (
        <div>{redirectToDisplayAllProducts ? <Redirect to="/DisplayAllProducts"/> : null}</div>
    )
}