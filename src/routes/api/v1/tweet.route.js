import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import { createTweet, getUserTweets } from '../../../controllers/api/v1/tweet.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/create').post(createTweet)

router.route('/users/:userId').get(getUserTweets)

export default router
