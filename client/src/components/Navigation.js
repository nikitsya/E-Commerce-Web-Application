import React from "react";
import { Link } from "react-router-dom";

export const Navigation = () => {
    return (
        <nav className="top-nav">
            <div className="top-nav-left">
                <Link to="/" className="top-nav-link">Home</Link>
                <Link to="/AddProduct" className="top-nav-link">Add</Link>
                <Link to="/DisplayAllProducts" className="top-nav-link">All Products</Link>
            </div>
            <div className="top-nav-right">
                <Link to="/Login" className="top-nav-link">Login</Link>
                <Link to="/Register" className="top-nav-link top-nav-action">Register</Link>
                <Link to="/ResetDatabase" className="top-nav-link top-nav-danger">Reset Database</Link>
            </div>
        </nav>
    );
};
