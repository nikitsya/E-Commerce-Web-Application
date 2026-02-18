import React, { useState } from "react"
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
    const [searchName, setSearchName] = useState("");

    return (
        // BrowserRouter tracks URL changes in the browser
        <BrowserRouter>
            <Navigation searchName={searchName} setSearchName={setSearchName} />
            <Switch>
                <Route exact path="/Register" component={Register} />
                <Route exact path="/ResetDatabase" component={ResetDatabase} />

                <Route exact path="/" render={() => <DisplayAllProducts searchName={searchName} />} />
                <Route exact path="/DisplayAllProducts" render={() => <DisplayAllProducts searchName={searchName} />} />

                <Route exact path="/AddProduct" component={AddProduct} />
                <Route exact path="/EditProduct/:id" component={EditProduct} />
                <Route exact path="/DeleteProduct/:id" component={DeleteProduct} />

                <Route render={() => <DisplayAllProducts searchName={searchName} />} />
             </Switch>
        </BrowserRouter>
    )
}
