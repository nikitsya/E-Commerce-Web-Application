const mongoose = require('mongoose')

const dbName = String(process.env.DB_NAME || "").trim()
const dbUserName = String(process.env.DB_USER_NAME || "").trim()
const dbUserPassword = String(process.env.DB_USER_PASSWORD || "").trim()
const dbClusterHost = String(process.env.DB_CLUSTER_HOST || "").trim()

if (!dbName) {
    throw new Error("DB_NAME is required.")
}
if (!dbUserName) {
    throw new Error("DB_USER_NAME is required.")
}
if (!dbUserPassword) {
    throw new Error("DB_USER_PASSWORD is required.")
}
if (!dbClusterHost) {
    throw new Error("DB_CLUSTER_HOST is required.")
}

const mongoUri = `mongodb+srv://${encodeURIComponent(dbUserName)}:${encodeURIComponent(dbUserPassword)}@${dbClusterHost}/${encodeURIComponent(dbName)}`

mongoose.connect(mongoUri)

const db = mongoose.connection
db.on('error', console.error.bind(console, 'connection error:'))
db.once('open', () => {
    console.log("connected to", db.client.s.url)
})
