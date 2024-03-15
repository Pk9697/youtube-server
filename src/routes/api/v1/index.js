import { Router } from 'express'
import userRouter from './user.route.js'
import videoRouter from './video.route.js'
import subscriptionRouter from './subscription.route.js'
import commentRouter from './comment.route.js'
import likeRouter from './like.route.js'
import playlistRouter from './playlist.route.js'

const router = Router()

router.use('/users', userRouter)

router.use('/videos', videoRouter)

router.use('/subscriptions', subscriptionRouter)

router.use('/comments', commentRouter)

router.use('/likes', likeRouter)

router.use('/playlist', playlistRouter)

export default router
