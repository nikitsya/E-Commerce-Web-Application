import React, {useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {ACCESS_LEVEL_GUEST, SERVER_HOST} from "../config/global_constants"


export const Login = () => {
    // Controlled form fields.
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    // Redirect flag after successful authentication.
    const [isLoggedIn, setIsLoggedIn] = useState(false)
    // Field-level client validation errors.
    const [errors, setErrors] = useState({})
    // Server-side authentication error message.
    const [serverError, setServerError] = useState("")

    const handleEmailChange = e => {
        // Keep input value synced with component state.
        setEmail(e.target.value)
        // Clear previous backend error as user edits credentials.
        setServerError("")
    }

    const handlePasswordChange = e => {
        // Keep input value synced with component state.
        setPassword(e.target.value)
        // Clear previous backend error as user edits credentials.
        setServerError("")
    }

    const validate = () => {
        // Build validation result in one object for easy rendering.
        const next = {}

        // Basic required + format checks for email.
        if (!email.trim()) next.email = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email format"

        // Password is required for login request.
        if (!password) next.password = "Password is required"

        return next
    }

    const handleSubmit = e => {
        // Prevent native form submit navigation.
        e.preventDefault()
        setServerError("")

        // Stop API request if local validation fails.
        const next = validate()
        if (Object.keys(next).length > 0) {
            setErrors(next)
            return
        }

        setErrors({})

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.post(`${SERVER_HOST}/users/login/${email}/${password}`)
            .then(res => {
                // Backend returns errorMessage for invalid credentials.
                if (res.data.errorMessage) throw new Error(res.data.errorMessage)

                // Persist session data used by route guards and protected requests.
                localStorage.name = res.data.name
                localStorage.accessLevel = res.data.accessLevel
                localStorage.profilePhoto = res.data.profilePhoto || null
                localStorage.token = res.data.token
                setIsLoggedIn(true)
            })
            .catch(err => {
                // Reset to guest mode on failed login attempt.
                localStorage.name = "GUEST"
                localStorage.accessLevel = ACCESS_LEVEL_GUEST
                setServerError(err?.response?.data || err.message || "Login failed")
            })
    }

    return (
        <form className="form-container" noValidate={true} id="loginOrRegistrationForm">
            <h2>Login</h2>

            {/* Server-level auth error message */}
            {serverError ? <div className="error-text">{serverError}</div> : null}
            {/* Redirect user back to catalog after successful login */}
            {isLoggedIn ? <Redirect to="/DisplayAllProducts"/> : null}

            <input
                className={errors.email ? "field-error" : ""}
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleEmailChange}
            />

            {/* Email validation message */}
            {errors.email ? <div className="error-text">{errors.email}</div> : null}<br/>

            <input
                className={errors.password ? "field-error" : ""}
                type="password"
                name="password"
                placeholder="Password"
                autoComplete="password"
                value={password}
                onChange={handlePasswordChange}
            />

            {/* Password validation message */}
            {errors.password ? <div className="error-text">{errors.password}</div> : null}<br/><br/>

            <Button value="Login" className="green-button" onClick={handleSubmit}/>
            <Link className="red-button" to="/DisplayAllProducts">Cancel</Link>
        </form>
    )
}
