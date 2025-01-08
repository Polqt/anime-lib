import express from 'express'
import cors from 'cors'
import healthCheckRouter from './routes/healthcheck.route.js'
import cookieParser from 'cookie-parser'
import { errorHandler } from './middlewares/error.middleware.js'
import userRouter from './routes/user.route.js'
import videoRouter from './routes/video.route.js'
import subscriptionRouter from './routes/subscription.route.js'
import tweetRouter from './routes/tweet.route.js'
import likeRouter from './routes/like.route.js'
import commentRouter from './routes/comment.route.js'

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
app.use('/api/v1/video', videoRouter)
app.use('/api/v1/subscription', subscriptionRouter)
app.use('/api/v1/tweet', tweetRouter)
app.use('/api/v1/like', likeRouter)
app.use('/api/v1/comment', commentRouter)

app.use(errorHandler)

export { app }