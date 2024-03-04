/* eslint-disable import/prefer-default-export */
/* eslint-disable no-underscore-dangle */
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { uploadOnCloudinary } from '../../../utils/cloudinary.js'

/* REQUIRES AUTHENTICATION */

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body
  const videoFileLocalPath = req.files?.videoFile ? req.files.videoFile[0].path : null

  if (!videoFileLocalPath) {
    throw new ApiError(400, 'VideoFile field is required')
  }

  const thumbnailLocalPath = req.files?.thumbnail ? req.files.thumbnail[0].path : null

  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'Thumbnail field is required')
  }

  // upload on cloudinary

  const uploadedVideoFile = await uploadOnCloudinary(videoFileLocalPath)

  if (!uploadedVideoFile) {
    throw new ApiError(400, 'Video upload on cloudinary failed')
  }

  const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

  if (!uploadedThumbnail) {
    throw new ApiError(400, 'THumbnail upload on cloudinary failed')
  }

  const video = await Video.create({
    videoFile: uploadedVideoFile?.url,
    thumbnail: uploadedThumbnail?.url,
    owner: req.user._id,
    title,
    description,
    duration: uploadedVideoFile?.duration,
  })

  if (!video) {
    throw new ApiError(500, 'Upload video failed')
  }

  const videoWithPopulatedOwner = await Video.aggregate([
    {
      $match: {
        _id: video._id,
      },
    },
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
  ])

  if (!videoWithPopulatedOwner) {
    throw new ApiError(500, 'Owner field of video population failed')
  }

  return res.status(201).json(new ApiResponse(200, videoWithPopulatedOwner[0], 'Video uploaded successfully'))
})

export { uploadVideo }
