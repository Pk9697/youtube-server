import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import {
  addVideoToPlaylist,
  createPlaylist,
  getPlaylistById,
  getUserPlaylists,
} from '../../../controllers/api/v1/playlist.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/create').post(createPlaylist)

router.route('/user/:userId').get(getUserPlaylists)

router.route('/:playlistId').get(getPlaylistById)

router.route('/add').patch(addVideoToPlaylist)

export default router
