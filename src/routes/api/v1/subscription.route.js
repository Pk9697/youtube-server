import { Router } from 'express'
import { toggleSubscription } from '../../../controllers/api/v1/subscription.controller.js'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'

const router = Router()

/* REQUIRES AUTH IN ALL ROUTES */

router.use(verifyJwt)

router.route('/toggle/:channelId').post(toggleSubscription)

export default router
