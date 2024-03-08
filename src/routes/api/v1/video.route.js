import { Router } from 'express'
import { upload } from '../../../middlewares/multer.middleware.js'
import {
  deleteVideo,
  getAllVideos,
  getVideoById,
  togglePublishStatus,
  updateVideo,
  uploadVideo,
} from '../../../controllers/api/v1/video.controller.js'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'

const router = Router()

/* REQUIRES AUTHENTICATION */

router.route('/upload').post(
  verifyJwt,
  upload.fields([
    {
      name: 'videoFile',
      maxCount: 1,
    },
    {
      name: 'thumbnail',
      maxCount: 1,
    },
  ]),
  uploadVideo
)

/* REQUIRES AUTHENTICATION */

router.route('/').post(verifyJwt, getAllVideos)

/* REQUIRES AUTHENTICATION */

router.route('/update/:videoId').patch(verifyJwt, upload.single('thumbnail'), updateVideo)

/* REQUIRES AUTHENTICATION */

router.route('/toggle/publish/:videoId').patch(verifyJwt, togglePublishStatus)

/* REQUIRES AUTHENTICATION */

router.route('/delete/:videoId').delete(verifyJwt, deleteVideo)

/* REQUIRES AUTHENTICATION */

router.route('/view/:videoId').get(verifyJwt, getVideoById)

export default router
