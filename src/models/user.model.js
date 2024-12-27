import mongoose from 'mongoose'
const { Schema } = mongoose

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: [true, 'Please enter your full name'],
            trim: true,
            index: true,
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: 'Video'
            }
        ],
        avatar: {
            type: String,
            required: true,
        },
        coverImage: {
            type: String
        },
        password: {
            type: String,
            required: [true, 'Please enter your password'],
        },
        refreshToken: {
            type: String
        },
    },
    { timestamps: true }
)

export const User = mongoose.model('User', userSchema)