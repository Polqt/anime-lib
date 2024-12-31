import jwt from 'jsonwebtoken'
import { apiError } from '../utils/apiError.js'
import { User } from '../models/user.model.js'
import { asyncHandler } from '../utils/asyncHandler.js'


export const verifyJWT = asyncHandler(async (req, _, next) => {
    try {
        const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer', '')

        if (!token) {
            throw new apiError(401, 'Unauthorized access token')
        }
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedToken?._id).select('-password -refreshToken')

        if (!user) {
            throw new apiError(401, 'User not found')
        }

        req.user = user
        next()
    } catch (error) {
        throw new apiError(401, `${error.message}` || 'Invalid access token')
    }
})