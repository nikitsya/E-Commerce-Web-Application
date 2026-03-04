import React, {useEffect, useState} from "react"; // useState controls mobile menu open/close
import {Link, withRouter} from "react-router-dom";
import {ACCESS_LEVEL_ADMIN, ACCESS_LEVEL_GUEST} from "../config/global_constants"
import {Logout} from "./Logout"


const NavigationComponent = ({cartItemsCount = 0}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false); // Mobile menu state
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false)
    const closeMenu = () => setIsMenuOpen(false); // Close menu after link click
    const closeProfileModal = () => setIsProfileModalOpen(false)
    const isLoggedIn = Number(localStorage.accessLevel) > ACCESS_LEVEL_GUEST
    const isAdmin = Number(localStorage.accessLevel) >= ACCESS_LEVEL_ADMIN
    const profilePhoto = localStorage.profilePhoto
    const hasProfilePhoto = Boolean(profilePhoto && profilePhoto !== "null")
    const profileName = String(localStorage.name || "Account").trim() || "Account"
    const profileInitial = profileName.charAt(0).toUpperCase()

    useEffect(() => {
        if (!isProfileModalOpen) return undefined

        const originalBodyOverflow = document.body.style.overflow
        const handleEscClose = (event) => {
            if (event.key === "Escape") closeProfileModal()
        }

        document.body.style.overflow = "hidden"
        document.addEventListener("keydown", handleEscClose)

        return () => {
            document.body.style.overflow = originalBodyOverflow
            document.removeEventListener("keydown", handleEscClose)
        }
    }, [isProfileModalOpen])


    return (
        <>
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
                                <div className="top-nav-user-group">
                                    <button
                                        type="button"
                                        className="top-nav-profile-trigger"
                                        onClick={() => {
                                            closeMenu()
                                            setIsProfileModalOpen(true)
                                        }}
                                        aria-label="Open profile menu"
                                        aria-haspopup="dialog"
                                        aria-expanded={isProfileModalOpen}
                                    >
                                        {hasProfilePhoto ? (
                                            <img
                                                className="top-nav-profile-photo"
                                                src={`data:;base64,${profilePhoto}`}
                                                alt="Profile"
                                            />
                                        ) : (
                                            <span className="top-nav-profile-fallback">{profileInitial}</span>
                                        )}
                                    </button>
                                </div>
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
                    </div>
                </nav>
            </header>

            {isLoggedIn && isProfileModalOpen ? (
                <div className="profile-modal-overlay" onClick={closeProfileModal}>
                    <div className="profile-modal-card" onClick={(event) => event.stopPropagation()} role="dialog"
                         aria-modal="true" aria-label="Profile menu">
                        <button type="button" className="profile-modal-close" onClick={closeProfileModal}
                                aria-label="Close profile menu">
                            ×
                        </button>
                        <div className="profile-modal-avatar-wrap">
                            {hasProfilePhoto ? (
                                <img
                                    className="profile-modal-avatar"
                                    src={`data:;base64,${profilePhoto}`}
                                    alt="Profile"
                                />
                            ) : (
                                <span className="profile-modal-avatar-fallback">{profileInitial}</span>
                            )}
                        </div>
                        <div className="profile-modal-title">{profileName}</div>
                        <div className="profile-modal-actions">
                            <Logout onLoggedOut={closeProfileModal}/>
                        </div>
                    </div>
                </div>
            ) : null}
        </>
    );
};

export const Navigation = withRouter(NavigationComponent)
