import { Router } from 'express'
import { 
    getAllVideos,
    uploadVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from '../controllers/video.controller.js'
import { upload } from '../middlewares/multer.middleware.js'
import { verifyJWT } from '../middlewares/auth.middleware.js'

const router = Router()
router.use(verifyJWT)

router.route('/')
    .get(getAllVideos)
    .post(
        upload.fields([
            { name: 'videoFile', maxCount: 1,},
            { name: 'thumbnailFile',maxCount: '1'},
        ]),
        uploadVideo
    ) // Good

router.route('/:videoId')
    .get(getVideoById) // Good
    .patch(upload.single('thumbnailFile'), updateVideo)
    .delete(deleteVideo) // Good 

router.route('/toggle/publish/:videoId').patch(togglePublishStatus)

export default router