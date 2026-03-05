import React, {useEffect, useState} from "react"
import {Link, Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"


export const EditProfile = () => {

// Editable profile fields.
const [name, setName] = useState("")
const [email, setEmail] = useState("")
const [phone, setPhone] = useState("")
const [address, setAddress] = useState("")

// Profile photo data for preview + newly selected file.
const [profilePhoto, setProfilePhoto] = useState(localStorage.profilePhoto || null)
const [selectedFile, setSelectedFile] = useState(null)

// Form UX state.
const [errors, setErrors] = useState({})
const [serverError, setServerError] = useState("")
const [successMessage, setSuccessMessage] = useState("")
const [isLoading, setIsLoading] = useState(true)

// Redirect to catalog after successful save.
const [isSaved, setIsSaved] = useState(false)

useEffect(() => {
    // Load current user's profile using JWT.
    axios.get(`${SERVER_HOST}/users/profile`, {headers: {authorization: localStorage.token}})
        .then((res) => {
            setName(res.data.name || "")
            setEmail(res.data.email || "")
            setPhone(res.data.phone || "")
            setAddress(res.data.address || "")
            setProfilePhoto(res.data.profilePhoto || null)
        })
        .catch((err) => {
            setServerError(err?.response?.data || "Failed to load profile")
        })
        .finally(() => setIsLoading(false))
}, [])

const validate = () => {
    // Collect all validation issues before submit.
    const next = {}
    if (!name.trim()) next.name = "Name is required"
    if (!address.trim()) next.address = "Address is required"
    if (phone.trim() && !/^\d{7,15}$/.test(phone.trim())) next.phone = "Phone must be 7-15 digits"
    return next
}

const handleSubmit = (e) => {
    e.preventDefault()
    setServerError("")
    setSuccessMessage("")
    setIsSaved(false)


    const next = validate()
    if (Object.keys(next).length > 0) {
        setErrors(next)
        return
    }
    setErrors({})

    // Send text fields and optional image in one multipart request.
    const formData = new FormData()
    formData.append("name", name.trim())
    formData.append("phone", phone.trim())
    formData.append("address", address.trim())
    if (selectedFile) formData.append("profilePhoto", selectedFile)

    axios.put(`${SERVER_HOST}/users/profile`, formData, {
        headers: {
            authorization: localStorage.token,
            "Content-type": "multipart/form-data"
        }
    })
        .then((res) => {
            // Keep client identity/avatar in sync with updated profile.
            localStorage.name = res.data.name
            localStorage.profilePhoto = res.data.profilePhoto
            setProfilePhoto(res.data.profilePhoto || null)
            setSelectedFile(null)
            setSuccessMessage("Profile updated successfully")
            setIsSaved(true)
        })
        .catch((err) => {
            setServerError(err?.response?.data || "Failed to update profile")
        })
}

if (isLoading) {
    return <div className="form-container"><h2>Edit Profile</h2><div>Loading...</div></div>
}

if (isSaved) {
    return <Redirect to="/DisplayAllProducts"/>
}

return (
    <form className="form-container" noValidate={true}>
        <h2>Edit Profile</h2>

        {serverError ? <div className="error-text">{serverError}</div> : null}
        {successMessage ? <div className="success-text">{successMessage}</div> : null}

        {profilePhoto ? <img className="profile-preview" src={`data:;base64,${profilePhoto}`} alt="Profile"/> : null}

        <input
            className={errors.name ? "field-error" : ""}
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
        />
        {errors.name ? <div className="error-text">{errors.name}</div> : null}<br/>

        <input type="email" value={email} disabled /><br/>

        <input
            className={errors.phone ? "field-error" : ""}
            type="text"
            placeholder="Phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
        />
        {errors.phone ? <div className="error-text">{errors.phone}</div> : null}<br/>

        <input
            className={errors.address ? "field-error" : ""}
            type="text"
            placeholder="Address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
        />
        {errors.address ? <div className="error-text">{errors.address}</div> : null}<br/>

        <input
            type="file"
            accept=".png,.jpg,.jpeg,image/png,image/jpeg"
            onChange={(e) => setSelectedFile(e.target.files[0] || null)}
        /><br/><br/>

        <Button value="Save Profile" className="green-button" onClick={handleSubmit}/>
        <Link className="red-button" to={"/DisplayAllProducts"}>Cancel</Link>
    </form>
)
}