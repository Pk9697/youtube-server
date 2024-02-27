/* eslint-disable no-underscore-dangle */
/* eslint-disable import/prefer-default-export */
// verifies user

import jwt from 'jsonwebtoken'
import { ApiError } from '../utils/ApiError.js'
import { asyncHandler } from '../utils/asyncHandler.js'
import { User } from '../models/user.model.js'

// since res object is not used here we replace it with _ which is a standard practice

export const verifyJwt = asyncHandler(async (req, _, next) => {
  // verify using cookies stored in client browser or from req authorization header sent by client cos mobile clients doesn't have access of cookies
  // now as we configured express to use cookieParser
  // so we can access client cookies from req.cookies set by cookieParser

  const token = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '')

  if (!token) {
    throw new ApiError(401, 'Unauthorized request')
  }

  const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

  const user = await User.findById(decodedToken?._id).select('-password -refreshToken')

  if (!user) {
    throw new ApiError(401, 'Invalid access token')
  }

  // set new object in req which will make it accessible by controllers under req object
  // wherever this mw is plugged in which would be used in controllers like logout where
  // we are not getting user detail from client but only from cookies or authorization headers

  req.user = user

  // call next to now pass req to the specified controller

  next()
})
