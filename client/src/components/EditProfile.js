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
