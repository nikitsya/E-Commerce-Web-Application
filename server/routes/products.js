const router = require(`express`).Router()
const createError = require('http-errors')
const productsModel = require(`../models/products`)
const fs = require('fs')
const jwt = require('jsonwebtoken')

const JWT_PRIVATE_KEY = fs.readFileSync(process.env.JWT_PRIVATE_KEY_FILENAME, 'utf8')

// Renames legacy `product` field to `name` for backward compatibility.
// This keeps old documents readable by the current API without manual DB scripts.
const migrateLegacyProductField = async () => {
    await productsModel.collection.updateMany(
        {product: {$exists: true}, name: {$exists: false}},
        {$rename: {product: `name`}}
    )
}

// Ensures newly introduced optional product fields always exist.
// Existing documents get default values so frontend rendering stays predictable.
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

// Ordered fallback image mapping for existing rows that were created without `images`.
const productImageByRow = [
    {
        name: `Midnight Steel Bottle`,
        image: `/images/products/bluewater-sweden-5hVQO80IX2c-unsplash.jpg`
    },
    {
        name: `Classic Steel Loop Bottle`,
        image: `/images/products/bluewater-sweden-262JN9gquco-unsplash.jpg`
    },
    {
        name: `Eco Steel Bottle – Green Loop`,
        image: `/images/products/bluewater-sweden-J-7q5DZLiYY-unsplash.jpg`
    },
    {
        name: `Minimal White Bottle`,
        image: `/images/products/bluewater-sweden-jVQUpOJfuKM-unsplash.jpg`
    },
    {
        name: `Ocean Blue Travel Bottle`,
        image: `/images/products/bluewater-sweden-KaYO8M107_Q-unsplash.jpg`
    },
    {
        name: `Soft White Outdoor Bottle`,
        image: `/images/products/bluewater-sweden-mufygNHZ2FA-unsplash.jpg`
    },
    {
        name: `Coastal Steel Bottle`,
        image: `/images/products/bluewater-sweden-nyNJTrPAXKw-unsplash.jpg`
    },
    {
        name: `Glass Tea Infuser Bottle`,
        image: `/images/products/bluewater-sweden-p2lQtAPvTtQ-unsplash.jpg`
    },
    {
        name: `Amber Glass Infuser Bottle`,
        image: `/images/products/bluewater-sweden-p6XsdEowMUE-unsplash.jpg`
    },
    {
        name: `Forest Glass Bottle`,
        image: `/images/products/bluewater-sweden-Y7arHAsA4_k-unsplash.jpg`
    },
    {
        name: `Deep Navy Bottle`,
        image: `/images/products/bluewater-sweden-zAi_Cu0oC_Y-unsplash.jpg`
    },
    {
        name: `Pure Blue Bottle`,
        image: `/images/products/bluewater-sweden-znGHaNGztB0-unsplash.jpg`
    },
    {
        name: `Sky Sport Bottle`,
        image: `/images/products/claudio-schwarz-MF5T5F9GhmY-unsplash.jpg`
    },
    {
        name: `Smart Filter Bottle`,
        image: `/images/products/marek-mucha-41GWWsgUIoo-unsplash.jpg`
    },
    {
        name: `Mint Duo Bottle Set`,
        image: `/images/products/quokkabottles-J62aicWwNhg-unsplash.jpg`
    },
    {
        name: `Ocean Stone Bottle`,
        image: `/images/products/quokkabottles-Jl3YZSHYKzc-unsplash.jpg`
    }
]

// Assigns a default image per product name when images are missing.
const migrateProductImagesByRow = async () => {
    for (const item of productImageByRow) {
        await productsModel.updateMany(
            {name: item.name},
            {$set: {images: [item.image]}}
        )
    }
}

// One-time migration for old documents that still use `product`
migrateLegacyProductField().catch((err) => {
    console.error(`Migration product->name failed:`, err.message)
})

// One-time migration for additional product fields
migrateAdditionalProductFields().catch((err) => {
    console.error(`Migration additional product fields failed:`, err.message)
})

// Keep image mapping aligned with row order
migrateProductImagesByRow().catch((err) => {
    console.error(`Migration product images by row failed:`, err.message)
})

// Inserts demo catalog only when collection is empty.
// Returns metadata so callers can log or respond differently for seeded/non-seeded cases.
const seedProductsIfEmpty = async () => {
    const count = await productsModel.countDocuments()
    if (count > 0) {
        return {seeded: false, count}
    }

    const data = await productsModel.insertMany([
        {
            name: `Midnight Steel Bottle`,
            price: 29.99,
            images: [`/images/products/bluewater-sweden-262JN9gquco-unsplash.jpg`],
            description: `Premium stainless steel reusable bottle with matte dark finish. Keeps drinks cold for up to 24 hours and hot for up to 12 hours.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Silver`
        },
        {
            name: `Classic Steel Loop Bottle`,
            price: 24.99,
            images: [`/images/products/bluewater-sweden-5hVQO80IX2c-unsplash.jpg`],
            description: `Durable stainless steel bottle with practical silicone loop lid. Lightweight and leak-proof for everyday use.`,
            capacityMl: 600,
            material: `Steel`,
            color: `Black`
        },
        {
            name: `Eco Steel Bottle – Green Loop`,
            price: 26.99,
            images: [`/images/products/bluewater-sweden-J-7q5DZLiYY-unsplash.jpg`],
            description: `Brushed steel bottle with eco-friendly silicone carry loop. Compact and sustainable hydration solution.`,
            capacityMl: 600,
            material: `Steel`,
            color: `Silver`
        },
        {
            name: `Minimal White Bottle`,
            price: 27.99,
            images: [`/images/products/bluewater-sweden-KaYO8M107_Q-unsplash.jpg`],
            description: `Sleek reusable bottle with soft white finish and double-wall insulation for long temperature retention.`,
            capacityMl: 500,
            material: `Plastic`,
            color: `White`
        },
        {
            name: `Ocean Blue Travel Bottle`,
            price: 28.99,
            images: [`/images/products/bluewater-sweden-Y7arHAsA4_k-unsplash.jpg`],
            description: `Deep blue insulated bottle designed for travel and outdoor activities. Durable and leak-proof.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Blue`
        },
        {
            name: `Soft White Outdoor Bottle`,
            price: 28.99,
            images: [`/images/products/bluewater-sweden-jVQUpOJfuKM-unsplash.jpg`],
            description: `Scratch-resistant matte white bottle built for hiking and adventure.`,
            capacityMl: 750,
            material: `Steel`,
            color: `White`
        },
        {
            name: `Coastal Steel Bottle`,
            price: 30.99,
            images: [`/images/products/bluewater-sweden-mufygNHZ2FA-unsplash.jpg`],
            description: `Premium double-wall stainless steel bottle inspired by coastal landscapes.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Transparent`
        },
        {
            name: `Glass Tea Infuser Bottle`,
            price: 32.99,
            images: [`/images/products/bluewater-sweden-nyNJTrPAXKw-unsplash.jpg`],
            description: `Elegant glass bottle with built-in stainless steel tea infuser. Perfect for loose-leaf tea.`,
            capacityMl: 500,
            material: `Glass`,
            color: `Transparent`
        },
        {
            name: `Amber Glass Infuser Bottle`,
            price: 34.99,
            images: [`/images/products/bluewater-sweden-p2lQtAPvTtQ-unsplash.jpg`],
            description: `Stylish amber-tinted glass bottle with removable infuser for tea and fruit drinks.`,
            capacityMl: 550,
            material: `Steel`,
            color: `Silver`
        },
        {
            name: `Forest Glass Bottle`,
            price: 23.99,
            images: [`/images/products/bluewater-sweden-p6XsdEowMUE-unsplash.jpg`],
            description: `Clear double-wall glass bottle with stainless steel lid. Designed for eco-friendly daily use.`,
            capacityMl: 550,
            material: `Glass`,
            color: `White`
        },
        {
            name: `Deep Navy Bottle`,
            price: 29.99,
            images: [`/images/products/bluewater-sweden-zAi_Cu0oC_Y-unsplash.jpg`],
            description: `Insulated stainless steel bottle with smooth navy coating. Keeps drinks at ideal temperature for hours.`,
            capacityMl: 750,
            material: `Steel`,
            color: `Silver`
        },
        {
            name: `Pure Blue Bottle`,
            price: 21.99,
            images: [`/images/products/bluewater-sweden-znGHaNGztB0-unsplash.jpg`],
            description: `Lightweight reusable bottle with soft-touch blue sleeve. Perfect for commuting.`,
            capacityMl: 500,
            material: `Steel`,
            color: `Blue`
        },
        {
            name: `Sky Sport Bottle`,
            price: 22.99,
            images: [`/images/products/sky-sport.jpg`],
            description: `Minimalist reusable bottle with protective silicone sleeve and sport-style cap. Lightweight and easy to carry.`,
            capacityMl: 600,
            material: `Plastic + Silicone`,
            color: `Blue`
        },
        {
            name: `Smart Filter Bottle`,
            price: 39.99,
            images: [`/images/products/smart-filter.jpg`],
            description: `Modern bottle with built-in filtration system and sleek black finish. Designed for clean and safe hydration.`,
            capacityMl: 500,
            material: `Glass + Stainless Steel`,
            color: `Black`
        },
        {
            name: `Mint Duo Bottle Set`,
            price: 49.99,
            images: [`/images/products/mint-duo-set.jpg`],
            description: `Set of 2 reusable mint bottles: one tumbler with stainless steel straw and one bamboo cap bottle. Stylish, eco-friendly and perfect for daily use.`,
            capacityMl: 700,
            material: `Glass + Silicone + Bamboo`,
            color: `Mint`
        },
        {
            name: `Ocean Stone Bottle`,
            price: 31.99,
            images: [`/images/products/ocean-stone.jpg`],
            description: `Premium reusable bottle with unique ocean-inspired stone texture design. Durable and eye-catching.`,
            capacityMl: 650,
            material: `Plastic`,
            color: `Blue`
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

// Manual seed endpoint for development/testing environments.
// Safe to call multiple times because seeding is guarded by countDocuments().
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
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
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
    jwt.verify(req.headers.authorization, JWT_PRIVATE_KEY, {algorithms: ["HS256"]}, (err, decodedToken) => {
        if (err) {
            next(createError(403, `User is not logged in`))
        } else {
            productsModel.findByIdAndUpdate(req.params.id, {$set: req.body})
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
