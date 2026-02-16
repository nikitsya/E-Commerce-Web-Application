const router = require(`express`).Router()
const productsModel = require(`../models/products`)

const migrateLegacyProductField = async () => {
    await productsModel.collection.updateMany(
        {product: {$exists: true}, name: {$exists: false}},
        {$rename: {product: `name`}}
    )
}

const migrateAdditionalProductFields = async () => {
    await productsModel.collection.updateMany(
        {images: {$exists: false}},
        {$set: {images: []}}
    )
    await productsModel.collection.updateMany(
        {description: {$exists: false}},
        {$set: {description: ``}}
    )
    await productsModel.collection.updateMany(
        {material: {$exists: false}},
        {$set: {material: ``}}
    )
    await productsModel.collection.updateMany(
        {color: {$exists: false}},
        {$set: {color: ``}}
    )
}

// One-time migration for old documents that still use `product`
migrateLegacyProductField().catch((err) => {
    console.error(`Migration product->name failed:`, err.message)
})

// One-time migration for additional product fields
migrateAdditionalProductFields().catch((err) => {
    console.error(`Migration additional product fields failed:`, err.message)
})

const seedProductsIfEmpty = async () => {
    const count = await productsModel.countDocuments()
    if (count > 0) {
        return {seeded: false, count}
    }

    const data = await productsModel.insertMany([
        {
            name: `Midnight Steel Bottle`,
            price: 29.99,
            images: [`/images/products/midnight-steel.jpg`],
            description: `Premium stainless steel reusable bottle with matte dark finish. Keeps drinks cold for up to 24 hours and hot for up to 12 hours.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Midnight Black`
        },
        {
            name: `Classic Steel Loop Bottle`,
            price: 24.99,
            images: [`/images/products/classic-steel-loop.jpg`],
            description: `Durable stainless steel bottle with practical silicone loop lid. Lightweight and leak-proof for everyday use.`,
            capacityMl: 600,
            material: `Steel`,
            color: `Silver`
        },
        {
            name: `Eco Steel Bottle – Green Loop`,
            price: 26.99,
            images: [`/images/products/steel-green-loop.jpg`],
            description: `Brushed steel bottle with eco-friendly silicone carry loop. Compact and sustainable hydration solution.`,
            capacityMl: 600,
            material: `Steel`,
            color: `Silver-Green`
        },
        {
            name: `Minimal White Bottle`,
            price: 27.99,
            images: [`/images/products/minimal-white.jpg`],
            description: `Sleek reusable bottle with soft white finish and double-wall insulation for long temperature retention.`,
            capacityMl: 500,
            material: `Steel`,
            color: `White`
        },
        {
            name: `Ocean Blue Travel Bottle`,
            price: 28.99,
            images: [`/images/products/ocean-blue.jpg`],
            description: `Deep blue insulated bottle designed for travel and outdoor activities. Durable and leak-proof.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Ocean Blue`
        },
        {
            name: `Soft White Outdoor Bottle`,
            price: 28.99,
            images: [`/images/products/soft-white-outdoor.jpg`],
            description: `Scratch-resistant matte white bottle built for hiking and adventure.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Soft White`
        },
        {
            name: `Coastal Steel Bottle`,
            price: 30.99,
            images: [`/images/products/coastal-steel.jpg`],
            description: `Premium double-wall stainless steel bottle inspired by coastal landscapes.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Brushed Silver`
        },
        {
            name: `Glass Tea Infuser Bottle`,
            price: 32.99,
            images: [`/images/products/glass-tea-infuser.jpg`],
            description: `Elegant glass bottle with built-in stainless steel tea infuser. Perfect for loose-leaf tea.`,
            capacityMl: 500,
            material: `Glass`,
            color: `Transparent`
        },
        {
            name: `Amber Glass Infuser Bottle`,
            price: 34.99,
            images: [`/images/products/amber-glass.jpg`],
            description: `Stylish amber-tinted glass bottle with removable infuser for tea and fruit drinks.`,
            capacityMl: 550,
            material: `Glass`,
            color: `Amber`
        },
        {
            name: `Forest Glass Bottle`,
            price: 23.99,
            images: [`/images/products/forest-glass.jpg`],
            description: `Clear double-wall glass bottle with stainless steel lid. Designed for eco-friendly daily use.`,
            capacityMl: 550,
            material: `Glass`,
            color: `Clear`
        },
        {
            name: `Deep Navy Bottle`,
            price: 29.99,
            images: [`/images/products/deep-navy.jpg`],
            description: `Insulated stainless steel bottle with smooth navy coating. Keeps drinks at ideal temperature for hours.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Navy`
        },
        {
            name: `Pure Blue Bottle`,
            price: 21.99,
            images: [`/images/products/pure-blue.jpg`],
            description: `Lightweight reusable bottle with soft-touch blue sleeve. Perfect for commuting.`,
            capacityMl: 500,
            material: `Glass`,
            color: `Light Blue`
        }
    ])

    return {seeded: true, count: data.length, data}
}

// Auto-seed on server start if the collection is empty
seedProductsIfEmpty()
    .then((result) => {
        if (result.seeded) {
            console.log(`Seeded products: ${result.count}`)
        }
    })
    .catch((err) => {
        console.error(`Automatic seed failed:`, err.message)
    })

// Manual seed endpoint
router.post(`/products/seed`, async (req, res, next) => {
    try {
        const result = await seedProductsIfEmpty()
        if (!result.seeded) {
            return res.json({message: `Products already exist`, count: result.count})
        }

        res.json(result.data)
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
