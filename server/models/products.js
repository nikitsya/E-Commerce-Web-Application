const mongoose = require(`mongoose`)
const {
    buildTextField,
    buildNumberField,
    buildIntegerField,
    buildImagePathField
} = require(`./validators/common`)

let productsSchema = new mongoose.Schema({
    name: buildTextField({fieldLabel: `Product name`, required: true, minLength: 2, maxLength: 140, allowEmpty: false}),
    price: buildNumberField({fieldLabel: `Price`, required: true, min: 0, max: 1000000}),
    images: [buildImagePathField({fieldLabel: `Product image`})],
    description: buildTextField({fieldLabel: `Description`, maxLength: 2000}),
    capacityMl: buildIntegerField({fieldLabel: `Capacity (ml)`, required: false, min: 0, max: 100000}),
    material: buildTextField({fieldLabel: `Material`, maxLength: 80}),
    color: buildTextField({fieldLabel: `Color`, maxLength: 50}),
    stockQty: buildIntegerField({fieldLabel: `Stock quantity`, required: true, min: 0, max: 100000, defaultValue: 0}),
    lowStockThreshold: buildIntegerField({
        fieldLabel: `Low stock threshold`,
        required: true,
        min: 0,
        max: 100000,
        defaultValue: 5
    })
}, {
    collection: `products`
})

productsSchema.path(`images`).validate({
    validator: (images) => Array.isArray(images) && images.length > 0,
    message: `Product must include at least one image`
})

module.exports = mongoose.model(`products`, productsSchema)
