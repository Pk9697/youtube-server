import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import {
  addComment,
  deleteComment,
  getVideoComments,
  updateComment,
} from '../../../controllers/api/v1/comment.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/:videoId').get(getVideoComments)

router.route('/add/:videoId').post(addComment)

router.route('/update/:commentId').patch(updateComment)

router.route('/delete/:commentId').delete(deleteComment)

export default router
