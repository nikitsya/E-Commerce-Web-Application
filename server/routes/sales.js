const router = require(`express`).Router()
const createError = require(`http-errors`)
const fs = require(`fs`)
const jwt = require(`jsonwebtoken`)
const salesModel = require(`../models/sales`)

const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, `utf8`)

const createNewSaleDocument = (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: [`HS256`]}, (err, decodedToken) => {
        if (err || !decodedToken) {
            return next(createError(403, `User is not logged in`))
        }

        const total = Number(req.params.total)
        if (!Number.isFinite(total) || total < 0) {
            return next(createError(400, `Invalid total amount`))
        }

        const saleDetails = {
            orderID: req.params.orderID,
            total: total,
            items: Array.isArray(req.body.items) ? req.body.items : [],
            customerEmail: decodedToken.email || ``,
            customerName: decodedToken.name || ``
        }

        salesModel.create(saleDetails)
            .then(() => res.json({success: true}))
            .catch((createErr) => next(createErr))
    })
}

router.post(`/sales/:orderID/:total`, createNewSaleDocument)

module.exports = router
