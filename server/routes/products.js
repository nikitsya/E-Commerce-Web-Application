const mongoose = require(`mongoose`)

let productsSchema = new mongoose.Schema({
        _id: {type: Number},
        product: {type: String},
        price: {type: Number}
    }, {
        collection: `products`
    })

module.exports = mongoose.model(`products`, productsSchema)
