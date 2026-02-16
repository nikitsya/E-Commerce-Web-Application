const path = require(`path`)

// Load values from .env using an absolute path so it works from any CWD
require(`dotenv`).config({path: path.join(__dirname, `config`, `.env`)})

require('./config/db')

// Create an Express app
const express = require(`express`)
const app = express()

// Parse JSON data sent from client (available in req.body)
app.use(require(`body-parser`).json())

// Allow requests from the client app URL
app.use(require(`cors`)({credentials: true, origin: process.env.LOCAL_HOST}))

// Use route
app.use(require(`./routes/products`))

// Start the server on the port from .env
app.listen(process.env.SERVER_PORT, () => {console.log(`Connected to port ` + process.env.SERVER_PORT)})

// If route is not found, create a 404 error
const createError = require('http-errors')
app.use((req, res, next) => {next(createError(404))})

// Handle all other errors here
app.use(function (err, req, res) {
    // Print the error message in the terminal
    console.error(err.message)

    // If there is no status code, use 500 (server error)
    if (!err.statusCode) {
        err.statusCode = 500
    }

    // Send status code and message back to the client
    res.status(err.statusCode).send(err.message)
})
