const router = require(`express`).Router()
const createError = require('http-errors')
const usersModel = require(`../models/users`)
const bcrypt = require('bcryptjs')  // Password hashing/checking for stored credentials.

const fs = require('fs')
const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, 'utf8')
const jwt = require('jsonwebtoken')

// Development-only endpoint: clears users and recreates a known admin account.
router.post(`/users/reset_user_collection`, (req, res, next) => {
    // Remove all users first to guarantee deterministic reset behavior.
    usersModel.deleteMany({})
        .then(() => {
            const adminPassword = `123-qwe_QWE`

            // Hash admin password before storing it in DB.
            bcrypt.hash(adminPassword, parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (error, hash) => {
                if (error) {
                    return next(error)
                }
                // Recreate baseline administrator account with admin access level.
                usersModel.create({
                    name: "Administrator",
                    email: "admin@admin.com",
                    password: hash,
                    accessLevel: parseInt(process.env.ACCESS_LEVEL_ADMIN)
                })
                    .then(createData => res.json(createData))
                    .catch(() => next(createError(500, `Failed to create Admin user for testing purposes`)))
            })
        })
        .catch(err => next(err))
})

// Registers a customer account if email is not already present.
router.post(`/users/register/:name/:email/:password`, (req, res, next) => {
    // Enforce unique email identity at application level.
    usersModel.findOne({email: req.params.email})
        .then(uniqueData => {
            if (uniqueData) {
                next(createError(403, `User already exists`))
            } else {
                // Store only hashed passwords; never persist plaintext credentials.
                bcrypt.hash(req.params.password, parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (error, hash) => {
                    if (error) {
                        return next(error)
                    }

                    // New users are created with customer access level by default.
                    usersModel.create({
                        name: req.params.name,
                        email: req.params.email,
                        password: hash,
                        accessLevel: parseInt(process.env.ACCESS_LEVEL_CUSTOMER)
                    })
                        .then(data => {
                            // Issue JWT immediately after successful registration.
                            const token = jwt.sign({
                                email: data.email,
                                accessLevel: data.accessLevel
                            }, JWT_PRIVATE_KEY, {algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRY})
                            res.json({name: data.name, accessLevel: data.accessLevel, token: token})
                        })
                        .catch(() => next(createError(409, `User was not registered`)))
                })
            }
        })
        .catch(err => next(err))
})

// Authenticates existing user and returns JWT on successful password check.
router.post(`/users/login/:email/:password`, (req, res, next) => {
    usersModel.findOne({email: req.params.email})
        .then((data) => {
            // Intentionally return generic login failure message for unknown users.
            if (!data) {
                return res.json({errorMessage: `User is not logged in`})
            }

            // Compare provided password against stored bcrypt hash.
            bcrypt.compare(req.params.password, data.password, (err, result) => {
                if (err) {
                    return next(err)
                }

                if (result) {
                    // Signed token carries user identity and authorization level.
                    const token = jwt.sign({
                        email: data.email,
                        accessLevel: data.accessLevel
                    }, JWT_PRIVATE_KEY, {algorithm: 'HS256', expiresIn: process.env.JWT_EXPIRY})
                    res.json({name: data.name, accessLevel: data.accessLevel, token: token})
                } else {
                    res.json({errorMessage: `User is not logged in`})
                }
            })
        })
        .catch((err) => next(err))
})

// Stateless logout endpoint: client is expected to discard its JWT token.
router.post(`/users/logout`, (req, res, next) => {
    res.json({})
})

module.exports = router