const mongoose = require(`mongoose`)

let productsSchema = new mongoose.Schema({
        product: {type: String, required: true, trim: true},
        price: {type: Number, required: true, min: 0}
    }, {
        collection: `products`
    })

module.exports = mongoose.model(`products`, productsSchema)
