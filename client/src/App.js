import React, {useEffect, useState} from "react"
import {BrowserRouter, Redirect, Route, Switch} from "react-router-dom"
import {DisplayAllProducts} from "./components/products/DisplayAllProducts"
import {AddProduct} from "./components/products/AddProduct"
import {EditProduct} from "./components/products/EditProduct"
import {DeleteProduct} from "./components/products/DeleteProduct"
import {Register} from "./components/auth/Register"
import "./css/index.css"
import {Navigation} from "./components/layout/Navigation"
import {Login} from "./components/auth/Login"
import {ACCESS_LEVEL_ADMIN, ACCESS_LEVEL_GUEST} from "./config/global_constants"
import {LoggedInRoute} from "./components/auth/LoggedInRoute"
import {ShoppingCart} from "./components/cart/ShoppingCart"
import {useShoppingCart} from "./hooks/useShoppingCart"
import {PayPalMessage} from "./components/system/PayPalMessage"
import {EditProfile} from "./components/profile/EditProfile"
import {PurchaseHistory} from "./components/profile/PurchaseHistory"
import {AdminAdjustStock} from "./components/admin/AdminAdjustStock"
import {AdminViewCustomers} from "./components/admin/AdminViewCustomers"
import {AdminViewCustomersPurchaseHistory} from "./components/admin/AdminViewCustomersPurchaseHistory"
import {
    AUTH_SESSION_CHANGED_EVENT,
    getStoredAccessLevel,
    hasValidToken,
    setGuestSession
} from "./components/auth/authShared"


// Main app component with all routes
export const App = () => {
    // Triggers re-render whenever auth session changes (login/logout/profile updates).
    const [, setSessionVersion] = useState(0)
    // Shared search query for both catalog routes.
    const [searchName, setSearchName] = useState("");
    // Centralized cart state/actions used across product and cart pages.
    const {
        cartItems,
        cartItemsCount,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart
    } = useShoppingCart()

    useEffect(() => {
        // Initialize guest session defaults once when the app is first mounted.
        const currentAccessLevel = Number(localStorage.accessLevel)
        if (!Number.isFinite(currentAccessLevel)) {
            setGuestSession()
        }
    }, [])

    useEffect(() => {
        const handleSessionChanged = () => setSessionVersion((previousVersion) => previousVersion + 1)
        window.addEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged)
        window.addEventListener("storage", handleSessionChanged)

        return () => {
            window.removeEventListener(AUTH_SESSION_CHANGED_EVENT, handleSessionChanged)
            window.removeEventListener("storage", handleSessionChanged)
        }
    }, [])

    // Admin users can manage products, customers can buy products.
    const accessLevel = getStoredAccessLevel()
    const isAdmin = accessLevel >= ACCESS_LEVEL_ADMIN && hasValidToken()
    const renderCatalogPage = () => (
        <DisplayAllProducts
            searchName={searchName}
            setSearchName={setSearchName}
            cartItems={cartItems}
            onAddToCart={isAdmin ? undefined : addToCart}
        />
    )

    return (
        // BrowserRouter handles client-side navigation without full page reload.
        <BrowserRouter>
            <Navigation cartItemsCount={cartItemsCount}/>
            <Switch>
                {/* Public auth/support pages */}
                <Route exact path="/Register" component={Register}/>
                <Route exact path="/Login" component={Login}/>
                <Route exact path="/PayPalMessage/:messageType/:payPalPaymentID" component={PayPalMessage}/>
                <Route exact path="/AdminAdjustStock"
                       render={() => (isAdmin ? <AdminAdjustStock/> : <Redirect to="/DisplayAllProducts"/>)}
                />
                <Route exact path="/AdminViewCustomers"
                       render={() => (isAdmin ? <AdminViewCustomers/> : <Redirect to="/DisplayAllProducts"/>)}
                />
                <Route exact path="/AdminViewCustomersPurchaseHistory"
                       render={() => (isAdmin ? <AdminViewCustomersPurchaseHistory/> :
                           <Redirect to="/DisplayAllProducts"/>)}
                />

                {/* Catalog routes share the same renderer to avoid duplicated props logic */}
                <Route exact path="/" render={renderCatalogPage}/>
                <Route exact path="/DisplayAllProducts" render={renderCatalogPage}/>
                <Route exact path="/Cart"
                    // Admin accounts are redirected because checkout flow is customer-only.
                       render={() => (isAdmin
                           ? (<Redirect to="/DisplayAllProducts"/>)
                           : (<ShoppingCart
                               cartItems={cartItems}
                               onUpdateQuantity={updateCartItemQuantity}
                               onRemoveItem={removeCartItem}
                               onClearCart={clearCart}
                           />))
                       }
                />

                {/* Product management routes */}
                <LoggedInRoute exact path="/AddProduct" component={AddProduct}/>
                <Route exact path="/EditProduct/:id"
                       render={(routeProps) => (isAdmin
                           ? <EditProduct {...routeProps}/>
                           : <Redirect to="/DisplayAllProducts"/>)}
                />
                <LoggedInRoute exact path="/DeleteProduct/:id" component={DeleteProduct}/>
                <LoggedInRoute exact path="/EditProfile" component={EditProfile}/>
                <Route exact path="/PurchaseHistory"
                       render={() => (
                           accessLevel > ACCESS_LEVEL_GUEST && hasValidToken() && !isAdmin
                               ? <PurchaseHistory/>
                               : <Redirect to="/DisplayAllProducts"/>
                       )}
                />


                {/* Fallback route keeps users on catalog for unknown paths */}
                <Route render={renderCatalogPage}/>
            </Switch>
            <footer className="site-footer">
                © 2026 Emerald Sip. All rights reserved. Serving customers in Ireland and across the European Union.
            </footer>
        </BrowserRouter>
    )
}
