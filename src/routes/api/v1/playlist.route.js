import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import { createPlaylist, getUserPlaylists } from '../../../controllers/api/v1/playlist.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/create').post(createPlaylist)

router.route('/user/:userId').get(getUserPlaylists)

export default router
