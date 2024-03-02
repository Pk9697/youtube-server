import { Router } from 'express'
import {
  getUserProfile,
  getWatchHistory,
  loginUser,
  logoutUser,
  refreshAccessToken,
  registerUser,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  updatePassword,
} from '../../../controllers/api/v1/user.controller.js'
import { upload } from '../../../middlewares/multer.middleware.js'
import { verifyJwt } from '../../../middlewares/auth.middleware.js'

const router = Router()

// or router.post('/register',registerUser)

// injecting multer mw here cos we want to accept avatar and coverImage from client
// so we can accept file for multiple fields using .fields which accepts an array where each entry
// consists of field name and how many files for that field we want to accept also this field name should be
// same from client
// so form data is going to controller but multer mw also sends files along with it

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

router.route('/login').post(loginUser)

// secured routes
// can attach as many mw as we want cos using next it would execute 1 after another till we get to our controller and finish executing

router.route('/logout').post(verifyJwt, logoutUser)

router.route('/refresh-token').post(refreshAccessToken)

router.route('/update-password').patch(verifyJwt, updatePassword)

router.route('/update-account').patch(verifyJwt, updateAccountDetails)

router.route('/update-avatar').patch(verifyJwt, upload.single('avatar'), updateAvatar)

router.route('/update-cover-image').patch(verifyJwt, upload.single('coverImage'), updateCoverImage)

router.route('/profile/:userName').post(verifyJwt, getUserProfile)

router.route('/watch-history').post(verifyJwt, getWatchHistory)

export default router
