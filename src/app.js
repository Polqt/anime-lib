import express from 'express'
import cors from 'cors'
import healthCheckRouter from './routes/healthcheck.route.js'

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

// Routes
app.use('/api/v1/healthcheck', healthCheckRouter)

export { app }