const mongoose = require(`mongoose`)
const {buildEmailField} = require(`./validators/email`)

let usersSchema = new mongoose.Schema({
    name: {type: String, required: true, trim: true},
    email: buildEmailField({fieldLabel: `Email`, unique: true}),
    password: {type: String, required: true, trim: true},
    profilePhotoFilename: {type: String, default: ``},
    phone: {type: String, trim: true, default: ``},
    address: {type: String, trim: true, default: ``},
    accessLevel: {type: Number, required: true, default: 1}
}, {
    collection: `users`
})

module.exports = mongoose.model(`users`, usersSchema)
