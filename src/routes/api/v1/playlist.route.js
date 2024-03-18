import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import {
  addVideoToPlaylist,
  createPlaylist,
  deletePlaylist,
  getPlaylistById,
  getUserPlaylists,
  removeVideoFromPlaylist,
  updatePlaylist,
} from '../../../controllers/api/v1/playlist.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/create').post(createPlaylist)

router.route('/user/:userId').get(getUserPlaylists)

router.route('/:playlistId').get(getPlaylistById)

router.route('/add').patch(addVideoToPlaylist)

router.route('/remove').patch(removeVideoFromPlaylist)

router.route('/delete/:playlistId').delete(deletePlaylist)

router.route('/update/:playlistId').patch(updatePlaylist)

export default router
