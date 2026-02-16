const router = require(`express`).Router()
const productsModel = require(`../models/products`)

const migrateLegacyProductField = async () => {
    await productsModel.collection.updateMany(
        {product: {$exists: true}, name: {$exists: false}},
        {$rename: {product: `name`}}
    )
}

// One-time migration for old documents that still use `product`
migrateLegacyProductField().catch((err) => {
    console.error(`Migration product->name failed:`, err.message)
})

// Seed initial products once if the collection is empty
router.post(`/products/seed`, async (req, res, next) => {
    try {
        const count = await productsModel.countDocuments()
        if (count > 0) {
            return res.json({message: `Products already exist`, count})
        }

        const data = await productsModel.insertMany([
            {name: `Energy Efficient Kettle`, price: 49.99},
            {name: `Solar Powered Outdoor Light`, price: 79.50},
            {name: `Eco Washing Machine A+++`, price: 699.00},
            {name: `Smart Thermostat`, price: 199.99},
            {name: `Low Energy Air Fryer`, price: 129.95},
            {name: `Compost Bin (Kitchen)`, price: 34.99}
        ])

        res.json(data)
    } catch (err) {
        next(err)
    }
})

// Read all records
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
