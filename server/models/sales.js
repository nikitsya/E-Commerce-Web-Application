const mongoose = require(`mongoose`)

let salesSchema = new mongoose.Schema(
   {
         orderID: {type: String, required: true, trim: true},
        total: {type: Number, required: true, min: 0},
        items: [{
            _id: {type: String, required: true},
            name: {type: String, required: true},
            price: {type: Number, required: true, min: 0},
            quantity: {type: Number, required: true, min: 1}
        }],
        customerName: {type: String,required:true},
        customerEmail: {type: String,required:true}
   },
   {
       collection: `sales`
   })

module.exports = mongoose.model(`sales`, salesSchema)