import { Router } from 'express'
import { registerUser } from '../../../controllers/api/v1/user.controller.js'
import { upload } from '../../../middlewares/multer.middleware.js'

const router = Router()

// or router.post('/register',registerUser)

// injecting multer mw here cos we want to accept avatar and coverImage from client
// so we can accept file for multiple fields using .fields which accepts an array where each entry
// consists of field name and how many files for that field we want to accept also this field name should be
// same from client

router.route('/register').post(
  upload.fields([
    {
      name: 'avatar',
      maxCount: 1,
    },
    {
      name: 'coverImage',
      maxCount: 1,
    },
  ]),
  registerUser
)

export default router
