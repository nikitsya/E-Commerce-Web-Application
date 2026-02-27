const mongoose = require(`mongoose`)

let usersSchema = new mongoose.Schema(
    {
        name: {type: String, required: true, trim: true},
        email: {type: String, required: true, trim: true},
        password: {type: String, required: true, trim: true},
        accessLevel: {type: Number, required: true, default: 1}

    },
    {
        collection: `users`
    })

module.exports = mongoose.model(`users`, usersSchema)