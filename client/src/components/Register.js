import React, {useState} from "react"
import {Redirect, Link} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"

export const Register = props => {
    const [name, setName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [isRegistered, setIsRegistered] = useState(false)

    const handleNameChange = e => {
        setName(e.target.value)
    }

    const handleEmailChange = e => {
        setEmail(e.target.value)
    }

    const handlePasswordChange = e => {
        setPassword(e.target.value)
    }

    const handleConfirmPasswordChange = e => {
        setConfirmPassword(e.target.value)
    }

    const handleSubmit = e => {
        e.preventDefault()

        axios.post(`${SERVER_HOST}/users/register/${name}/${email}/${password}`)
        .then(res => {
            setIsRegistered(true)
        })
        .catch(err => console.log(`${err.response.data}\n${err}`))
    }

    return (
        <form className="form-container" noValidate = {true} id = "loginOrRegistrationForm">
    
        {isRegistered ? <Redirect to="/DisplayAllCars"/> : null} 
    
        <h2>New User Registration</h2>
    
        <input name = "name" type = "text" placeholder = "Name" autoComplete="name" value = {name}
               onChange = {handleNameChange} autoFocus
        /><br/>
    
        <input name = "email" type = "email" placeholder = "Email" autoComplete="email" value = {email}
            onChange = {handleEmailChange}
        /><br/>
    
        <input name = "password" type = "password" placeholder = "Password" autoComplete="password"
            title = "Password must be at least ten-digits long and contains at least one lowercase letter, one uppercase letter, one digit and one of the following characters (£!#€$%^&*)"
            value = {password} onChange = {handlePasswordChange}
        /><br/>
    
        <input name = "confirmPassword" type = "password" placeholder = "Confirm password" autoComplete="confirmPassword"
            value = {confirmPassword} onChange = {handleConfirmPasswordChange}
        /><br/><br/>
    
        <Button value="Register New User" className="green-button" onClick={handleSubmit} />
        <Link className="red-button" to={"/DisplayAllCars"}>Cancel</Link>   
    </form>
    )
}