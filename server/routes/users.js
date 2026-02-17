const router = require(`express`).Router()
const createError = require('http-errors')
const usersModel = require(`../models/users`)
const bcrypt = require('bcryptjs')  // needed for password encryption

// The code below is for development testing purposes only 
router.post(`/users/reset_user_collection`, (req, res, next) => {
    usersModel.deleteMany({})
    .then(() => {
        const adminPassword = `123-qwe_QWE`

        bcrypt.hash(adminPassword, parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (error, hash) => {
            usersModel.create({name: "Administrator", email: "admin@admin.com", password: hash})
            .then(createData => res.json(createData))
            .catch(() => next(createError(500, `Failed to create Admin user for testing purposes`)))
        })
    })
    .catch(err => next(err))
})

// If a user with this email does not already exist, then create new user
router.post(`/users/register/:name/:email/:password`, (req, res, next) => {
    usersModel.findOne({email: req.params.email})
    .then(uniqueData => {
        if(uniqueData) {
            next(createError(403, `User already exists`))
        } else {
            bcrypt.hash(req.params.password, parseInt(process.env.PASSWORD_HASH_SALT_ROUNDS), (error, hash) => {
                usersModel.create({name: req.params.name, email: req.params.email, password: hash})
                .then(data => res.json({name: data.name}))
                .catch(() => next(createError(409, `User was not registered`)))
            })
        }
    })
    .catch(err => next(err))
})

router.post(`/users/login/:email/:password`, (req, res, next) => {
    usersModel.findOne({email: req.params.email})
    .then(data => {
        bcrypt.compare(req.params.password, data.password, (err, result) => {
            if(result) {
                res.json({name: data.name})
            } else {
                next(createError(403, `User is not logged in`))
            }
        })
    })
    .catch(() => next(createError(403, `User is not logged in`)))
})

router.post(`/users/logout`, (req, res) => {
    res.json({})
})

module.exports = router