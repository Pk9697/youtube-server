/* eslint-disable no-underscore-dangle */
import { User } from '../../../models/user.model.js'
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { deleteOnCloudinary, uploadOnCloudinary } from '../../../utils/cloudinary.js'

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

/* REQUIRES NO AUTHENTICATION */

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = -1, userId } = req.query

  const options = {
    page,
    limit,
    // sort: { [sortBy]: sortType },
  }

  const aggregatePipelineStages = []

  if (userId) {
    const user = await User.findById(userId)
    if (!user) {
      throw new ApiError(400, "User doesn't exist")
    }

    aggregatePipelineStages.push({
      $match: {
        owner: user._id,
      },
    })
  }

  if (query) {
    aggregatePipelineStages.push({
      $match: {
        $or: [
          { title: { $regex: `.*${query}.*`, $options: 'i' } },
          { description: { $regex: `.*${query}.*`, $options: 'i' } },
        ],
      },
    })
  }

  // * don't use await here otherwise it fails cos it's going to be attached to aggregatePaginate

  const agg = Video.aggregate([
    ...aggregatePipelineStages,
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
          $arrayElemAt: ['$owner', 0],
        },
      },
    },
    {
      $sort: {
        [sortBy]: Number(sortType),
      },
    },
  ])

  const videos = await Video.aggregatePaginate(agg, options)

  return res.status(200).json(new ApiResponse(200, videos, 'Videos fetched successfully'))
})

/* REQUIRES AUTHENTICATION AND AUTHORIZATION */

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const { title, description } = req.body

  const thumbnailLocalPath = req.file?.path

  if (!thumbnailLocalPath && !title?.trim() && !description?.trim()) {
    throw new ApiError(400, 'Thumbnail, title or description field is required')
  }

  const video = await Video.findById(videoId)

  if (!video) {
    throw new ApiError(404, `Video does not exist`)
  }

  /* AUTHORIZATION CHECK */

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, `You are not authorized to update this video`)
  }

  if (title) {
    video.title = title
  }

  if (description) {
    video.description = description
  }

  if (thumbnailLocalPath) {
    const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!uploadedThumbnail) {
      throw new ApiError(400, 'Thumbnail upload on cloudinary failed')
    }

    const existingThumbnailPublicId = await video?.thumbnail?.split('/').slice(-1)[0].split('.')[0]

    await deleteOnCloudinary(existingThumbnailPublicId)

    video.thumbnail = uploadedThumbnail?.url
  }

  await video.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, video, 'Video updated successfully'))
})

export { uploadVideo, getAllVideos, updateVideo }
