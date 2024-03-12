import { Router } from 'express'
import userRouter from './user.route.js'
import videoRouter from './video.route.js'
import subscriptionRouter from './subscription.route.js'

const router = Router()

router.use('/users', userRouter)

router.use('/videos', videoRouter)

router.use('/subscriptions', subscriptionRouter)

export default router
