import React, {useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "../ui/Button"
import {SERVER_HOST} from "../../config/global_constants"
import {getAuthErrorMessage, setGuestSession, setUserSession} from "./authShared"


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

    // Reusable field updater that also clears stale server and field errors.
    const handleFieldChange = (setValue, fieldName) => (e) => {
        setValue(e.target.value)
        setServerError("")
        setErrors((previousErrors) => ({...previousErrors, [fieldName]: ""}))
    }

    const validate = () => {
        // Build validation result in one object for easy rendering.
        const next = {}

        // Basic required + format checks for email.
        const normalizedEmail = email.trim()
        if (!normalizedEmail) next.email = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) next.email = "Invalid email format"

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

        // Backend login route currently accepts credentials via URL params.
        axios.post(`${SERVER_HOST}/users/login/${email}/${password}`)
            .then(res => {
                // Backend returns errorMessage for invalid credentials.
                if (res.data.errorMessage) throw new Error(res.data.errorMessage)

                setUserSession(res.data)
                setIsLoggedIn(true)
            })
            .catch(err => {
                // Reset to guest mode on failed login attempt.
                setGuestSession()
                setServerError(getAuthErrorMessage(err, "Login failed"))
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
                onChange={handleFieldChange(setEmail, "email")}
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
                onChange={handleFieldChange(setPassword, "password")}
            />

            {/* Password validation message */}
            {errors.password ? <div className="error-text">{errors.password}</div> : null}<br/><br/>

            <Button value="Login" className="green-button" onClick={handleSubmit}/>
            <Link className="red-button" to="/DisplayAllProducts">Cancel</Link>
        </form>
    )
}
