import React, {useState} from "react"; // useState controls mobile menu open/close
import {Link, withRouter} from "react-router-dom";
import {ACCESS_LEVEL_ADMIN, ACCESS_LEVEL_GUEST} from "../config/global_constants"
import {Logout} from "./Logout"


const NavigationComponent = ({cartItemsCount = 0}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state
    const closeMenu = () => setIsMenuOpen(false); // Close menu after link click
    const isLoggedIn = Number(localStorage.accessLevel) > ACCESS_LEVEL_GUEST
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN

    return (
        <header className="top-nav-shell">
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
                    <Link to="/" className="top-nav-logo-link" onClick={closeMenu} aria-label="Home">
                        <img className="top-nav-logo" src="/icons/logo.png" alt="Emerald Sip logo"/>
                    </Link>
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
                        {!isAdmin ? <Link to="/Cart" className="top-nav-link top-nav-cart-link" onClick={closeMenu}>Cart
                            ({cartItemsCount})</Link> : null}
                    </div>
                    <Link to="/ResetDatabase" className="top-nav-link top-nav-danger" onClick={closeMenu}>Reset Database</Link>
                </div>
            </nav>
        </header>
    );
};

export const Navigation = withRouter(NavigationComponent)
