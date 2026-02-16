const mongoose = require('mongoose')
const dbName = process.env.DB_NAME

if (!dbName) {
    throw new Error(`DB_NAME is missing. Check server/config/.env`)
}

mongoose.connect(`mongodb://localhost:27017/${dbName}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {console.log("connected to", db.client.s.url)})
