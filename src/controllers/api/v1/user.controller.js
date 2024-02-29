/* eslint-disable no-underscore-dangle */
/* eslint-disable import/prefer-default-export */
import jwt from 'jsonwebtoken'
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../../../utils/cloudinary.js'

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = await user.generateAccessToken()
    const refreshToken = await user.generateRefreshToken()

    user.refreshToken = refreshToken

    // when trying to save refreshToken it will give error
    // cos required fields like password etc are not provided here so we exclude validateBeforeSave here

    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (err) {
    throw new ApiError(500, 'Something went wrong while generating access and refresh tokens')
  }
}

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

const loginUser = asyncHandler(async (req, res) => {
  // steps
  // get email/username,password from client from req.body
  // find user
  // check if password correct
  // if yes generate accesstoken,refreshToken and save refresh token in user model
  // send accessToken,refreshToken in cookies

  //! not getting data from form-data postman unlike register
  // only from x-www-form-urlencoded where file send option is not provided
  // and from raw json data

  const { email, userName, password } = req.body

  if (!email && !userName) {
    throw new ApiError(400, 'Username or email is required')
  }

  // find user based on either userName or email

  const user = await User.findOne({
    $or: [{ userName }, { email }],
  })

  if (!user) {
    throw new ApiError(404, 'User does not exist')
  }

  // can access methods defined in model from user ref instance not User model

  const isPasswordValid = await user.isPasswordCorrect(password)

  if (!isPasswordValid) {
    throw new ApiError(401, 'Password incorrect')
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

  // cookies options
  // cookies by default can be modified by anyone in frontend,
  // on setting these options , only server would be able to modify cookies in frontend

  const options = {
    httpOnly: true,
    secure: true,
  }

  // we are setting cookie in client using cookieParser which we configured and also sending it in json
  // so that user has an option to save tokens in its localStorage without accessing tokens themself
  // cos in mobile clients there is no option to retrieve cookies so it's a good practice

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'Logged in successfully'
      )
    )
})

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // remove refreshToken using $set operator
  // and get updated user response from User model with refreshToken updated

  await User.findByIdAndUpdate(
    userId,
    {
      $set: { refreshToken: '' },
    },
    { new: true }
  )

  const options = {
    httpOnly: true,
    secure: true,
  }

  // clear cookie from client's cookies

  return res
    .status(200)
    .clearCookie('accessToken', options)
    .clearCookie('refreshToken', options)
    .json(new ApiResponse(200, {}, 'Logged out successfully'))
})

// accessToken is usually short lived compared to refreshToken which means accessToken is expired before refreshToken cos of security reasons
// then user would have to login again so to prevent this when accessToken expires then client can hit an endpoint where in controller ,
// client's refreshToken stored in cookie or via auth header is compared with refreshToken stored in db for that user,
// if same then new accessToken is generated and provided to client which it can use for other requests where authentication is required
// so this is the endpoint controller refreshAccessToken which we will make client hit when it's accessToken expires to refresh accessToken

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, 'Unauthorized request! refreshToken not received')
  }

  const decodedRefreshToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)

  const user = await User.findById(decodedRefreshToken?._id)

  if (!user) {
    throw new ApiError(401, 'Invalid refresh token!')
  }

  if (incomingRefreshToken !== user?.refreshToken) {
    throw new ApiError(401, 'Invalid refresh token! does not match with refreshToken stored in db')
  }

  const options = {
    httpOnly: true,
    secure: true,
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select('-password -refreshToken')

  return res
    .status(200)
    .cookie('accessToken', accessToken, options)
    .cookie('refreshToken', refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        'Access and refresh token refreshed'
      )
    )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken }
