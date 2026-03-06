const mongoose = require(`mongoose`)
const router = require(`express`).Router()
const createError = require(`http-errors`)
const fs = require(`fs`)
const jwt = require(`jsonwebtoken`)
const salesModel = require(`../models/sales`)
const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, `utf8`)

// Normalizes basket payload and strips invalid entries before persistence.
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

// Accepts only finite non-negative totals from URL params.
const parseTotal = (totalParam) => {
    const total = Number(totalParam)
    if (!Number.isFinite(total) || total < 0) {
        return null
    }
    return total
}

const isEmailValid = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || ``).trim())
const isPhoneValid = (phone) => /^\d{7,15}$/.test(String(phone || ``).trim())
const escapeRegex = (value) => String(value || ``).replace(/[.*+?^${}()|[\]\\]/g, `\\$&`)

// Formats sale payload for admin history UI and strips any unexpected fields.
const formatSaleForAdmin = (sale) => ({
    _id: sale._id,
    orderID: String(sale.orderID || ``),
    total: Number(sale.total) || 0,
    isGuest: Boolean(sale.isGuest),
    customerName: String(sale.customerName || ``).trim(),
    customerEmail: String(sale.customerEmail || ``).trim(),
    customerAddress: String(sale.customerAddress || ``).trim(),
    customerPhone: String(sale.customerPhone || ``).trim(),
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    items: Array.isArray(sale.items)
        ? sale.items.map((item) => ({
            _id: String(item?._id || ``),
            name: String(item?.name || ``).trim(),
            price: Number(item?.price) || 0,
            quantity: Math.max(1, Number(item?.quantity) || 1),
            isReturned: Boolean(item?.isReturned),
            returnedAt: item?.returnedAt || null
        }))
        : []
})

// Formats sale payload for logged-in customer purchase history UI.
const formatSaleForCustomer = (sale) => ({
    _id: sale._id,
    orderID: String(sale.orderID || ``),
    total: Number(sale.total) || 0,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
    items: Array.isArray(sale.items)
        ? sale.items.map((item) => ({
            _id: String(item?._id || ``),
            name: String(item?.name || ``).trim(),
            price: Number(item?.price) || 0,
            quantity: Math.max(1, Number(item?.quantity) || 1),
            isReturned: Boolean(item?.isReturned),
            returnedAt: item?.returnedAt || null
        }))
        : []
})

// Middleware: validates MongoDB ObjectId params for sale/item return route.
const validateReturnRouteParams = (req, res, next) => {
    if (!mongoose.isValidObjectId(req.params.saleId)) {
        return next(createError(400, `Invalid sale id`))
    }

    if (!mongoose.isValidObjectId(req.params.itemId)) {
        return next(createError(400, `Invalid item id`))
    }

    next()
}

// Logged-in customer endpoint to view only their own purchase history.
router.get(`/sales/my-purchase-history`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: [`HS256`]}, (err, decodedToken) => {
        if (err || !decodedToken) {
            return next(createError(403, `User is not logged in`))
        }

        if (Number(decodedToken.accessLevel) <= Number(process.env.ACCESS_LEVEL_GUEST || 0)) {
            return next(createError(403, `Guest users cannot view purchase history`))
        }

        const customerEmail = String(decodedToken.email || ``).trim()
        if (!isEmailValid(customerEmail)) {
            return next(createError(400, `Invalid customer email`))
        }

        salesModel.find({
            customerEmail: {$regex: new RegExp(`^${escapeRegex(customerEmail)}$`, `i`)},
            isGuest: false
        })
            .sort({createdAt: -1, _id: -1})
            .then((sales) => res.json((Array.isArray(sales) ? sales : []).map(formatSaleForCustomer)))
            .catch((findErr) => next(findErr))
    })
})

// Logged-in customer returns one item from their own purchase history.
router.patch(`/sales/return-item/:saleId/:itemId`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: [`HS256`]}, (err, decodedToken) => {
        if (err || !decodedToken) {
            return next(createError(403, `User is not logged in`))
        }

        const customerEmail = String(decodedToken.email || ``).trim()
        if (!isEmailValid(customerEmail)) {
            return next(createError(400, `Invalid customer email`))
        }

        salesModel.findById(req.params.saleId)
            .then((sale) => {
                if (!sale) {
                    return next(createError(404, `Sale record not found`))
                }

                // Customer can return only their own non-guest purchases.
                if (sale.isGuest || String(sale.customerEmail || ``).toLowerCase() !== customerEmail.toLowerCase()) {
                    return next(createError(403, `You can only return items from your own purchases`))
                }

                const itemIndex = Array.isArray(sale.items)
                    ? sale.items.findIndex((item) => String(item._id) === String(req.params.itemId))
                    : -1

                if (itemIndex === -1) {
                    return next(createError(404, `Item not found in this sale`))
                }

                if (sale.items[itemIndex].isReturned) {
                    return next(createError(400, `Item has already been returned`))
                }

                sale.items[itemIndex].isReturned = true
                sale.items[itemIndex].returnedAt = new Date()

                sale.save()
                    .then((updatedSale) => res.json(formatSaleForCustomer(updatedSale)))
                    .catch((saveErr) => next(saveErr))
            })
            .catch((findErr) => next(findErr))
    })
})

// Admin endpoint to view customer purchase history (optionally by customerEmail query).
router.get(`/sales/customers/purchase-history`, (req, res, next) => {
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: [`HS256`]}, (err, decodedToken) => {
        if (err || !decodedToken) {
            return next(createError(403, `User is not logged in`))
        }

        if (Number(decodedToken.accessLevel) < Number(process.env.ACCESS_LEVEL_ADMIN)) {
            return next(createError(403, `User is not an administrator, so they cannot view purchase history`))
        }

        const customerEmail = String(req.query.customerEmail || ``).trim()
        const query = {}

        if (customerEmail) {
            query.customerEmail = {$regex: new RegExp(`^${escapeRegex(customerEmail)}$`, `i`)}
        }

        salesModel.find(query)
            .sort({createdAt: -1, _id: -1})
            .then((sales) => res.json((Array.isArray(sales) ? sales : []).map(formatSaleForAdmin)))
            .catch((findErr) => next(findErr))
    })
})

// Logged-in customer purchase (JWT required)
router.post(`/sales/:orderID/:total`, (req, res, next) => {
    // JWT is required to bind the sale to the authenticated account email.
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: [`HS256`]}, (err, decodedToken) => {
        if (err || !decodedToken) {
            return next(createError(403, `User is not logged in`))
        }

        // Prevents malformed totals from being stored in sales history.
        const total = parseTotal(req.params.total)
        if (total === null) {
            return next(createError(400, `Invalid total amount`))
        }

        // Reject empty or malformed carts early.
        const items = normalizeItems(req.body.items)
        if (items.length === 0) {
            return next(createError(400, `Sale must contain at least one item`))
        }

        // For registered checkout, email source is the JWT payload, not request body.
        const customerEmail = String(decodedToken.email || ``).trim()
        if (!isEmailValid(customerEmail)) {
            return next(createError(400, `Invalid customer email`))
        }

        // Store a unified sale record format for both registered and guest flows.
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

        // Persistence is the final step after all business validations pass.
        salesModel.create(saleDetails)
            .then(() => res.json({success: true}))
            .catch((createErr) => next(createErr))
    })
})

// Guest customer purchase (no JWT)
router.post(`/sales/guest/:orderID/:total`, (req, res, next) => {
    // Guest totals still use the same numeric validation as authenticated checkout.
    const total = parseTotal(req.params.total)
    if (total === null) {
        return next(createError(400, `Invalid total amount`))
    }

    // Enforce non-empty normalized basket before customer-field checks.
    const items = normalizeItems(req.body.items)
    if (items.length === 0) {
        return next(createError(400, `Sale must contain at least one item`))
    }

    const customerName = String(req.body.customerName || ``).trim()
    const customerEmail = String(req.body.customerEmail || ``).trim()
    const customerAddress = String(req.body.customerAddress || ``).trim()
    const customerPhone = String(req.body.customerPhone || ``).trim()

    // Guest checkout requires fully provided contact and delivery fields.
    if (!customerName) return next(createError(400, `Customer name is required`))
    if (!customerAddress) return next(createError(400, `Customer address is required`))
    if (!isPhoneValid(customerPhone)) return next(createError(400, `Customer phone is invalid`))
    if (!isEmailValid(customerEmail)) return next(createError(400, `Customer email is invalid`))

    // Keep DB schema consistent with registered flow by using matching field names.
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

    // Save guest order using the same collection for consolidated order history.
    salesModel.create(saleDetails)
        .then(() => res.json({success: true}))
        .catch((createErr) => next(createErr))
})

module.exports = router
