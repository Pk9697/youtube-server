import { Router } from 'express'
import { upload } from '../../../middlewares/multer.middleware.js'
import {
  getAllVideos,
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

/* REQUIRES NO AUTHENTICATION */

router.route('/').post(getAllVideos)

/* REQUIRES AUTHENTICATION */

router.route('/update/:videoId').patch(verifyJwt, upload.single('thumbnail'), updateVideo)

/* REQUIRES AUTHENTICATION */

router.route('/toggle/publish/:videoId').patch(verifyJwt, togglePublishStatus)

export default router
