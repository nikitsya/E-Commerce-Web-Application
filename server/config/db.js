const mongoose = require('mongoose')

const mongoUri = String(process.env.MONGODB_URI || "").trim()
if (!mongoUri) {
    throw new Error("MONGODB_URI is required.")
}
if (!mongoUri.startsWith("mongodb+srv://")) {
    throw new Error("MONGODB_URI must be an Atlas mongodb+srv URI.")
}

mongoose.connect(mongoUri)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("connected to", db.client.s.url)
})
