import { asyncHandler } from '../utils/asyncHandler.js'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import { uploadOnCloudinary, deleteFromCloudinary } from '../utils/cloudinary.js'
import { apiResponse } from '../utils/apiResponse.js'

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, username, password } = req.body

    if ([fullName, email, username, password].some((field) => field?.trim() === "")) {
        throw new apiError(400, 'All fields are required')
    }

    const existedUser = await User.findOne({
        $or: [{email}, {username}]
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

export { registerUser}