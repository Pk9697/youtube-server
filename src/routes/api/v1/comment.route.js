import { Router } from 'express'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'
import { addComment, getVideoComments } from '../../../controllers/api/v1/comment.controller.js'

const router = Router()

router.use(verifyJwt)

router.route('/:videoId').get(getVideoComments)

router.route('/add/:videoId').post(addComment)

export default router
