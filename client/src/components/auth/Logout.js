import React, {useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "../ui/Button"
import {SERVER_HOST} from "../../config/global_constants"
import {clearSession, getAuthErrorMessage} from "./authShared"


export const Logout = ({onLoggedOut = () => {}}) => {
    // Component redirects after successful logout request.
    const [isLoggedIn, setIsLoggedIn] = useState(true)
    const [serverError, setServerError] = useState("")

    const handleSubmit = e => {
        e.preventDefault()
        setServerError("")

        axios.post(`${SERVER_HOST}/users/logout`)
            .then(() => {
                // Clear client session and notify parent navigation/profile UI.
                clearSession()
                onLoggedOut()
                setIsLoggedIn(false)
            })
            .catch(err => setServerError(getAuthErrorMessage(err, "Logout failed")))
    }

    return (
        <div>
            {!isLoggedIn ? <Redirect to="/DisplayAllProducts"/> : null}
            {serverError ? <div className="error-text">{serverError}</div> : null}
            <Button value="Log out" className="red-button" onClick={handleSubmit}/>
        </div>
    )
}
