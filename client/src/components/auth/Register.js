import React, {useEffect, useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "../ui/Button"
import {SERVER_HOST} from "../../config/global_constants"
import {getAuthErrorMessage, setUserSession} from "./authShared"

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

    // Reusable field updater that also clears stale server and field errors.
    const handleFieldChange = (setValue, fieldName) => (event) => {
        setValue(event.target.value)
        setServerError("")
        setErrors((previousErrors) => ({...previousErrors, [fieldName]: ""}))
    }

    const handleFileChange = (event) => {
        const file = event.target.files[0] || null
        // Keep the selected file for multipart/form-data submit.
        setSelectedFile(file)
        // Clear stale server error once user re-selects file.
        setServerError("")
        setErrors((previousErrors) => ({...previousErrors, profilePhoto: ""}))

        if (file) {
            setPreviewPhoto(URL.createObjectURL(file))
            return
        }
        setPreviewPhoto(null)
    }

    useEffect(() => {
        // Prevent memory leaks from object URLs created for local image preview.
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
                // Backend may return a successful HTTP status with an error payload.
                if (res.data.errorMessage) {
                    setServerError(res.data.errorMessage)
                    return
                }

                setUserSession(res.data)
                setIsRegistered(true)
            })
            .catch(err => {
                setServerError(getAuthErrorMessage(err, "Registration failed"))
            })
    }


    return (
        <form className="form-container" noValidate={true}>

            {/* Redirect to product listing after successful registration */}
            {isRegistered ? <Redirect to="/DisplayAllProducts"/> : null}

            <h2>New User Registration</h2>
            {/* Server-level registration error */}
            {serverError ? <div className="error-text">{serverError}</div> : null}

            <input
                className={errors.name ? "field-error" : ""}
                name="name" type="text" placeholder="Name" autoComplete="name" value={name}
                onChange={handleFieldChange(setName, "name")} autoFocus
            />
            {/* Name field validation message */}
            {errors.name ? <div className="error-text">{errors.name}</div> : null}<br/>

            <input
                className={errors.email ? "field-error" : ""}
                name="email" type="email" placeholder="Email" autoComplete="email" value={email}
                onChange={handleFieldChange(setEmail, "email")}
            />
            {/* Email field validation message */}
            {errors.email ? <div className="error-text">{errors.email}</div> : null}<br/>

            <input
                className={errors.password ? "field-error" : ""}
                name="password" type="password" placeholder="Password" autoComplete="password"
                title="Password must be at least ten-digits long and contains at least one lowercase letter, one uppercase letter, one digit and one of the following characters (£!#€$%^&*)"
                value={password} onChange={handleFieldChange(setPassword, "password")}
            />
            {/* Password field validation message */}
            {errors.password ? <div className="error-text">{errors.password}</div> : null}<br/>

            <input
                className={errors.confirmPassword ? "field-error" : ""}
                name="confirmPassword" type="password" placeholder="Confirm password" autoComplete="confirmPassword"
                value={confirmPassword} onChange={handleFieldChange(setConfirmPassword, "confirmPassword")}
            />
            {/* Confirm-password validation message */}
            {errors.confirmPassword ? <div className="error-text">{errors.confirmPassword}</div> : null}<br/><br/>
            
            <label htmlFor="registerProfilePhoto">Profile photo (optional)</label>
            <input
                id="registerProfilePhoto"
                type="file"
                accept=".png,.jpg,.jpeg,image/png,image/jpeg"
                onChange={handleFileChange}
            />
            {previewPhoto ? (
                <img className="profile-file-preview" src={previewPhoto} alt="Profile preview"/>
            ) : null}
            {errors.profilePhoto ? <div className="error-text">{errors.profilePhoto}</div> : null}
            <br/><br/>

            <Button value="Register New User" className="green-button" onClick={handleSubmit}/>
            <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
        </form>
    )
}
