import React, {useState} from "react"; // useState controls mobile menu open/close
import {Link} from "react-router-dom";



export const Navigation = ({ searchName, setSearchName }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state

    const closeMenu = () => setIsMenuOpen(false); // Close menu after link click

    return (
        <nav className="top-nav">
             <button
                className="hamburger-btn"
                type="button"
                aria-label="Toggle navigation menu"
                aria-expanded={isMenuOpen}
                onClick={() => setIsMenuOpen((prev) => !prev)}
            >
                ☰
            </button>
            <div className={"top-nav-left " + (isMenuOpen ? "menu-open" : "")}>
                <Link to="/" className="top-nav-link" onClick={closeMenu}>Home</Link>
                <Link to="/AddProduct" className="top-nav-link" onClick={closeMenu}>Add</Link>
                <Link to="/DisplayAllProducts" className="top-nav-link" onClick={closeMenu}>All Products</Link>
            </div>

            <div className={"top-nav-center " + (isMenuOpen ? "menu-open" : "")}>
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

            <div className={"top-nav-right " + (isMenuOpen ? "menu-open" : "")}>
                <div className="top-nav-auth-row">
                        {sessionStorage.accessLevel > ACCESS_LEVEL_GUEST ? (
                    <Link to="/Logout" className="top-nav-link" onClick={closeMenu}>Logout</Link>
                ) : (
                    <>
                    <Link to="/Login" className="top-nav-link" onClick={closeMenu}>Login</Link>
                    <Link to="/Register" className="top-nav-link top-nav-action" onClick={closeMenu}>Register</Link>
                </>
                )}
            </div>
                <Link to="/ResetDatabase" className="top-nav-link top-nav-danger" onClick={closeMenu}>Reset Database</Link>
            </div>
        </nav>
    );
};
