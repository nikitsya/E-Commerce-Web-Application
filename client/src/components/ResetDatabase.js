import React, {useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"

export const ResetDatabase = props => {
    const [isReset, setIsReset] = useState(false)

    const resetUsersModel = () => {
        axios.post(`${SERVER_HOST}/users/reset_user_collection`)
            .then(() => {
                localStorage.clear()
                setIsReset(true)
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }

    return (
        <form className="form-container" noValidate={true} id="loginOrRegistrationForm">

            {isReset ? <Redirect to="/DisplayAllProducts"/> : null}

            <p>"Reset User Database" is only for testing purposes.<br/>All code on the client-side and server-side
                relating to resetting the database should be removed from any development release</p>
            <Button value="Reset User Database" className="red-button" onClick={resetUsersModel}/> <br/><br/>
            <p>Reset the database and set up an administrator with:<br/> * email <strong>admin@admin.com</strong><br/> *
                password <strong>123-qwe_QWE</strong></p>

            <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
        </form>
    )
}