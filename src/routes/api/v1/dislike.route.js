import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import {
  toggleCommentDislike,
  toggleTweetDislike,
  toggleVideoDislike,
} from '../../../controllers/api/v1/dislike.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/toggle/video/:videoId').post(toggleVideoDislike)

router.route('/toggle/comment/:commentId').post(toggleCommentDislike)

router.route('/toggle/tweet/:tweetId').post(toggleTweetDislike)

export default router
