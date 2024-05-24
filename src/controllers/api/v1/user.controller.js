/* eslint-disable no-underscore-dangle */
/* eslint-disable import/prefer-default-export */
import jwt from 'jsonwebtoken'
// import fs from 'fs'
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { deleteOnCloudinary, uploadOnCloudinary } from '../../../utils/cloudinary.js'
import { Playlist } from '../../../models/playlist.model.js'

// don't use asyncHandler here cos it is associated with only controllers
// and not helper functions like this generateAccessAndRefreshTokens

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

// TODO: UNDO BELOW CHANGES ON PRODUCTION

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
  // TODO USE CLOUDINARY API ON PRODUCTION

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath)
  const uploadedCoverImage = coverImageLocalPath ? await uploadOnCloudinary(coverImageLocalPath) : null

  if (!uploadedAvatar) {
    throw new ApiError(400, 'Avatar upload on cloudinary failed')
  }

  // create User object

  const user = await User.create({
    fullName,
    avatar: uploadedAvatar?.secure_url,
    coverImage: uploadedCoverImage?.secure_url || '',
    email,
    userName: userName.toLowerCase(),
    password,
  })

  //* WITHOUT CLOUDINARY API

  // const user = await User.create({
  //   fullName,
  //   avatar: avatarLocalPath,
  //   coverImage: coverImageLocalPath || '',
  //   email,
  //   userName: userName.toLowerCase(),
  //   password,
  // })

  // create liked videos and watch later playlists for new user named LL and WL

  await Playlist.create({
    name: 'LL',
    description: 'Liked Videos',
    owner: user._id,
    visibility: 'private',
  })
  await Playlist.create({
    name: 'WL',
    description: 'Watch Later',
    owner: user._id,
    visibility: 'private',
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

  const loggedInUser = await User.findById(user._id).select('-password')

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

/* REQUIRES AUTHENTICATION */

const logoutUser = asyncHandler(async (req, res) => {
  const userId = req.user._id

  // remove refreshToken using $set operator
  // and get updated user response from User model with refreshToken updated

  await User.findByIdAndUpdate(
    userId,
    {
      // $set: { refreshToken: '' },
      // or which removes field from document , so in mongodb field refreshToken won't exist
      $unset: { refreshToken: 1 },
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
  const incomingRefreshToken = req.cookies?.refreshToken || req.header('Authorization')?.replace('Bearer ', '')
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

  const loggedInUser = await User.findById(user._id).select('-password')

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

/* REQUIRES AUTHENTICATION */

const updatePassword = asyncHandler(async (req, res) => {
  // get user from req.user
  // get oldPassword,newPassword from req.body
  // check oldPassword correct or not using method defined in user model
  // update password with newPassword in db
  // save user
  // return success response

  const user = await User.findById(req.user?._id)

  const { password, newPassword, confirmNewPassword } = req.body

  if (newPassword.trim() !== confirmNewPassword.trim()) {
    throw new ApiError(400, 'Passwords do not match!')
  }

  const isPasswordValid = await user.isPasswordCorrect(password.trim())
  if (!isPasswordValid) {
    throw new ApiError(400, 'Invalid Password!')
  }

  // when it will go to save then pre hook will be called which we defined in user model,
  // which will hash our newPassword and save in db

  user.password = newPassword.trim()
  await user.save({ validateBeforeSave: false, new: true })

  return res.status(200).json(new ApiResponse(200, {}, 'Password updated successfully!'))
})

/* REQUIRES AUTHENTICATION */

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body
  if (!fullName.trim() && !email.trim()) {
    throw new ApiError(400, 'Fullname or email is required')
  }

  const existingUser = await User.findOne({ email: email.trim() })
  if (existingUser && !existingUser._id.equals(req.user._id)) {
    throw new ApiError(401, 'Email already exists!')
  }

  const user = await User.findById(req.user._id).select('-password -refreshToken')

  if (fullName.trim() && fullName.trim() !== user.fullName) {
    user.fullName = fullName.trim()
  }

  if (email.trim() && email.trim() !== user.email) {
    user.email = email.trim()
  }

  await user.save({ validateBeforeSave: false, new: true })

  return res.status(200).json(new ApiResponse(200, user, 'Fullname or email updated successfully'))
})

/* REQUIRES AUTHENTICATION */
/* REQUIRES MULTER MIDDLEWARE TO GET ACCESS TO UPLOADED FILE */
// TODO: Use Cloudinary on production
const updateAvatar = asyncHandler(async (req, res) => {
  // get uploaded file from client from req.file not req.files cos
  // here we would be accepting single file only so multer provides access to that file using req.file
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(400, 'Avatar field is required')
  }

  const uploadedAvatar = await uploadOnCloudinary(avatarLocalPath)
  if (!uploadedAvatar) {
    throw new ApiError(400, 'Avatar upload on cloudinary failed')
  }
  // WITH CLOUDINARY
  const user = await User.findById(req.user._id).select('-password -refreshToken')
  await deleteOnCloudinary(user?.avatar)

  user.avatar = uploadedAvatar.secure_url
  await user.save({ validateBeforeSave: false, new: true })

  // WITHOUT CLOUDINARY
  // const user = await User.findById(req.user._id).select('-password -refreshToken')
  // if (fs.existsSync(user.avatar)) fs.unlinkSync(user.avatar)

  // user.avatar = avatarLocalPath
  // await user.save({ validateBeforeSave: false, new: true })

  // or
  // const user = await User.findByIdAndUpdate(
  //   req.user?._id,
  //   {
  //     $set: {
  //       avatar: uploadedAvatar.url,
  //     },
  //   },
  //   { new: true }
  // ).select('-password -refreshToken')

  return res.status(200).json(new ApiResponse(200, user, 'Avatar updated successfully!'))
})

/* REQUIRES AUTHENTICATION */
/* REQUIRES MULTER MIDDLEWARE TO GET ACCESS TO UPLOADED FILE */
// TODO: Use Cloudinary on production
const updateCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(400, 'CoverImage field is required')
  }

  // WITH CLOUDINARY
  const uploadedCoverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!uploadedCoverImage) {
    throw new ApiError(400, 'coverImage upload on cloudinary failed')
  }

  const user = await User.findById(req.user._id).select('-password -refreshToken')

  await deleteOnCloudinary(user?.coverImage)

  user.coverImage = uploadedCoverImage.secure_url
  await user.save({ validateBeforeSave: false })

  // WITHOUT CLOUDINARY
  // const user = await User.findById(req.user._id).select('-password -refreshToken')
  // if (fs.existsSync(user.coverImage)) fs.unlinkSync(user.coverImage)

  // user.coverImage = coverImageLocalPath
  // await user.save({ validateBeforeSave: false, new: true })

  // or
  // const user = await User.findByIdAndUpdate(
  //   req.user?._id,
  //   {
  //     $set: {
  //       coverImage: uploadedCoverImage.url,
  //     },
  //   },
  //   { new: true }
  // ).select('-password -refreshToken')

  return res.status(200).json(new ApiResponse(200, user, 'coverImage updated successfully!'))
})

/* REQUIRES AUTHENTICATION */

const getUserProfile = asyncHandler(async (req, res) => {
  const { userName } = req.params
  if (!userName?.trim()) {
    throw new ApiError(400, 'Username is required!')
  }

  // mongoose allows us to write aggregation queries
  // till now we are only familiar with with normal mongoDb queries like insertMany , updateMany  etc
  // but true power of mongoDB which developers use in production is achieved by aggregation queries to do complex queries
  // search mongodb aggregation pipeline for more details

  // using aggregation pipeline, in first stage we find current user/channel using $match operator,
  // then in next stage using $lookup operator and this current user/channel,
  // we find all the users whose channel id is this current user/channel
  // which means we are finding subscribers where we would get back result in array named subscribers which we defined using 'as'
  // then in next stage we are finding how many channels the current user is subscribed to
  // then in next stage we are adding extra fields to current user/channel with size of subscribers and subscribedTo document
  // and adding isSubscribed field to make client's work easier
  // so that user who is visiting some channel can know if they are subscribed to this channel or not
  // then in next stage we are only selecting fields which we want to send to client using $project and
  // passing fields name with a value / flag 1 denoting we want to send this field to user

  const channel = await User.aggregate([
    {
      $match: { userName: userName?.toLowerCase() },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'channel',
        as: 'subscribers',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'subscriber',
        as: 'subscribedTo',
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: '$subscribers',
        },
        subscribedToCount: {
          $size: '$subscribedTo',
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, '$subscribers.subscriber'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        userName: 1,
        email: 1,
        fullName: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscribedToCount: 1,
        isSubscribed: 1,
      },
    },
  ])
  if (!channel?.length) {
    throw new ApiError(404, 'Channel does not exist!')
  }

  return res.status(200).json(new ApiResponse(200, channel[0], 'User channel fetched successfully!'))
})

/* REQUIRES AUTHENTICATION */

// * id which we get from req.user._id is in string which when we use to query, gets
// internally converted by mongoose in mongodb object id for normal queries like findbyid etc
// but when we use aggregation pipeline mongoose here doesn't do anything cos it directly interacts with mongodb
// therefore we need to convert it in mongodb object id when we use aggregation using
// 'new mongoose.Types.ObjectId(req.user._id)'
// * but it's now derecated and working without converting to ObjectId

// in 1st stage we are finding curr logged in user
// in 2nd stage we are populating watchHistory which contains video ids from video model
// and in same stage we are populating owner field which is an user id from user model using pipeline
// and further selecting the fields which we want to send to client of each user using $project which is also a pipeline
// and is nested so we call it as sub pipeline
// and using addFields to overwrite owner field with populated user selecting 1st object of array $owner which we recieve

const getWatchHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $unwind: '$watchHistory',
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'watchHistory',
        foreignField: '_id',
        as: 'watchHistory',
        pipeline: [
          {
            $lookup: {
              from: 'users',
              localField: 'owner',
              foreignField: '_id',
              as: 'owner',
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    email: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: '$owner',
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        watchHistory: {
          $first: '$watchHistory',
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        watchHistory: {
          $push: '$watchHistory',
        },
      },
    },
  ])

  // aggregation pipeline sends response as an array of objects ,
  // here only 1 document would be matched for curr user
  // and we want to send only watchHistory which will be an array of objects

  return res.status(200).json(new ApiResponse(200, user[0]?.watchHistory, 'User watch history fetched successfully'))
})

const verifyAccessToken = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, 'Access token verified successfully!'))
})

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  updatePassword,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
  getUserProfile,
  getWatchHistory,
  verifyAccessToken,
}
