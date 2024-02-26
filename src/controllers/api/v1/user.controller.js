/* eslint-disable no-underscore-dangle */
/* eslint-disable import/prefer-default-export */
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../../../utils/cloudinary.js'

const registerUser = asyncHandler(async (req, res) => {
  // steps
  // get user details from client
  // validation - not empty
  // check if user already exists: username,email
  // check for images,check for avatar
  // upload them to cloudinary, check avatar is successfully uploaded on cloidinary or not cos it's req field in model
  // create user object - create entry in db
  // pluck out pass and refresh token field from response
  // check is user created
  // return response

  const { fullName, email, userName, password } = req.body

  // if any of the fields received is empty return error from our ApiError class

  if ([fullName, email, userName, password].some((field) => field?.trim === '')) {
    throw new ApiError(400, 'All fields are required')
  }

  //  find if a user exists with email or username using query object
  // and we can use operator like $or,$and which accepts an array of field objects which we want to match
  // so here using or operator we are checking if a user with username or email exists if yes mongodb returns ref of that user

  const isExistingUser = await User.findOne({
    $or: [{ userName }, { email }],
  })

  if (isExistingUser) {
    throw new ApiError(409, 'User with email or userName already exists')
  }

  // using req.body we can get data sent via client which is stored here in body by express
  // but to handle files we attached a multer mw which stores files from client in file or files object
  // which can be accessed by req.file or req.files if multiple files are uploaded

  // get proper path from multer where multer has uploaded files to (i.e, ./public/temp/<filename> which we configured)

  const avatarLocalPath = req.files?.avatar ? req.files.avatar[0].path : null

  const coverImageLocalPath = req.files?.coverImage ? req.files.coverImage[0].path : null

  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar field is required')
  }

  // upload on cloudinary

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath)

  const uploadedCoverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

  if (!uploadedAvatar) {
    throw new ApiError(400, 'Avatar upload on cloudinary failed')
  }

  // create User object

  const user = await User.create({
    fullName,
    avatar: uploadedAvatar?.url,
    coverImage: uploadedCoverImage?.url || '',
    email,
    userName: userName.toLowerCase(),
    password,
  })

  // pluck out fields from User ref using .select

  const createdUser = await User.findById(user._id).select('-password -refreshToken')

  if (!createdUser) {
    throw new ApiError(500, 'Register User failed')
  }

  return res.status(201).json(new ApiResponse(200, createdUser, 'User registered successfully'))
})

export { registerUser }
