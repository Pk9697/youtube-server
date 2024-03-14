/* eslint-disable no-underscore-dangle */
import mongoose from 'mongoose'
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { Comment } from '../../../models/comment.model.js'

const getVideoComments = asyncHandler(async (req, res) => {
  // TODO: get all comments for a video
  const { videoId } = req.params
  const existingVideo = await Video.findById(videoId)
  if (!existingVideo) {
    throw new ApiError(404, 'Video does not exist!')
  }

  const { page = 1, limit = 10 } = req.query
  const options = {
    page,
    limit,
  }

  const aggregatePipeline = Comment.aggregate([
    {
      $match: {
        video: new mongoose.Types.ObjectId(videoId),
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
              fullName: 1,
              userName: 1,
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
        createdAt: -1,
      },
    },
    {
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
      },
    },
  ])

  const comments = await Comment.aggregatePaginate(aggregatePipeline, options)

  return res.status(200).json(new ApiResponse(200, comments, 'Comments of video fetched successfully!'))
})

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params
  const existingVideo = await Video.findById(videoId)
  if (!existingVideo) {
    throw new ApiError(404, 'Video does not exist!')
  }

  const { content } = req.body

  if (!content?.trim()) {
    throw new ApiError(400, 'Content field is required!')
  }

  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  })

  const commentWithPopulatedOwner = await Comment.aggregate([
    {
      $match: {
        _id: comment._id,
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
              fullName: 1,
              userName: 1,
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
      $project: {
        content: 1,
        owner: 1,
        createdAt: 1,
      },
    },
  ])
  if (!commentWithPopulatedOwner) {
    throw new ApiError(500, 'Owner field of comment population failed')
  }

  return res.status(201).json(new ApiResponse(200, commentWithPopulatedOwner[0], 'Comment created successfully!'))
})

export { getVideoComments, addComment }
