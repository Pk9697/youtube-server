/* eslint-disable no-underscore-dangle */
import mongoose from 'mongoose'
import fs from 'fs'
import { getVideoDurationInSeconds } from 'get-video-duration'
import { User } from '../../../models/user.model.js'
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
// import { deleteOnCloudinary, uploadOnCloudinary } from '../../../utils/cloudinary.js'
import { Comment } from '../../../models/comment.model.js'
import { Like } from '../../../models/like.model.js'
import { Playlist } from '../../../models/playlist.model.js'
import { Dislike } from '../../../models/dislike.model.js'

const incrementViewCountAndUpdateWatchHistory = async (videoId, userId) => {
  const video = await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: { views: 1 },
    },
    { new: true }
  )

  if (!video) {
    throw new ApiError(404, `Video does not exist`)
  }

  const loggedInUser = await User.findById(userId)
  const filteredWatchHistory = await loggedInUser.watchHistory.filter((id) => !id.equals(videoId))

  loggedInUser.watchHistory = [videoId, ...filteredWatchHistory]
  await loggedInUser.save({ validateBeforeSave: false })
}

/* REQUIRES AUTHENTICATION */
// TODO: UNDO BELOW CHANGES ON PRODUCTION

const uploadVideo = asyncHandler(async (req, res) => {
  const { title, description, isPublished = true } = req.body

  console.log({ isPublished })
  console.log(typeof isPublished)

  const videoFileLocalPath = req.files?.videoFile ? req.files.videoFile[0].path : null
  if (!videoFileLocalPath) {
    throw new ApiError(400, 'VideoFile field is required')
  }

  const thumbnailLocalPath = req.files?.thumbnail ? req.files.thumbnail[0].path : null
  if (!thumbnailLocalPath) {
    throw new ApiError(400, 'Thumbnail field is required')
  }

  // upload on cloudinary
  // TODO USE CLOUDINARY API ON PRODUCTION -> UNCOMMENT LINES 53-71 AND COMMENT LINES 75-85

  // const uploadedVideoFile = await uploadOnCloudinary(videoFileLocalPath)
  // if (!uploadedVideoFile) {
  //   throw new ApiError(400, 'Video upload on cloudinary failed')
  // }

  // const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
  // if (!uploadedThumbnail) {
  //   throw new ApiError(400, 'THumbnail upload on cloudinary failed')
  // }

  // const video = await Video.create({
  //   videoFile: uploadedVideoFile?.url,
  //   thumbnail: uploadedThumbnail?.url,
  //   owner: req.user._id,
  //   title,
  //   description,
  //   isPublished,
  //   duration: uploadedVideoFile?.duration,
  // })

  //* WITHOUT CLOUDINARY API

  const duration = await getVideoDurationInSeconds(videoFileLocalPath)

  const video = await Video.create({
    videoFile: videoFileLocalPath || '',
    thumbnail: thumbnailLocalPath || '',
    owner: req.user._id,
    title,
    description,
    isPublished,
    duration,
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

/* REQUIRES AUTHENTICATION */

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query = '', sortBy = 'createdAt', sortType = -1, userId, userName } = req.query

  const options = {
    page,
    limit,
    // sort: { [sortBy]: sortType },
  }

  const aggregatePipelineStages = []

  if (userId || userName) {
    const existingUser = await User.findOne({
      $or: [{ _id: userId }, { userName }],
    })

    if (!existingUser) {
      throw new ApiError(404, 'User does not exist')
    }

    aggregatePipelineStages.push({
      $match: {
        owner: existingUser._id,
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
      $match: {
        isPublished: true,
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
// TODO CHANGE ON PRODUCTION

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const { title, description, isPublished } = req.body
  const thumbnailLocalPath = req.file?.path

  if (
    !thumbnailLocalPath &&
    !title?.trim() &&
    !description?.trim() &&
    isPublished !== 'false' &&
    isPublished !== 'true'
  ) {
    throw new ApiError(400, 'Thumbnail, title , description or isPublished field is required')
  }

  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(404, `Video does not exist`)
  }

  /* AUTHORIZATION CHECK */

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, `You are not authorized to update this video`)
  }

  if (isPublished === 'true' || isPublished === 'false') {
    video.isPublished = isPublished
  }

  if (title) {
    video.title = title
  }

  if (description) {
    video.description = description
  }

  //* WITHOUT CLOUDINARY API

  // if (thumbnailLocalPath) {
  //   const uploadedThumbnail = await uploadOnCloudinary(thumbnailLocalPath)
  //   if (!uploadedThumbnail) {
  //     throw new ApiError(400, 'Thumbnail upload on cloudinary failed')
  //   }

  //   await deleteOnCloudinary(video?.thumbnail)

  //   video.thumbnail = uploadedThumbnail?.url
  // }

  if (thumbnailLocalPath) {
    if (fs.existsSync(video.thumbnail)) fs.unlinkSync(video.thumbnail)
    video.thumbnail = thumbnailLocalPath
  }

  await video.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, video, 'Video updated successfully'))
})

/* REQUIRES AUTHENTICATION AND AUTHORIZATION */

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(404, `Video does not exist`)
  }

  /* AUTHORIZATION CHECK */

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, `You are not authorized to toggle this video public status`)
  }

  video.isPublished = !video.isPublished
  await video.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, video, 'Video publish status toggled successfully'))
})

/* REQUIRES AUTHENTICATION AND AUTHORIZATION */
// TODO CHANGE ON PRODUCTION

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const video = await Video.findById(videoId)
  if (!video) {
    throw new ApiError(404, `Video does not exist`)
  }

  /* AUTHORIZATION CHECK */

  if (!video.owner.equals(req.user._id)) {
    throw new ApiError(403, `You are not authorized to delete this video`)
  }

  // await deleteOnCloudinary(video?.thumbnail)
  // await deleteOnCloudinary(video?.videoFile, 'video')

  if (fs.existsSync(video?.thumbnail)) fs.unlinkSync(video?.thumbnail)
  if (fs.existsSync(video?.videoFile)) fs.unlinkSync(video?.videoFile)

  const videoComments = await Comment.find({ video: videoId })

  await Like.deleteMany({
    comment: { $in: videoComments },
  })
  await Dislike.deleteMany({
    comment: { $in: videoComments },
  })
  await Comment.deleteMany({ video: videoId })
  await Like.deleteMany({ video: videoId })
  await Dislike.deleteMany({ video: videoId })

  // pull out from videos array wherever this video exists in playlist

  await Playlist.updateMany(
    { videos: { $in: [videoId] } },
    {
      $pull: { videos: videoId },
    }
  )

  await User.updateMany(
    { watchHistory: { $in: [videoId] } },
    {
      $pull: { watchHistory: videoId },
    }
  )

  await Video.findByIdAndDelete(videoId)

  return res.status(200).json(new ApiResponse(200, {}, 'Video deleted successfully'))
})

/* REQUIRES AUTHENTICATION */

// TODO: Remove Comment pipeline cos we handled it in Comment controller getVideoComments cos we are using aggregate paginate there which gives us tons of features which frontend can use to handle multiple comments pages

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const existingVideo = await Video.findById(videoId)
  if (!existingVideo) {
    throw new ApiError(404, `Video does not exist`)
  }

  if (!existingVideo.isPublished) {
    throw new ApiError(403, `Video is not published yet!`)
  }

  await incrementViewCountAndUpdateWatchHistory(videoId, req.user._id)

  const videoWithPopulatedDetails = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          {
            $lookup: {
              from: 'subscriptions',
              localField: '_id',
              foreignField: 'channel',
              as: 'subscribers',
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: '$subscribers',
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
              fullName: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
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
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'video',
        as: 'likes',
      },
    },
    {
      $lookup: {
        from: 'dislikes',
        localField: '_id',
        foreignField: 'video',
        as: 'dislikes',
      },
    },
    {
      $addFields: {
        likesCount: {
          $size: '$likes',
        },
        isLiked: {
          $cond: {
            if: { $in: [req.user?._id, '$likes.owner'] },
            then: true,
            else: false,
          },
        },
        dislikesCount: {
          $size: '$dislikes',
        },
        isDisliked: {
          $cond: {
            if: { $in: [req.user?._id, '$dislikes.owner'] },
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $lookup: {
        from: 'comments',
        localField: '_id',
        foreignField: 'video',
        as: 'comments',
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
          {
            $lookup: {
              from: 'likes',
              localField: '_id',
              foreignField: 'comment',
              as: 'likes',
            },
          },
          {
            $lookup: {
              from: 'dislikes',
              localField: '_id',
              foreignField: 'comment',
              as: 'dislikes',
            },
          },
          {
            $addFields: {
              likesCount: {
                $size: '$likes',
              },
              isLiked: {
                $cond: {
                  if: { $in: [req.user?._id, '$likes.owner'] },
                  then: true,
                  else: false,
                },
              },
              dislikesCount: {
                $size: '$dislikes',
              },
              isDisliked: {
                $cond: {
                  if: { $in: [req.user?._id, '$dislikes.owner'] },
                  then: true,
                  else: false,
                },
              },
            },
          },
        ],
      },
    },
    {
      $addFields: {
        commentsCount: {
          $size: '$comments',
        },
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        owner: 1,
        title: 1,
        description: 1,
        duration: 1,
        views: 1,
        isPublished: 1,
        createdAt: 1,
        likesCount: 1,
        isLiked: 1,
        comments: 1,
        commentsCount: 1,
        dislikesCount: 1,
        isDisliked: 1,
      },
    },
  ])

  if (!videoWithPopulatedDetails.length) {
    throw new ApiError(404, `Video does not exist`)
  }

  return res.status(200).json(new ApiResponse(200, videoWithPopulatedDetails[0], 'Video fetched successfully'))
})

export { uploadVideo, getAllVideos, updateVideo, togglePublishStatus, deleteVideo, getVideoById }
