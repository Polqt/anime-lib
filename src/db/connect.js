import mongoose from 'mongoose'
import { DB_NAME } from '../constant.js'

const connectionDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}${DB_NAME}`)

        console.log(`\nMongoDB connected: ${connectionInstance.connection.host}`) // Connection successful in the database
    } catch (error) {
        console.log(`MongoDB connection error: ${error}`)
        process.exit(1)
    }
}

export default connectionDB