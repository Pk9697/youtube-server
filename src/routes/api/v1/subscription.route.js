import { Router } from 'express'
import {
  getUserChannelSubscribers,
  getUserSubscribedToChannels,
  toggleSubscription,
} from '../../../controllers/api/v1/subscription.controller.js'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'

const router = Router()

/* REQUIRES AUTH IN ALL ROUTES */

router.use(verifyJwt)

router.route('/toggle/:channelId').post(toggleSubscription)

router.route('/channels/:subscriberId').get(getUserSubscribedToChannels)

router.route('/subscribers/:channelId').get(getUserChannelSubscribers)

export default router
