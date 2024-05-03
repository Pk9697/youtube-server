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
  verifyAccessToken,
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

/* REQUIRES AUTHENTICATION */

router.route('/logout').post(verifyJwt, logoutUser)

/* REQUIRES NO AUTHENTICATION */

router.route('/refresh-token').post(refreshAccessToken)

/* REQUIRES AUTHENTICATION */

router.route('/update-password').patch(verifyJwt, updatePassword)

/* REQUIRES AUTHENTICATION */

router.route('/update-account').patch(verifyJwt, updateAccountDetails)

/* REQUIRES AUTHENTICATION */

router.route('/update-avatar').patch(verifyJwt, upload.single('avatar'), updateAvatar)

/* REQUIRES AUTHENTICATION */

router.route('/update-cover-image').patch(verifyJwt, upload.single('coverImage'), updateCoverImage)

/* REQUIRES AUTHENTICATION */

router.route('/profile/:userName').get(verifyJwt, getUserProfile)

/* REQUIRES AUTHENTICATION */

router.route('/watch-history').get(verifyJwt, getWatchHistory)

/* REQUIRES AUTHENTICATION */

router.route('/verify-access-token').get(verifyJwt, verifyAccessToken)

export default router
