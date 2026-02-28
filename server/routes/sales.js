const router = require(`express`).Router()
const createError = require(`http-errors`)
const fs = require(`fs`)
const jwt = require(`jsonwebtoken`)
const salesModel = require(`../models/sales`)

const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, `utf8`)

const normalizeItems = (items) => {
    if (!Array.isArray(items)) return []
    return items
        .filter((item) => item && item._id)
        .map((item) => ({
            _id: String(item._id),
            name: String(item.name || ``).trim(),
            price: Number(item.price) || 0,
            quantity: Math.max(1, Number(item.quantity) || 1)
        }))
}

const parseTotal = (totalParam) => {
    const total = Number(totalParam)
    if (!Number.isFinite(total) || total < 0) {
        return null
    }
    return total
}

const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ``).trim())
const isPhoneValid = (phone) => /^\d{7,15}$/.test(String(phone || ``).trim())

// Logged-in customer purchase (JWT required)
router.post(`/sales/:orderID/:total`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: [`HS256`]}, (err, decodedToken) => {
        if (err || !decodedToken) {
            return next(createError(403, `User is not logged in`))
        }

        const total = parseTotal(req.params.total)
        if (total === null) {
            return next(createError(400, `Invalid total amount`))
        }

        const items = normalizeItems(req.body.items)
        if (items.length === 0) {
            return next(createError(400, `Sale must contain at least one item`))
        }

        const customerEmail = String(decodedToken.email || ``).trim()
        if (!isEmailValid(customerEmail)) {
            return next(createError(400, `Invalid customer email`))
        }

        const saleDetails = {
            orderID: String(req.params.orderID || ``).trim(),
            total,
            items,
            isGuest: false,
            customerName: String(req.body.customerName || `Registered Customer`).trim(),
            customerEmail,
            customerAddress: String(req.body.customerAddress || ``).trim(),
            customerPhone: String(req.body.customerPhone || ``).trim()
        }

        salesModel.create(saleDetails)
            .then(() => res.json({success: true}))
            .catch((createErr) => next(createErr))
    })
})

// Guest customer purchase (no JWT)
router.post(`/sales/guest/:orderID/:total`, (req, res, next) => {
    const total = parseTotal(req.params.total)
    if (total === null) {
        return next(createError(400, `Invalid total amount`))
    }

    const items = normalizeItems(req.body.items)
    if (items.length === 0) {
        return next(createError(400, `Sale must contain at least one item`))
    }

    const customerName = String(req.body.customerName || ``).trim()
    const customerEmail = String(req.body.customerEmail || ``).trim()
    const customerAddress = String(req.body.customerAddress || ``).trim()
    const customerPhone = String(req.body.customerPhone || ``).trim()

    if (!customerName) return next(createError(400, `Customer name is required`))
    if (!customerAddress) return next(createError(400, `Customer address is required`))
    if (!isPhoneValid(customerPhone)) return next(createError(400, `Customer phone is invalid`))
    if (!isEmailValid(customerEmail)) return next(createError(400, `Customer email is invalid`))

    const saleDetails = {
        orderID: String(req.params.orderID || ``).trim(),
        total,
        items,
        isGuest: true,
        customerName,
        customerEmail,
        customerAddress,
        customerPhone
    }

    salesModel.create(saleDetails)
        .then(() => res.json({success: true}))
        .catch((createErr) => next(createErr))
})

module.exports = router
