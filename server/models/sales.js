const mongoose = require(`mongoose`)
const {buildEmailField} = require(`./validators/email`)
const {
    buildTextField,
    buildPhoneField,
    buildNumberField,
    buildIntegerField,
    buildOrderIdField,
    buildObjectIdStringField,
    buildImagePathField,
    normalizeText,
    getPhoneValidationError
} = require(`./validators/common`)

let salesSchema = new mongoose.Schema({
        orderID: buildOrderIdField(),
        total: buildNumberField({fieldLabel: `Total`, required: true, min: 0, max: 1000000}),
        items: [{
            _id: buildObjectIdStringField({fieldLabel: `Product ID`}),
            name: buildTextField({
                fieldLabel: `Item name`,
                required: true,
                minLength: 2,
                maxLength: 140,
                allowEmpty: false
            }),
            image: buildImagePathField({fieldLabel: `Item image`}),
            price: buildNumberField({fieldLabel: `Item price`, required: true, min: 0, max: 1000000}),
            quantity: buildIntegerField({fieldLabel: `Item quantity`, required: true, min: 1, max: 10000}),
            isReturned: {type: Boolean, required: true, default: false},
            returnedAt: {
                type: Date,
                default: null,
                validate: {
                    validator: function validateReturnedAt(value) {
                        if (value === null || value === undefined) {
                            return this.isReturned !== true
                        }
                        return value instanceof Date && !Number.isNaN(value.getTime())
                    },
                    message: `returnedAt must be a valid date when item is marked as returned`
                }
            }

        }],
        isGuest: {type: Boolean, required: true, default: false},
        customerName: buildTextField({
            fieldLabel: `Customer name`,
            required: true,
            minLength: 2,
            maxLength: 80,
            allowEmpty: false
        }),
        customerEmail: buildEmailField({fieldLabel: `Customer email`}),
        customerAddress: buildTextField({fieldLabel: `Customer address`, maxLength: 180}),
        customerPhone: buildPhoneField({fieldLabel: `Customer phone`})
    },
    {
        collection: `sales`,
        timestamps: true
    })

salesSchema.path(`items`).validate({
    validator: (items) => Array.isArray(items) && items.length > 0,
    message: `Items must contain at least one product`
})

salesSchema.path(`customerAddress`).validate({
    validator: function validateCustomerAddress(address) {
        if (!this.isGuest) return true
        return Boolean(normalizeText(address))
    },
    message: `Customer address is required for guest checkout`
})

salesSchema.path(`customerPhone`).validate({
    validator: function validateCustomerPhone(phone) {
        if (!this.isGuest) return true
        const normalized = normalizeText(phone)
        return Boolean(normalized) && !getPhoneValidationError(normalized, `Customer phone`)
    },
    message: `Customer phone is required and must contain 7-15 digits for guest checkout`
})

module.exports = mongoose.model(`sales`, salesSchema)
