const mongoose = require(`mongoose`)

let productsSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    price: {type: Number, required: true, min: 0},
    images: [{type: String, trim: true}],
    description: {type: String, trim: true, default: ``},
    capacityMl: {type: Number, min: 0},
    material: {type: String, trim: true, default: ``},
    color: {type: String, trim: true, default: ``},
    stockQty: { type: Number, required: true, min: 0, default: 0, validate: Number.isInteger },
    lowStockThreshold: { type: Number, required: true, min: 0, default: 5, validate: Number.isInteger }
}, {
    collection: `products`
})

module.exports = mongoose.model(`products`, productsSchema)
