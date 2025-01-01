import mongoose from 'mongoose'
import { Subscription } from '../models/subscription.model.js'
import { User } from '../models/user.model.js'
import { apiResponse } from '../utils/apiResponse.js'
import { apiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'


const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}