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
    )

router.route('/:videoId')
    .get(getVideoById)
    .patch(upload.single('videoFile'), updateVideo)
    .delete(deleteVideo)

router.route('/toggle/publish/:videoId').patch(togglePublishStatus)

export default router