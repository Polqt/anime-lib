import mongoose from 'mongoose'
import { Tweet } from '../models/tweet.model.js'
import { User } from '../models/user.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { apiResponse } from '../utils/apiResponse.js'
import { apiError } from '../utils/apiError.js'

const createTweet = asyncHandler(async (req, res) => {
    const { content } = req.body
    const userId = req.user?._id

    if (!content) {
        throw new apiError(400, 'Content is required')
    }

    try {
        const tweet = await Tweet.create({
            content,
            owner: userId,
        })

        if (!tweet) {
            throw new apiError(500, 'Failed to create a tweet')
        }

        return res.status(200).json(new apiResponse(200, tweet, 'Tweet created successfully'))

    } catch (error) {
        throw new apiError(500, 'Failed to create a tweet')
    }
})

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params

    if (!userId) {
        throw new apiError(400, 'User ID is required')
    }

    try {
        const tweets = await Tweet.find({ owner: userId })

        if (!tweets) {
            throw new apiError(404, 'No tweets found')
        }

        return res.status(200).json(new apiResponse(200, tweets, tweets.length ? 'Tweets found successfully' : 'No tweets found'))

    } catch (error) {
        throw new apiError(500, 'Failed to get tweets')
    }
})

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params
    const { content } = req.body

    if (!tweetId) {
        throw new apiError(400, 'Tweet ID is required')
    }

    try {
        const tweet = await Tweet.findById(tweetId)

        if (tweet.owner.toString() !== req.user?._id.toString()) {
            throw new apiError(403, 'You are not authorized to update this tweet')
        }

        const updateTweet = await Tweet.findByIdAndUpdate(
            tweetId,
            {
                $set: {
                    content: content.trim(),
                }
            },
            {
                new: true,
                runValidators: true
            }
        )

        if (!updateTweet) {
            throw new apiError(404, 'Tweet not found')
        }

        return res.status(200).json(new apiResponse(200, updateTweet, 'Tweet updated successfully'))

    } catch (error) {
        throw new apiError(500, 'Failed to update tweet')
    }
})

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!tweetId) {
        throw new apiError(400, 'Tweet ID is required')
    }

    try {

        const tweet = await Tweet.findById(tweetId)

        if (!tweet) {
            throw new apiError(404, 'Tweet not found')
        }

        if (tweet.owner.toString() !== req.user?._id.toString()) {
            throw new apiError(403, 'You are not authorized to delete this tweet')
        }

        const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

        return res.status(200).json(new apiResponse(200, deletedTweet, 'Tweet deleted successfully'))
    } catch (error) {
        throw new apiError(500, 'Failed to delete tweet')
    }
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}