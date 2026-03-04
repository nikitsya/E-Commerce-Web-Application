const router = require(`express`).Router()
const createError = require('http-errors')
const productsModel = require(`../models/products`)
const fs = require('fs')
const jwt = require('jsonwebtoken')

const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, 'utf8')

// Public endpoint: returns all products sorted by insertion order.
router.get(`/products`, (req, res, next) => {
    productsModel.find().sort({_id: 1})
        .then((data) => {
            res.json(data)
        })
        .catch((err) => next(err))
})

// Protected endpoint: requires valid JWT to fetch a single product.
router.get(`/products/:id`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            // Returns null when ID is valid format but document does not exist.
            productsModel.findById(req.params.id)
                .then(data => {
                    res.json(data)
                })
                .catch((err) => next(err))
        }
    })
})

// Protected endpoint: only admin users can create products.
router.post(`/products`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            // accessLevel is compared against configured admin threshold.
            if (decodedToken.accessLevel >= process.env.ACCESS_LEVEL_ADMIN) {
                productsModel.create(req.body)
                    .then(data => {
                        res.json(data)
                    })
                    .catch((err) => next(err))
            } else {
                next(createError(403, `User is not an administrator, so they cannot delete records`))
            }
        }
    })
})

// Protected endpoint: any authenticated user can update a product in current logic.
// Note: unlike POST/DELETE, this route does not enforce admin-level authorization.
router.put(`/products/:id`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            productsModel.findByIdAndUpdate(req.params.id, {$set: req.body}, {new: true, runValidators: true})
                .then(data => {
                    res.json(data)
                })
                .catch((err) => next(err))
        }
    })
})

// Protected endpoint: only admin users can delete products.
router.delete(`/products/:id`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            if (decodedToken.accessLevel >= process.env.ACCESS_LEVEL_ADMIN) {
                productsModel.findByIdAndDelete(req.params.id)
                    .then(data => {
                        res.json(data)
                    })
                    .catch((err) => next(err))
            } else {
                next(createError(403, `User is not an administrator, so they cannot delete records`))
            }
        }
    })
})

module.exports = router
