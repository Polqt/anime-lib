import { Router } from 'express'
import {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
} from '../controllers/subscription.controller.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.use(verifyJWT)

router
    .route('/channel/:channelId')
    .post(toggleSubscription)
    .get(getUserChannelSubscribers)

router.route('/subscriber/:subscriberId').get(getSubscribedChannels)

export default router