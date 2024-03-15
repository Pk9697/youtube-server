import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import {
  getLikedVideos,
  toggleCommentLike,
  toggleTweetLike,
  toggleVideoLike,
} from '../../../controllers/api/v1/like.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/toggle/video/:videoId').post(toggleVideoLike)

router.route('/toggle/comment/:commentId').post(toggleCommentLike)

router.route('/toggle/tweet/:tweetId').post(toggleTweetLike)

router.route('/videos/self').get(getLikedVideos)

export default router
