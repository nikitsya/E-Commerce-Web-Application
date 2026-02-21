import React, {useState} from "react"
import {Redirect, Link} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import { SERVER_HOST, ACCESS_LEVEL_GUEST } from "../config/global_constants"



export const Login = props => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoggedIn, setIsLoggedIn] = useState(false)

    const handleEmailChange = e => {
        setEmail(e.target.value)
    }

    const handlePasswordChange = e => {
        setPassword(e.target.value)
    }

    const handleSubmit = e => {
        axios.post(`${SERVER_HOST}/users/login/${email}/${password}`)
        .then(res => {
            sessionStorage.name = res.data.name
            sessionStorage.accessLevel = res.data.accessLevel
            setIsLoggedIn(true)
        })
        .catch(err => {
            // default if not logged in
            sessionStorage.name = "GUEST"
            sessionStorage.accessLevel = ACCESS_LEVEL_GUEST
            console.log(`${err.response.data}\n${err}`)
        })
    }

    return (
        <form className="form-container" noValidate = {true} id = "loginOrRegistrationForm">
            <h2>Login</h2>

            {isLoggedIn ? <Redirect to="/DisplayAllProducts"/> : null}

            <input type = "email" name = "email" placeholder = "Email" autoComplete="email" autoFocus value={email}
                onChange={handleEmailChange}
            /><br/>

            <input type = "password" name = "password" placeholder = "Password" autoComplete="password" value={password}
                onChange={handlePasswordChange}
            /><br/><br/>

            <Button value="Login" className="green-button" onClick={handleSubmit}/>
            <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
        </form>
    )
}