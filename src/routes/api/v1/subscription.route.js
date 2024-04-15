import { Router } from 'express'
import {
  getLoggedInUserSubscribedToChannelsVideos,
  getUserChannelSubscribers,
  getUserSubscribedToChannels,
  toggleSubscription,
} from '../../../controllers/api/v1/subscription.controller.js'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'

const router = Router()

/* REQUIRES AUTH IN ALL ROUTES */

router.use(verifyJwt)

router.route('/toggle/:channelId').post(toggleSubscription)

router.route('/channels').get(getUserSubscribedToChannels)
router.route('/channels/videos').get(getLoggedInUserSubscribedToChannelsVideos)

router.route('/subscribers/:channelId').get(getUserChannelSubscribers)

export default router
