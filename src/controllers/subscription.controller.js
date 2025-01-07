import mongoose from 'mongoose'
import { Subscription } from '../models/subscription.model.js'
import { User } from '../models/user.model.js'
import { apiResponse } from '../utils/apiResponse.js'
import { apiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    try {
        const user = await User.findById(channelId) 

        if (!user) {
            throw new apiError(404, 'Channel not found')
        }

        const subscription = await Subscription.findOne({ channel: channelId, subscriber: req.user?._id })

        let message;
        let updatedSubscription = null

        if (subscription) {
            await Subscription.deleteOne({ _id: subscription._id })
            message = 'Unsubscribed successfully'
            updatedSubscription = null
        } else {
            updatedSubscription = await Subscription.create({ channel: channelId, subscriber: req.user?._id });
            message = 'Subscribed successfully'
        }

        return res.status(200).json(new apiResponse(200, { updatedSubscription }, message))
    } catch (error) {
        throw new apiError(400, 'Failed to toggle subscription' || error?.message);
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params

    try {
        const user = await User.findById(channelId)

        if (!user) {
            throw new apiError(404, 'User not found')
        }

        const subscribers = await Subscription.find({ user: channelId })

        return res.status(200).json(new apiResponse(200, { subscribers }, 'User channel subscribers retrieved successfully'))
    } catch (error) {
        throw new apiError(400, 'Failed to get user channel subscribers')
    }
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params

    try {
        const user = await User.findById(subscriberId)

        if (!user) {
            throw new apiError(404, 'User not found')
        }

        const subscriptions = await Subscription.find({ subscriber: subscriberId })

        return res.status(200).json(new apiResponse(200, { subscriptions }, 'Subscribed channels retrieved successfully'))
    } catch (error) {
        throw new apiError(400, 'Failed to get subscribed channels')
    }
})


export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}