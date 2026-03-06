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

// Protected endpoint: only admin users can update products.
router.put(`/products/:id`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            if (decodedToken.accessLevel >= process.env.ACCESS_LEVEL_ADMIN) {
                productsModel.findByIdAndUpdate(req.params.id, {$set: req.body}, {new: true, runValidators: true})
                    .then(data => {
                        res.json(data)
                    })
                    .catch((err) => next(err))
            } else {
                next(createError(403, `User is not an administrator, so they cannot update records`))
            }
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
