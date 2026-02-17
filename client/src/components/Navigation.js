import React from "react";
import { Link } from "react-router-dom";

export const Navigation = () => {
    return (
        <nav className="top-nav">
            <Link to="/" className="top-nav-link">Home</Link>
            <Link to="/AddProduct" className="top-nav-link">Add</Link>
            <Link to="/DisplayAllProducts" className="top-nav-link">All Products</Link>
        </nav>
    );
};
