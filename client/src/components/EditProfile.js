import React, {useEffect, useState} from "react"
import {Link} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"

export const EditProfile = () => {
    return <div>Edit Profile</div>
}

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
        })
        .catch((err) => {
            setServerError(err?.response?.data || "Failed to update profile")
        })
}

if (isLoading) {
    return <div className="form-container"><h2>Edit Profile</h2><div>Loading...</div></div>
}
