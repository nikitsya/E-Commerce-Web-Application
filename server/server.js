const path = require(`path`)

// Load values from .env using an absolute path so it works from any CWD
require(`dotenv`).config({path: path.join(__dirname, `config`, `.env`)})
require('./config/db')

// Create an Express app
const express = require(`express`)
const app = express()

// Serves uploaded files (profile photos and product images) from /uploads.
app.use(`/uploads`, express.static(path.resolve(__dirname, process.env.UPLOADED_FILES_FOLDER)))

// Parse JSON data sent from client (available in req.body)
app.use(require(`body-parser`).json())

// Allow requests from the client app URL
app.use(require(`cors`)({credentials: true, origin: process.env.LOCAL_HOST}))

// Use route
app.use(require(`./routes/products`))
app.use(require(`./routes/users`))
app.use(require(`./routes/sales`))

// Start the server on the port from .env
app.listen(process.env.SERVER_PORT, () => {
    console.log(`Connected to port ` + process.env.SERVER_PORT)
})

// If route is not found, create a 404 error
const createError = require('http-errors')
app.use((req, res, next) => {
    next(createError(404, `Route not found`))
})

// Handle all other errors here
app.use(function (err, req, res, next) {
    if (res.headersSent) {
        return next(err)
    }

    // Print the error message in the terminal
    console.error(err.message)

    // Normalize status/message so every route returns a predictable error payload.
    const statusCode = Number(err.statusCode || err.status || 500)
    const message = String(err.message || `Internal Server Error`)

    // Send status code and message back to the client
    res.status(statusCode).send(message)
})
