import React, {useState} from "react"
import {BrowserRouter, Route, Switch} from "react-router-dom"
import {DisplayAllProducts} from "./components/DisplayAllProducts"
import {AddProduct} from "./components/AddProduct"
import {EditProduct} from "./components/EditProduct"
import {DeleteProduct} from "./components/DeleteProduct"
import {ResetDatabase} from "./components/ResetDatabase"
import {Register} from "./components/Register"
import "./css/App.css"
import {Navigation} from "./components/Navigation"
import {Login} from "./components/Login"
import {ACCESS_LEVEL_GUEST} from "./config/global_constants"
import {LoggedInRoute} from "./components/LoggedInRoute"
import {ShoppingCart} from "./components/ShoppingCart"
import {useShoppingCart} from "./hooks/useShoppingCart"


// Main app component with all routes
export const App = () => {
    const [searchName, setSearchName] = useState("");
    const {
        cartItems,
        cartItemsCount,
        addToCart,
        updateCartItemQuantity,
        removeCartItem,
        clearCart
    } = useShoppingCart()

    if (typeof sessionStorage.accessLevel === "undefined") {
        sessionStorage.name = "GUEST"
        sessionStorage.accessLevel = ACCESS_LEVEL_GUEST
    }

    return (
        // BrowserRouter tracks URL changes in the browser
        <BrowserRouter>
            <Navigation
                searchName={searchName}
                setSearchName={setSearchName}
                cartItemsCount={cartItemsCount}
            />
            <Switch>
                <Route exact path="/Register" component={Register}/>
                <Route exact path="/Login" component={Login}/>
                <Route exact path="/ResetDatabase" component={ResetDatabase}/>

                <Route
                    exact
                    path="/"
                    render={() => <DisplayAllProducts searchName={searchName} onAddToCart={addToCart}/>}
                />
                <Route
                    exact
                    path="/DisplayAllProducts"
                    render={() => <DisplayAllProducts searchName={searchName} onAddToCart={addToCart}/>}
                />
                <Route
                    exact
                    path="/Cart"
                    render={() => (
                        <ShoppingCart
                            cartItems={cartItems}
                            onUpdateQuantity={updateCartItemQuantity}
                            onRemoveItem={removeCartItem}
                            onClearCart={clearCart}
                        />
                    )}
                />

                <LoggedInRoute exact path="/AddProduct" component={AddProduct}/>
                <LoggedInRoute exact path="/EditProduct/:id" component={EditProduct}/>
                <LoggedInRoute exact path="/DeleteProduct/:id" component={DeleteProduct}/>

                <Route render={() => <DisplayAllProducts searchName={searchName} onAddToCart={addToCart}/>}/>
            </Switch>
        </BrowserRouter>
    )
}
