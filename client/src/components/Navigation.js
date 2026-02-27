import React, {useState} from "react"; // useState controls mobile menu open/close
import {Link, withRouter} from "react-router-dom";
import {ACCESS_LEVEL_ADMIN, ACCESS_LEVEL_GUEST} from "../config/global_constants"
import {Logout} from "./Logout"


const NavigationComponent = ({searchName, setSearchName, cartItemsCount = 0}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state

    const closeMenu = () => setIsMenuOpen(false); // Close menu after link click

    const isLoggedIn = Number(localStorage.accessLevel) > ACCESS_LEVEL_GUEST
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN

    return (
        <>
            <div className="market-topbar">Based in Ireland | EU-wide shipping | Prices in EUR (€)</div>
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
                    {isAdmin ?
                        <Link to="/AddProduct" className="top-nav-link" onClick={closeMenu}>Add</Link> : null}
                    <Link to="/DisplayAllProducts" className="top-nav-link" onClick={closeMenu}>All Products</Link>
                    {!isAdmin ? <Link to="/Cart" className="top-nav-link" onClick={closeMenu}>Cart ({cartItemsCount})</Link> : null}
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
                        {isLoggedIn ? (
                            <Logout/>
                        ) : (
                            <>
                                <Link to="/Login" className="top-nav-link" onClick={closeMenu}>Login</Link>
                                <Link to="/Register" className="top-nav-link top-nav-action"
                                      onClick={closeMenu}>Register</Link>
                            </>
                        )}
                    </div>
                    <Link to="/ResetDatabase" className="top-nav-link top-nav-danger" onClick={closeMenu}>Reset
                        Database</Link>
                </div>
            </nav>
        </>
    );
};
export const Navigation = withRouter(NavigationComponent)
