import React from "react"
import ReactDOM from "react-dom"
import {App} from "./App"


// Render <App /> into <div id="root"></div> from public/index.html
ReactDOM.render(<App/>, document.getElementById(`root`))

// After page load, try to register service worker for cache/offline support
window.addEventListener('load', () => {
    // Check if this browser supports service workers
    if ("serviceWorker" in navigator) {
        // serviceWorker.js is served from client/public/serviceWorker.js
        navigator.serviceWorker.register("/serviceWorker.js")
            .then(() => console.log("Service Worker Registered"))
            .catch(err => console.error("Service Worker Registration Failed", err))
    }
})