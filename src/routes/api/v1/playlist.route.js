import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import { createPlaylist } from '../../../controllers/api/v1/playlist.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/create').post(createPlaylist)

export default router
