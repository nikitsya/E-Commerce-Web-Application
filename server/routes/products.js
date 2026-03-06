const router = require(`express`).Router()
const createError = require('http-errors')
const productsModel = require(`../models/products`)
const fs = require('fs')
const jwt = require('jsonwebtoken')
const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, 'utf8')

// Middleware: verifies JWT and exposes decoded token for next handlers.
const verifyUsersJWTPassword = (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            req.decodedToken = decodedToken
            next()
        }
    })
}

// Middleware: allows only administrators to continue.
const checkThatUserIsAnAdministrator = (req, res, next) => {
    if (Number(req.decodedToken.accessLevel) >= Number(process.env.ACCESS_LEVEL_ADMIN)) {
        next()
    } else {
        next(createError(403, `User is not an administrator`))
    }
}

// Public endpoint: returns all products sorted by insertion order.
router.get(`/products`, (req, res, next) => {
    productsModel.find().sort({_id: 1})
        .then((data) => {
            res.json(data)
        })
        .catch((err) => next(err))
})

// Route handler: returns one product document by ID after auth middleware passes.
const getProductDocument = (req, res, next) => {
    productsModel.findById(req.params.id)
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
}

router.get(`/products/:id`, verifyUsersJWTPassword, getProductDocument)


// Route handler: creates a new product document. only admin users can create products.

const createNewProductDocument = (req, res, next) => {
    productsModel.create(req.body)
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
}

// Add new product (admin only).
router.post(`/products`, verifyUsersJWTPassword, checkThatUserIsAnAdministrator, createNewProductDocument)


// Route handler: updates one product document by ID. only admin users can update products.

const updateProductDocument = (req, res, next) => {
    productsModel.findByIdAndUpdate(req.params.id, {$set: req.body}, {new: true, runValidators: true})
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
}

// Update one product (admin only).
router.put(`/products/:id`, verifyUsersJWTPassword, checkThatUserIsAnAdministrator, updateProductDocument)


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
