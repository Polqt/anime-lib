import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)

        if (!user) {
            throw new apiError(404, 'User not found')
        }

        const accessToken = await user.generateAccessToken()
        const refreshToken = await user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({ validateBeforeSave: false })

        return { accessToken, refreshToken }
    } catch (error) {
        throw new apiError(500, 'Something went wrong while generating access and refresh tokens')
    }
}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, 'All fields are required')
    }

    const existedUser = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (existedUser) {
        throw new apiError(409, `User with email or username already exists`)
    }

    console.warn(req.files)
    const avatarLocalPath = await req.files?.avatar?.[0]?.path
    const coverLocalPath = await req.files?.coverImage?.[0]?.path

    if (!avatarLocalPath) {
        throw new apiError(400, 'Avatar file is missing')
    }

    // const avatar = await uploadOnCloudinary(avatarLocalPath)
    // let coverImage = ""
    // if (coverLocalPath) {
    //     coverImage = await uploadOnCloudinary(coverImage)
    // }

    let avatar;
    try {
        avatar = await uploadOnCloudinary(avatarLocalPath)
        console.log(`Uploaded avatar: ${avatar}`)
    } catch (error) {
        console.log(`Error uploading avatar: ${error.message}`)
        throw new apiError(500, 'Avatar upload failed')
    }

    let coverImage;
    try {
        coverImage = await uploadOnCloudinary(coverLocalPath)
        console.log(`Uploaded cover image: ${coverImage}`)
    } catch (error) {
        console.log(`Error uploading cover image: ${error.message}`)
        throw new apiError(500, 'Cover image upload failed')
    }

    try {
        const user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || '',
            email,
            password,
            username: username.toLowerCase(),
        })

        const createdUser = await User.findById(user._id).select(
            '-password -refreshToken'
        )

        if (!createdUser) {
            throw new apiError(500, 'User registration failed')
        }

        return res
            .status(201)
            .json(new apiResponse(201, createdUser, 'User registered successfully'))
    } catch (error) {
        console.log(`User creation failed`)

        if (avatar) {
            await deleteFromCloudinary(avatar.public_id)
        }

        if (coverImage) {
            await deleteFromCloudinary(coverImage.public_id)
        }

        throw new apiError(500, 'Something went wrong while registering a user')
    }
})

const loginUser = asyncHandler(async (req, res) => {
    const { email, username, password } = req.body

    if (!email) {
        throw new apiError(400, 'Email is required')
    }

    // Validation
    const user = await User.findOne({
        $or: [{ email }, { username }]
    })

    if (!user) {
        throw new apiError(404, 'User not found')
    }

    const isComparePassword = await user.isComparePassword(password)

    if (!isComparePassword) {
        throw new apiError(400, 'Invalid password')
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

    if (!loggedInUser) {
        throw new apiError(500, 'Something went wrong while logging in')
    }

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }

    return res
        .status(200)
        .cookie('accessToken', accessToken, options)
        .cookie('refreshToken', refreshToken, options)
        .json(new apiResponse(
            200,
            { user: loggedInUser, accessToken, refreshToken },
            'User logged in successfully'
        ))
})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        { new: true }
    )

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
    }

    return res
        .status(200)
        .cookie('accessToken', '', options)
        .cookie('refreshToken', '', options)
        .json(new apiResponse(200, {}, 'User logged out successfully'))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new apiError(400, 'Refresh token is required')
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

        if (!decodedToken) {
            throw new apiError(400, 'Invalid refresh token')
        }

        const user = await User.findById(decodedToken?._id)

        if (!user) {
            throw new apiError(404, 'User not found')
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new apiError(400, 'Invalid refresh token')
        }

        const options = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
        }

        const { accessToken, refreshToken: newRefreshToken } = await generateAccessAndRefreshToken(user._id)

        return res
            .status(200)
            .cookie('accessToken', accessToken, options)
            .cookie('refreshToken', newRefreshToken, options)
            .json(new apiResponse(
                200,
                { accessToken, refreshToken: newRefreshToken },
                'Access token refreshed successfully'
            ))
    } catch (error) {
        throw new apiError(500, 'Something went wrong while refreshing access token')
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword) {
        throw new apiError(400, 'Password is required')
    }

    const user = await User.findById(req.user?._id)

    if (!user) {
        throw new apiError(404, 'User not found')
    }

    const isComparePassword = await user.isComparePassword(currentPassword)

    if (!isComparePassword) {
        throw new apiError(400, 'Invalid password')
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })
    return res.status(200).json(new apiResponse(200, {}, 'Password changed successfully'))
})

const getCurrentUser = asyncHandler(async (req, res) => {
    return res.status(200).json(new apiResponse(200, req.user, 'User details fetched successfully'))
})

const updateAcountDetails = asyncHandler(async (req, res) => {
    const { fullName, email, username } = req.body

    if ([fullName, email, username].some((field) => field?.trim() === '')) {
        throw new apiError(400, 'All fields are required')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName: fullName,
                email: email,
                username: username
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    return res.status(200).json(new apiResponse(200, user, 'Account details updated successfully'))

})

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = await req.file?.path

    if (!avatarLocalPath) {
        throw new apiError(400, 'Avatar file is missing')
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new apiError(500, 'Avatar upload failed')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    return res.status(200).json(new apiResponse(200, user, 'Avatar updated successfully'))
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverLocalPath = await req.file?.path

    if (!coverLocalPath) {
        throw new apiError(400, 'Cover image file is missing')
    }

    const coverImage = await uploadOnCloudinary(coverLocalPath)

    if (!coverImage.url) {
        throw new apiError(500, 'Cover image upload failed')
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select('-password -refreshToken')

    return res.status(200).json(new apiResponse(200, user, 'Cover image updated successfully'))
})

const getUserChannelProfile = asyncHandler(async (req, res) => {
    const { username } = req.params

    if (!username?.trim()) {
        throw new apiError(400, 'Username is required')
    }

    const channel = await User.aggregate(
        [
            {
                $match: {
                    username: username?.toLowerCase()
                }
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'channel',
                    as: 'subscribers'
                }
            },
            {
                $lookup: {
                    from: 'subscriptions',
                    localField: '_id',
                    foreignField: 'subscriber',
                    as: 'subscribedTo'
                }
            },
            {
                $addFields: {
                    subscribersCount: { $size: '$subscribers' },
                    channelSubscribedTo: { $size: '$subscribedTo' },
                    isSubscribed: {
                        $cond: {
                            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                            then: true,
                            else: false
                        }
                    }
                }
            },
            {
                $project: {
                    fullName: 1,
                    username: 1,
                    avatar: 1,
                    coverImage: 1,
                    subscribersCount: 1,
                    channelSubscribedTo: 1,
                    isSubscribed: 1
                }
            }
        ]
    )

    if (!channel?.length) {
        throw new apiError(404, 'Channel not found')
    }

    return res.status(200).json(new apiResponse(200, channel[0], 'Channel profile fetched successfully'))
})

const getWatchHistory = asyncHandler(async (req, res) => {
    const user = await User.aggregate(
        [
            {
                $match: {
                    _id: new mongoose.Types.ObjectId(req.user?._id)
                }
            },
            {
                $lookup: {
                    from: 'videos',
                    localField: 'watchHistory',
                    foreignField: '_id',
                    as: 'watchedVideos',
                    pipeline: [
                        {
                            $lookup: {
                                from: 'users',
                                localField: 'owner',
                                foreignField: '_id',
                                as: 'owener',
                                pipeline: [
                                    {
                                        $project: {
                                            fullName: 1,
                                            username: 1,
                                            avatar: 1
                                        }
                                    }
                                ]
                            }
                        },
                        {
                            $addFields: {
                                owner: { $first: '$owner' }
                            }
                        }
                    ]
                }
            },
        ]
    )

    if (!user?.length) {
        throw new apiError(404, 'User not found')
    }

    return res.status(200).json(new apiResponse(200, user[0]?.watchedVideos, 'Watch history fetched successfully'))
})

export {
    registerUser,
    loginUser,
    refreshAccessToken,
    logoutUser,
    changeCurrentPassword,
    getCurrentUser,
    updateAcountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}
