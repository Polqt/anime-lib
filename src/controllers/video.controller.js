import mongoose from 'mongoose'
import { Video } from '../models/video.model.js'
import { User } from '../models/user.model.js'
import { apiResponse } from '../utils/apiResponse.js'
import { apiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js'

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy = 'createdAt', sortType = 'desc', userId } = req.query

    const pageNumber = parseInt(page)
    const limitNumber = parseInt(limit)

    const filter = {
        ...(query && { owner: userId })
    }

    try {
        const videos = await Video.aggregate([
            {
                $match: filter
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'owner',
                    foreignField: '_id',
                    as: 'owner'
                },
            },
            {
                $unwind: {
                    path: '$owner',
                    preserveNullAndEmptyArrays: true
                }
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    description: 1,
                    thumbnail: 1,
                    videoFile: 1,
                    owner: {
                        _id: 1,
                        username: 1,
                        fullName: 1,
                    },
                    createdAt: 1,
                    updatedAt: 1,
                    isPublished: 1,
                    duration: 1,
                }
            },
        ])

        const totalVideos = await Video.countDocuments(filter)
        const totalPages = Math.ceil(totalVideos / limitNumber)

        return res
            .status(200)
            .json(new apiResponse(200, { videos, page: pageNumber, limit: limitNumber, totalPages, totalVideos }, 'Videos retrieved successfully'))
    } catch (error) {
        throw new apiError(500, 'Failed to retrieve videos')
    }
})

const uploadVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body

    console.log(title)
    console.log(description)

    if (!title || !description) {
        throw new apiError(400, 'Title and description are required')
    }

    const videoLocalPath = await req.files?.videoFile[0].path
    const thumbnailLocalPath = await req.files?.thumbnailFile[0].path

    let videoFile;
    try {
        videoFile = await uploadOnCloudinary(videoLocalPath)
    } catch (error) {
        throw new apiError(500, 'Failed to upload video')
    }

    let thumbnailFile;
    try {
        thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath)
    } catch (error) {
        throw new apiError(500, 'Failed to upload thumbnail')
    }

    try {
        const video = await Video.create({
            title: title.trim(),
            description: description.trim(),
            thumbnail: thumbnailFile.secure_url,
            videoFile: videoFile.secure_url,
            owner: req.user?._id
        })

        if (!video) {
            throw new apiError(500, 'Failed to create video')
        }

        return res
            .status(201)
            .json(new apiResponse(201, video, 'Video created successfully'))
    } catch (error) {

        if (videoFile) {
            await deleteFromCloudinary(videoFile.public_id)
        }

        if (thumbnailFile) {
            await deleteFromCloudinary(thumbnailFile.public_id)
        }

        throw new apiError(500, 'Failed to create video')
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim()) {
        throw new apiError(400, 'Video ID is required')
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(404, 'Video not found')
    }

    return res
        .status(200)
        .json(new apiResponse(200, video, 'Video retrieved successfully'))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { title, description } = req.body
    const thumbnailLocalPath = await req.file?.path

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(404, 'Video not found')
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (req.user?._id.toString() !== video.owner.toString()) {
        throw new apiError(403, 'You are not authorized to update this video')
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: title,
                description: description,
                thumbnail: thumbnail || video.thumbnail,
            }
        },
        { new: true }
    ).select('-videoFile')

    if (!updatedVideo) {
        throw new apiError(500, 'Failed to update video')
    }

    return res.status(200).json(new apiResponse(200, updatedVideo, 'Video updated successfully'))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId?.trim()) {
        throw new apiError(400, 'Video ID is required')
    }

    try {
        const deleteVideo = await Video.findByIdAndDelete(
            videoId,
            {
                $set: {
                    isDeleted: true
                }
            },
            { new: true }
        )

        if (!deleteVideo) {
            throw new apiError(404, 'Video not found')
        }

    } catch (error) {
        throw new apiError(500, 'Failed to delete video')
    }

    return res
        .status(200)
        .json(new apiResponse(200, {}, 'Video deleted successfully'))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    const video = await Video.findById(videoId)

    if (!video) {
        throw new apiError(404, 'Video not found')
    }

    if (req.user?._id.toString() !== video.owner.toString()) {
        throw new apiError(403, 'You are not authorized to update this video')
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: !video.isPublished
            }
        },
        { new: true }
    )

    if (!updatedVideo) {
        throw new apiError(500, 'Failed to update video')
    }

    return res.status(200).json(new apiResponse(200, updatedVideo, 'Video updated successfully'))
})

export {
    getAllVideos,
    uploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}