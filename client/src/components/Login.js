import React, {useState} from "react"
import {Redirect, Link} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import { SERVER_HOST, ACCESS_LEVEL_GUEST } from "../config/global_constants"



export const Login = props => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState("")

    const handleEmailChange = e => {
        setEmail(e.target.value)
        setServerError("")
    }

    const handlePasswordChange = e => {
        setPassword(e.target.value)
        setServerError("")
    }

    const validate = () => {
        const next = {}

        if (!email.trim()) next.email = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email format"

        if (!password) next.password = "Password is required"

        return next
    }

    const handleSubmit = e => {
        e.preventDefault()
        setServerError("")

        const next = validate()
        if (Object.keys(next).length > 0) {
            setErrors(next)
            return
        }

        setErrors({})

        axios.defaults.withCredentials = true // needed for sessions to work
        axios.post(`${SERVER_HOST}/users/login/${email}/${password}`)
        .then(res => {
            if (res.data.errorMessage) {
                throw new Error(res.data.errorMessage)
            }

            sessionStorage.name = res.data.name
            sessionStorage.accessLevel = res.data.accessLevel
            setIsLoggedIn(true)
        })
        .catch(err => {
            // default if not logged in
            sessionStorage.name = "GUEST"
            sessionStorage.accessLevel = ACCESS_LEVEL_GUEST
            setServerError(err?.response?.data || err.message || "Login failed")
        })
    }

    return (
        <form className="form-container" noValidate = {true} id = "loginOrRegistrationForm">
            <h2>Login</h2>

            {serverError ? <div className="error-text">{serverError}</div> : null}

            {isLoggedIn ? <Redirect to="/DisplayAllProducts"/> : null}

            <input
                className={errors.email ? "field-error" : ""}
                type = "email"
                name = "email"
                placeholder = "Email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleEmailChange}
            />
            {errors.email ? <div className="error-text">{errors.email}</div> : null}
            <br/>

            <input
                className={errors.password ? "field-error" : ""}
                type = "password"
                name = "password"
                placeholder = "Password"
                autoComplete="password"
                value={password}
                onChange={handlePasswordChange}
            />
            {errors.password ? <div className="error-text">{errors.password}</div> : null}
            <br/><br/>

            <Button value="Login" className="green-button" onClick={handleSubmit}/>
            <Link className="red-button" to="/DisplayAllProducts">Cancel</Link>
        </form>
    )
}
