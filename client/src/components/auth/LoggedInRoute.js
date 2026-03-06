import React from 'react'
import {Redirect, Route} from "react-router-dom"
import {ACCESS_LEVEL_GUEST} from "../../config/global_constants"


export const LoggedInRoute = ({component: Component, exact, path, ...rest}) =>
    <Route
        exact={exact}
        path={path}
        render={props => Number(localStorage.accessLevel) > ACCESS_LEVEL_GUEST
            ? <Component {...props} {...rest} />
            : <Redirect to="/DisplayAllProducts"/>}
    />
