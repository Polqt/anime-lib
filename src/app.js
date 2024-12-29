import express from 'express'
import cors from 'cors'
import healthCheckRouter from './routes/healthcheck.route.js'
import userRouter from './routes/user.route.js'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/error.middleware.js'

const app = express()

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
    optionsSuccessStatus: 200
}))

// Middleware
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(express.static('public'))
app.use(cookieParser())

// Routes
app.use('/api/v1/healthcheck', healthCheckRouter)
app.use('/api/v1/user', userRouter)

app.use(errorHandler)

export { app }