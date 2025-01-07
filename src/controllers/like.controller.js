import mongoose from 'mongoose'
import { apiResponse } from '../utils/apiResponse.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { Like } from '../models/like.model.js'
import { apiError } from '../utils/apiError.js'


const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new apiError(400, 'Video ID is required')
    }

    try {
        const like = await Like.findOne({ video: videoId, likedBy: req.user?._id });

        let message;
        let updatedLike = null;

        if (like) {
            await Like.deleteOne({ _id: like._id })
            message = 'Like removed'
            updatedLike = null
        } else {
            updatedLike = await Like.create({ video: videoId, likedBy: req.user?._id })
            message = 'Like added'
        }

        return res.status(200).json(new apiResponse(200, updatedLike, message))
        
    } catch (error) {
        throw new apiError(500, 'Internal server error')
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    if (!commentId) {
        throw new apiError(400, 'Comment ID is required')
    }

    try {
        const like = await Like.findOne({ comment: commentId, likedBy: req.user?._id})

        let message;
        let updatedLike = null;

        if (like) {
            await Like.deleteOne({ _id: like._id })
            message = 'Like removed'
            updatedLike = null
        } else {
            updatedLike = await Like.create({ comment: commentId, likedBy: req.user?._id })
            message = 'Like added'
        }

        return res.status(200).json(new apiResponse(200, updatedLike, message))
    } catch (error) {
        throw new apiError(500, 'Internal server error' || error?.message)
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params

    if (!tweetId) {
        throw new apiError(400, 'Tweet ID is required')
    }

    try {
        const like = await Like.findOne({ tweet: tweetId, likedBy: req.user?._id })

        let message;
        let updatedLike = null;

        if (like) {
            await Like.deleteOne({ _id: like._id })
            message = 'Like removed'
            updatedLike = null
        } else {
            updatedLike = await Like.create({ tweet: tweetId, likedBy: req.user?._id })
            message = 'Like added'
        }

        return res.status(200).json(new apiResponse(200, updatedLike, message))
    } catch (error) {
        throw new apiError(500, 'Internal server error' || error?.message)
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    try {
        const likedVideos = await Like.find({ likedBy: req.user?._id }).populate('video').populated('likedBy', 'username')

        if (!likedVideos?.length) {
            return res.status(200).json(new apiResponse(200, [], 'No liked videos found'))
        }

        const validLikedVideos = likedVideos.filter(like => like.video !== null)

        return res.status(200).json(new apiResponse(200, validLikedVideos, 'Liked videos retrieved'))
    } catch (error) {
        throw new apiError(500, error?.message || 'Internal server error')
    }
})

export {
    toggleVideoLike,
    toggleCommentLike,
    toggleTweetLike,
    getLikedVideos
}