import 'dotenv/config'
import { app } from './app.js'
import connectionDB from './db/connect.js'

// console.log(process.env)
const port = process.env.PORT || 3001


connectionDB()
.then(() => {
    app.listen(port, () => {
        console.log(`Server listening on port ${port}.`)
    })
})
.catch((error) => {
    console.log(`Server error: ${error}`)
})