import mongoose from 'mongoose'
import { Comment } from '../models/comment.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { apiResponse } from '../utils/apiResponse.js'
import { apiError } from '../utils/apiError.js'

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    try {
        const comments = await Comment.find({ video: videoId })
            .populate('owner', 'username')
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()

        if (!comments?.length) {
            throw new apiError(404, 'No comments found')
        }

        const totalComments = await Comment.countDocuments({ video: videoId })

        const results = {
            comments,
            page: parseInt(page),
            limit: parseInt(limit),
            total: totalComments
        }

        return res.status(200).json(new apiResponse(200, results, 'Comments fetched successfully'))
    } catch (error) {
        throw new apiError(400, 'Failed to fetch comments' || error?.message)
    }
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { content } = req.body
    const { userId } = req.user?._id

    try {
        const comment = await Comment.create({
            content,
            video: videoId,
            owner: userId
        })

        const populatedComment = await comment.populate('owner', 'username')

        return res.status(201).json(new apiResponse(201, populatedComment, 'Comment added successfully'))

    } catch (error) {
        throw new apiError(400, 'Failed to add comment' || error?.message)
    }
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params
    const { content } = req.body

    try {
        const comment = await Comment.findById(commentId)

        if (!comment) {
            throw new apiError(404, 'Comment not found')
        }

        if (comment.owner.toString() !== req.user?._id.toString()) {
            throw new apiError(403, 'You are not allowed to update this comment')
        }

        const updatedComment = await Comment.findByIdAndUpdate(
            commentId,
            {
                $set: {
                    content: content.trim(),
                }
            },
            { 
                new: true,
                runValidators: true 
            }
        ).populate('owner', 'username')

        return res.status(200).json(new apiResponse(200, updatedComment, 'Comment updated successfully'))
    } catch (error) {
        throw new apiError(400, 'Failed to update comment' || error?.message)
    }
})

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params

    try {
        const comment = await Comment.findById(commentId)

        if (!comment) {
            throw new apiError(404, 'Comment not found')
        }

        if (comment.owner.toString() !== req.user?._id.toString()) {
            throw new apiError(403, 'You are not allowed to delete this comment')
        }

        const deletedComment = await Comment.findByIdAndDelete(commentId)

        return res.status(200).json(new apiResponse(200, deletedComment, 'Comment deleted successfully'))
    } catch (error) {
        throw new apiError(400, 'Failed to delete comment' || error?.message)
    }
})

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}