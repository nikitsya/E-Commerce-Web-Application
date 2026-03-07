const mongoose = require(`mongoose`)

let salesSchema = new mongoose.Schema({
        orderID: {type: String, required: true, trim: true},
        total: {type: Number, required: true, min: 0},
        items: [{
            _id: {type: String, required: true},
            name: {type: String, required: true, trim: true},
            image: {type: String, trim: true, default: ``},
            price: {type: Number, required: true, min: 0},
            quantity: {type: Number, required: true, min: 1},
            isReturned: {type: Boolean, required: true, default: false},
            returnedAt: {type: Date, default: null}

        }],
        isGuest: {type: Boolean, required: true, default: false},
        customerName: {type: String, required: true, trim: true},
        customerEmail: {type: String, required: true, trim: true},
        customerAddress: {type: String, trim: true, default: ``},
        customerPhone: {type: String, trim: true, default: ``}
    },
    {
        collection: `sales`,
        timestamps: true
    })

module.exports = mongoose.model(`sales`, salesSchema)
