import React from "react"
import {BrowserRouter, Switch, Route} from "react-router-dom"
import {DisplayAllProducts} from "./components/DisplayAllProducts"
import {AddProduct} from "./components/AddProduct"
import {EditProduct} from "./components/EditProduct"
import {DeleteProduct} from "./components/DeleteProduct"
import {ResetDatabase} from "./components/ResetDatabase";
import {Register} from "./components/Register";
import "./css/App.css"
import {Navigation} from "./components/Navigation";

// Main app component with all routes
export const App = () => {
    return (
        // BrowserRouter tracks URL changes in the browser
        <BrowserRouter>
            <Navigation />
            <Switch>
                <Route exact path="/Register" component={Register} />
                <Route exact path="/ResetDatabase" component={ResetDatabase} />
                <Route exact path="/" component={DisplayAllProducts} />
                <Route exact path="/AddProduct" component={AddProduct} />
                <Route exact path="/EditProduct/:id" component={EditProduct} />
                <Route exact path="/DeleteProduct/:id" component={DeleteProduct} />
                <Route exact path="/DisplayAllProducts" component={DisplayAllProducts}/>
                <Route path="*" component={DisplayAllProducts}/>
            </Switch>
        </BrowserRouter>
    )
}
