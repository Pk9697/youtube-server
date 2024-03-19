import { Router } from 'express'
import userRouter from './user.route.js'
import videoRouter from './video.route.js'
import subscriptionRouter from './subscription.route.js'
import commentRouter from './comment.route.js'
import likeRouter from './like.route.js'
import playlistRouter from './playlist.route.js'
import tweetRouter from './tweet.route.js'
import dashboardRouter from './dashboard.route.js'
import healthcheckRouter from './healthcheck.route.js'

const router = Router()

router.use('/users', userRouter)

router.use('/videos', videoRouter)

router.use('/subscriptions', subscriptionRouter)

router.use('/comments', commentRouter)

router.use('/likes', likeRouter)

router.use('/playlists', playlistRouter)

router.use('/tweets', tweetRouter)

router.use('/dashboard', dashboardRouter)

router.use('/healthcheck', healthcheckRouter)

export default router
