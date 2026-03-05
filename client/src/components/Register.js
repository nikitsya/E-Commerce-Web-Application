import React, {useEffect, useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"

export const Register = () => {
    // Controlled form fields for registration.
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    // Selected profile photo file for multipart upload.
    const [selectedFile, setSelectedFile] = useState(null)
    const [previewPhoto, setPreviewPhoto] = useState(null)


    // Redirect after successful registration.
    const [isRegistered, setIsRegistered] = useState(false)
    // Client-side validation errors by field.
    const [errors, setErrors] = useState({})
    // Backend error message (e.g. duplicate user).
    const [serverError, setServerError] = useState("")

    const handleNameChange = e => {
        setName(e.target.value)
        // Clear previous server error as user edits form values.
        setServerError("")
        setErrors((previousErrors) => ({...previousErrors, name: ""}))
    }

    const handleEmailChange = e => {
        setEmail(e.target.value)
        setServerError("")
        setErrors((previousErrors) => ({...previousErrors, email: ""}))
    }

    const handlePasswordChange = e => {
        setPassword(e.target.value)
        setServerError("")
        setErrors((previousErrors) => ({...previousErrors, password: ""}))
    }

    const handleConfirmPasswordChange = e => {
        setConfirmPassword(e.target.value)
        setServerError("")
        setErrors((previousErrors) => ({...previousErrors, confirmPassword: ""}))
    }

    const handleFileChange = e =>
    {
         const file = e.target.files[0] || null
    // Keep the selected file for multipart/form-data submit.
    setSelectedFile(file)
    // Clear stale server error once user re-selects file.
    setServerError("")

    if (file) {
        setPreviewPhoto(URL.createObjectURL(file))
    } else {
        setPreviewPhoto(null)
    }
    }

useEffect(() => {
    return () => {
        if (previewPhoto) {
            URL.revokeObjectURL(previewPhoto)
        }
    }
}, [previewPhoto])


    const validate = () => {
        // Build all validation errors first, then render them together.
        const next = {}
        const normalizedName = name.trim()
        const normalizedEmail = email.trim()

        if (!normalizedName) next.name = "Name is required"

        if (!normalizedEmail) next.email = "Email is required"
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) next.email = "Invalid email format"

        if (!password) next.password = "Password is required"
        else if (password.length < 10) next.password = "Password must be at least 10 characters"

        if (!confirmPassword) next.confirmPassword = "Please confirm password"
        else if (password !== confirmPassword) next.confirmPassword = "Passwords do not match"
        if (!selectedFile) next.profilePhoto = "Profile photo is required"

        return next
    }


    const handleSubmit = e => {
        // Prevent native form submission and full-page reload.
        e.preventDefault()
        setServerError("")

        // Stop request if local validation fails.
        const next = validate()
        if (Object.keys(next).length > 0) {
            setErrors(next)
            return
        }

        setErrors({})

        // Route uses URL params, so encode to keep special characters safe.
        const encodedName = encodeURIComponent(name.trim())
        const encodedEmail = encodeURIComponent(email.trim())
        const encodedPassword = encodeURIComponent(password)

        // Build multipart payload for profile photo upload.
        const formData = new FormData()
        if (selectedFile) {
            formData.append("profilePhoto", selectedFile)
        }

        axios.post(`${SERVER_HOST}/users/register/${encodedName}/${encodedEmail}/${encodedPassword}`, formData,
         {headers: {"Content-type": "multipart/form-data"}}    
        )
            .then((res) => {
                
                if (res.data.errorMessage) {
                    setServerError(res.data.errorMessage)
                    return
                }

                // Save authenticated session values returned by backend.
                localStorage.name = res.data.name
                localStorage.accessLevel = res.data.accessLevel
                localStorage.profilePhoto = res.data.profilePhoto
                localStorage.token = res.data.token
                setIsRegistered(true)
            })
            .catch(err => {
                setServerError(err?.response?.data || "Registration failed")
            })
    }


    return (
        <form className="form-container" noValidate={true} id="loginOrRegistrationForm">

            {/* Redirect to product listing after successful registration */}
            {isRegistered ? <Redirect to="/DisplayAllProducts"/> : null}

            <h2>New User Registration</h2>
            {/* Server-level registration error */}
            {serverError ? <div className="error-text">{serverError}</div> : null}

            <input
                className={errors.name ? "field-error" : ""}
                name="name" type="text" placeholder="Name" autoComplete="name" value={name}
                onChange={handleNameChange} autoFocus
            />
            {/* Name field validation message */}
            {errors.name ? <div className="error-text">{errors.name}</div> : null}<br/>

            <input
                className={errors.email ? "field-error" : ""}
                name="email" type="email" placeholder="Email" autoComplete="email" value={email}
                onChange={handleEmailChange}
            />
            {/* Email field validation message */}
            {errors.email ? <div className="error-text">{errors.email}</div> : null}<br/>

            <input
                className={errors.password ? "field-error" : ""}
                name="password" type="password" placeholder="Password" autoComplete="password"
                title="Password must be at least ten-digits long and contains at least one lowercase letter, one uppercase letter, one digit and one of the following characters (£!#€$%^&*)"
                value={password} onChange={handlePasswordChange}
            />
            {/* Password field validation message */}
            {errors.password ? <div className="error-text">{errors.password}</div> : null}<br/>

            <input
                className={errors.confirmPassword ? "field-error" : ""}
                name="confirmPassword" type="password" placeholder="Confirm password" autoComplete="confirmPassword"
                value={confirmPassword} onChange={handleConfirmPasswordChange}
            />
            {/* Confirm-password validation message */}
            {errors.confirmPassword ? <div className="error-text">{errors.confirmPassword}</div> : null}<br/><br/>
            
            <input
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleFileChange}
            />
            {previewPhoto ? (
                <img className="profile-file-preview" src={previewPhoto} alt="New photo preview"/>
            ) : null}
            {errors.profilePhoto ? <div className="error-text">{errors.profilePhoto}</div> : null}
            <br/><br/>

            <Button value="Register New User" className="green-button" onClick={handleSubmit}/>
            <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
        </form>
    )
}
