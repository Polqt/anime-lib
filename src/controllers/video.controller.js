import mongoose from 'mongoose'
import { Video } from '../models/video.model.js'
import { User } from '../models/user.model.js'
import { apiResponse } from '../utils/apiResponse.js'
import { apiError } from '../utils/apiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { deleteFromCloudinary, uploadOnCloudinary } from '../utils/cloudinary.js'


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

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

        throw new apiError(500, 'Failed to create video')
    }
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.parans
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.parans
})

export {
    getAllVideos,
    uploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}