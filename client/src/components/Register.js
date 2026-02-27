import React, {useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"

export const Register = () => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isRegistered, setIsRegistered] = useState(false)
    const [errors, setErrors] = useState({})
    const [serverError, setServerError] = useState("")


    const handleNameChange = e => {
        setName(e.target.value)
        setServerError("")
    }

    const handleEmailChange = e => {
        setEmail(e.target.value)
        setServerError("")
    }

    const handlePasswordChange = e => {
        setPassword(e.target.value)
        setServerError("")
    }

    const handleConfirmPasswordChange = e => {
        setConfirmPassword(e.target.value)
        setServerError("")
    }

    const validate = () => {
        const next = {}

        if (!name.trim()) next.name = "Name is required"

        if (!email.trim()) next.email = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email format"

        if (!password) next.password = "Password is required"
        else if (password.length < 10) next.password = "Password must be at least 10 characters"

        if (!confirmPassword) next.confirmPassword = "Please confirm password"
        else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match"

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

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.post(`${SERVER_HOST}/users/register/${name}/${email}/${password}`)
            .then((res) => {
                localStorage.name = res.data.name
                localStorage.accessLevel = res.data.accessLevel
                localStorage.token = res.data.token
                setIsRegistered(true)
            })
            .catch(err => {
                setServerError(err?.response?.data || "Registration failed")
            })
    }


    return (
        <form className="form-container" noValidate={true} id="loginOrRegistrationForm">

            {isRegistered ? <Redirect to="/DisplayAllProducts"/> : null}

            <h2>New User Registration</h2>
            {serverError ? <div className="error-text">{serverError}</div> : null}

            <input
                className={errors.name ? "field-error" : ""}
                name="name" type="text" placeholder="Name" autoComplete="name" value={name}
                onChange={handleNameChange} autoFocus
            />
            {errors.name ? <div className="error-text">{errors.name}</div> : null}
            <br/>

            <input
                className={errors.email ? "field-error" : ""}
                name="email" type="email" placeholder="Email" autoComplete="email" value={email}
                onChange={handleEmailChange}
            />
            {errors.email ? <div className="error-text">{errors.email}</div> : null}
            <br/>

            <input
                className={errors.password ? "field-error" : ""}
                name="password" type="password" placeholder="Password" autoComplete="password"
                title="Password must be at least ten-digits long and contains at least one lowercase letter, one uppercase letter, one digit and one of the following characters (£!#€$%^&*)"
                value={password} onChange={handlePasswordChange}
            />
            {errors.password ? <div className="error-text">{errors.password}</div> : null}
            <br/>

            <input
                className={errors.confirmPassword ? "field-error" : ""}
                name="confirmPassword" type="password" placeholder="Confirm password" autoComplete="confirmPassword"
                value={confirmPassword} onChange={handleConfirmPasswordChange}
            />
            {errors.confirmPassword ? <div className="error-text">{errors.confirmPassword}</div> : null}
            <br/><br/>

            <Button value="Register New User" className="green-button" onClick={handleSubmit}/>
            <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
        </form>
    )
}
