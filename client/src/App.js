import React, {useEffect, useState} from "react"
import {BrowserRouter, Link, Redirect, Route, Switch} from "react-router-dom"
import {DisplayAllProducts} from "./components/products/DisplayAllProducts"
import {AddProduct} from "./components/products/AddProduct"
import {EditProduct} from "./components/products/EditProduct"
import {DeleteProduct} from "./components/products/DeleteProduct"
import {ResetDatabase} from "./components/system/ResetDatabase"
import {Register} from "./components/auth/Register"
import "./css/App.css"
import {Navigation} from "./components/layout/Navigation"
import {Login} from "./components/auth/Login"
import {ACCESS_LEVEL_ADMIN, ACCESS_LEVEL_GUEST} from "./config/global_constants"
import {LoggedInRoute} from "./components/auth/LoggedInRoute"
import {ShoppingCart} from "./components/cart/ShoppingCart"
import {useShoppingCart} from "./hooks/useShoppingCart"
import {PayPalMessage} from "./components/system/PayPalMessage"
import {EditProfile} from "./components/profile/EditProfile"
import {AdminAdjustStock} from "./components/admin/AdminAdjustStock"
import {AdminViewCustomers} from "./components/admin/AdminViewCustomers"
import {AdminViewCustomersPurchaseHistory} from "./components/admin/AdminViewCustomersPurchaseHistory"


// Main app component with all routes
export const App = () => {
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
        if (typeof localStorage.accessLevel === "undefined") {
            localStorage.name = "GUEST"
            localStorage.accessLevel = ACCESS_LEVEL_GUEST
            localStorage.token = null
        }
    }, [])

    // Admin users can manage products, customers can buy products.
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
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
                <Route exact path="/ResetDatabase" component={ResetDatabase}/>
                <Route exact path="/AdminAdjustStock"
                    render={() => (isAdmin ? <AdminAdjustStock/> : <Redirect to="/DisplayAllProducts"/>)}
                />
                <Route exact path="/AdminViewCustomers"
                    render={() => (isAdmin ? <AdminViewCustomers/> : <Redirect to="/DisplayAllProducts"/>)}
                />
                <Route exact path="/AdminViewCustomersPurchaseHistory"
                    render={() => (isAdmin ? <AdminViewCustomersPurchaseHistory/> : <Redirect to="/DisplayAllProducts"/>)}
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


                {/* Fallback route keeps users on catalog for unknown paths */}
                <Route render={renderCatalogPage}/>
            </Switch>
            <footer className="site-footer">
                © 2026 Emerald Sip. All rights reserved. Serving customers in Ireland and across the European Union.
                <Link to="/ResetDatabase" className="top-nav-link top-nav-danger">Reset Database</Link>
            </footer>
        </BrowserRouter>
    )
}
