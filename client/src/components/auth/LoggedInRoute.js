import React from 'react'
import {Redirect, Route} from "react-router-dom"
import {ACCESS_LEVEL_GUEST} from "../../config/global_constants"


export const LoggedInRoute = ({component: Component, exact, path, ...rest}) =>
    <Route
        exact={exact}
        path={path}
        // Guard protected routes by access level and a non-empty token value.
        render={props => Number(localStorage.accessLevel) > ACCESS_LEVEL_GUEST
            && Boolean(localStorage.token)
            && localStorage.token !== "null"
            && localStorage.token !== "undefined"
            ? <Component {...props} {...rest} />
            : <Redirect to="/DisplayAllProducts"/>}
    />
