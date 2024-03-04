import { Router } from 'express'
import { upload } from '../../../middlewares/multer.middleware.js'
import { uploadVideo } from '../../../controllers/api/v1/video.controller.js'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'

const router = Router()

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

export default router
