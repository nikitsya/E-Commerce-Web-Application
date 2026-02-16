const router = require(`express`).Router()
const productsModel = require(`../models/products`)

// Seed initial products once if the collection is empty
router.post(`/products/seed`, async (req, res, next) => {
    try {
        const count = await productsModel.countDocuments()
        if (count > 0) {
            return res.json({message: `Products already exist`, count})
        }

        const data = await productsModel.insertMany([
            {product: `Energy Efficient Kettle`, price: 49.99},
            {product: `Solar Powered Outdoor Light`, price: 79.50},
            {product: `Eco Washing Machine A+++`, price: 699.00},
            {product: `Smart Thermostat`, price: 199.99},
            {product: `Low Energy Air Fryer`, price: 129.95},
            {product: `Compost Bin (Kitchen)`, price: 34.99}
        ])

        res.json(data)
    } catch (err) {
        next(err)
    }
})

// read all records
router.get(`/products`, (req, res, next) => {
    productsModel.find()
        .then((data) => {
            res.json(data)
        })
        .catch((err) => next(err))
})

// Read one record
router.get(`/products/:id`, (req, res, next) => {
    productsModel.findById(req.params.id)
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
})

// Add new record
router.post(`/products`, (req, res, next) => {
    productsModel.create(req.body)
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
})

// Update one record
router.put(`/products/:id`, (req, res, next) => {
    productsModel.findByIdAndUpdate(req.params.id, {$set: req.body})
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
})

// Delete one record
router.delete(`/products/:id`, (req, res, next) => {
    productsModel.findByIdAndDelete(req.params.id)
        .then(data => {
            res.json(data)
        })
        .catch((err) => next(err))
})

module.exports = router
