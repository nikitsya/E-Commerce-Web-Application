import React, {useState} from "react"
import {Redirect} from "react-router-dom"
import axios from "axios"
import {Button} from "./Button"
import {SERVER_HOST} from "../config/global_constants"


export const Logout = ({onLoggedOut = () => {}}) => {
    const [isLoggedIn, setIsLoggedIn] = useState(true)

    const handleSubmit = e => {
        e.preventDefault()

        //axios.defaults.withCredentials = true // needed for sessions to work
        axios.post(`${SERVER_HOST}/users/logout`)
            .then(() => {
                localStorage.clear()
                onLoggedOut()

                //  localStorage.name = "GUEST"
                //  localStorage.accessLevel = ACCESS_LEVEL_GUEST
                setIsLoggedIn(false)
            })
            .catch(err => console.log(`${err.response.data}\n${err}`))
    }

    return (
        <div>
            {!isLoggedIn ? <Redirect to="/DisplayAllProducts"/> : null}
            <Button value="Log out" className="red-button" onClick={handleSubmit}/>
        </div>
    )
}
