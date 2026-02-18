import React from "react";
import { Link } from "react-router-dom";

export const Navigation = ({ searchName, setSearchName }) => {
    return (
        <nav className="top-nav">
            <div className="top-nav-left">
                <Link to="/" className="top-nav-link">Home</Link>
                <Link to="/AddProduct" className="top-nav-link">Add</Link>
                <Link to="/DisplayAllProducts" className="top-nav-link">All Products</Link>
            </div>

             <div className="top-nav-center">
                <input
                    className="top-nav-search"
                    type="text"
                    placeholder="Search by name..."
                    value={searchName}
                    onChange={(e) => setSearchName(e.target.value)}
                />
                <button className="green-button" type="button" onClick={() => setSearchName("")}>
        Clear
    </button>
            </div>

            <div className="top-nav-right">
                <div className="top-nav-auth-row">
                    <Link to="/Login" className="top-nav-link">Login</Link>
                    <Link to="/Register" className="top-nav-link top-nav-action">Register</Link>
                </div>
                <Link to="/ResetDatabase" className="top-nav-link top-nav-danger">Reset Database</Link>
            </div>
        </nav>
    );
};
