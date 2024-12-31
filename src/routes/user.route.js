import { Router } from 'express'
import { 
    registerUser, 
    logoutUser, 
    loginUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    getUserChannelProfile, 
    updateAcountDetails, 
    updateUserAvatar, 
    updateUserCoverImage, 
    getWatchHistory 
} from '../controllers/user.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()

router.route('/register').post(
    upload.fields([
        {
            name: 'avatar',
            maxCount: 1
        }, {
            name: 'coverImage',
            maxCount: 1
        }
    ]),
    registerUser
) // Good

router.route('/login', ).post(upload.none(), loginUser) // Good

// Secured routes
router.route('/logout').post(verifyJWT, logoutUser) // Good 
router.route('/change-password').post(upload.none(), verifyJWT, changeCurrentPassword) // Good 
router.route('/refresh-token').post(refreshAccessToken) // Good

router.route('/current-user').get(verifyJWT, getCurrentUser) // Good
router.route('/channel/:username').get(verifyJWT, getUserChannelProfile) // Good
router.route('/history').get(verifyJWT, getWatchHistory) // Good

router.route('/update-account').patch(upload.none(), verifyJWT, updateAcountDetails) // Good
router.route('/avatar').patch(verifyJWT, upload.single('avatar') ,updateUserAvatar) // Good
router.route('/cover-image').patch(verifyJWT, upload.single('coverImage'), updateUserCoverImage) // Good

export default router