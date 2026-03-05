import React, {useState} from "react"
import {BrowserRouter, Redirect, Route, Switch} from "react-router-dom"
import {DisplayAllProducts} from "./components/DisplayAllProducts"
import {AddProduct} from "./components/AddProduct"
import {EditProduct} from "./components/EditProduct"
import {DeleteProduct} from "./components/DeleteProduct"
import {ResetDatabase} from "./components/ResetDatabase"
import {Register} from "./components/Register"
import "./css/App.css"
import {Navigation} from "./components/Navigation"
import {Login} from "./components/Login"
import {ACCESS_LEVEL_ADMIN, ACCESS_LEVEL_GUEST} from "./config/global_constants"
import {LoggedInRoute} from "./components/LoggedInRoute"
import {ShoppingCart} from "./components/ShoppingCart"
import {useShoppingCart} from "./hooks/useShoppingCart"
import {PayPalMessage} from "./components/PayPalMessage"
import {EditProfile} from "./components/EditProfile"



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

    // Initialize guest session defaults when app is opened for the first time.
    if (typeof localStorage.accessLevel === "undefined") {
        localStorage.name = "GUEST"
        localStorage.accessLevel = ACCESS_LEVEL_GUEST
        localStorage.token = null
    }

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

                {/* Catalog routes share the same renderer to avoid duplicated props logic */}
                <Route exact path="/" render={renderCatalogPage}/>
                <Route exact path="/DisplayAllProducts" render={renderCatalogPage}/>
                <Route
                    exact
                    path="/Cart"
                    // Admin accounts are redirected because checkout flow is customer-only.
                    render={() => (isAdmin ? (
                        <Redirect to="/DisplayAllProducts"/>
                    ) : (
                        <ShoppingCart
                            cartItems={cartItems}
                            onUpdateQuantity={updateCartItemQuantity}
                            onRemoveItem={removeCartItem}
                            onClearCart={clearCart}
                        />
                    ))}
                />

                {/* Product management routes require logged-in status */}
                <LoggedInRoute exact path="/AddProduct" component={AddProduct}/>
                <LoggedInRoute exact path="/EditProduct/:id" component={EditProduct}/>
                <LoggedInRoute exact path="/DeleteProduct/:id" component={DeleteProduct}/>

                {/* Fallback route keeps users on catalog for unknown paths */}
                <Route render={renderCatalogPage}/>
            </Switch>
            <footer className="site-footer">
                © 2026 Emerald Sip. All rights reserved. Serving customers in Ireland and across the European Union.
            </footer>
        </BrowserRouter>
    )
}
