/* eslint-disable no-underscore-dangle */
import mongoose from 'mongoose'
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { Comment } from '../../../models/comment.model.js'
import { Like } from '../../../models/like.model.js'

const getVideoComments = asyncHandler(async (req, res) => {
  const { videoId } = req.params
  const existingVideo = await Video.findById(videoId)
  if (!existingVideo) {
    throw new ApiError(404, 'Video does not exist!')
  }
  if (!existingVideo.isPublished) {
    throw new ApiError(403, `Video is not published yet!`)
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
    content: content?.trim(),
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

/* REQUIRES AUTHORIZATION */

const updateComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params
  const { content } = req.body

  const existingComment = await Comment.findById(commentId)
  if (!existingComment) {
    throw new ApiError(404, 'Comment does not exist!')
  }

  if (!existingComment.owner.equals(req.user._id)) {
    throw new ApiError(403, `You are not authorized to delete this video`)
  }

  if (!content?.trim()) {
    throw new ApiError(400, 'Content field is required!')
  }

  const comment = await Comment.findByIdAndUpdate(
    commentId,
    {
      content: content?.trim(),
    },
    { new: true }
  )

  return res.status(200).json(new ApiResponse(200, comment, 'Comment updated successfully!'))
})

/* REQUIRES AUTHORIZATION */

const deleteComment = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  const existingComment = await Comment.findById(commentId)
  if (!existingComment) {
    throw new ApiError(404, 'Comment does not exist!')
  }

  if (!existingComment.owner.equals(req.user._id)) {
    throw new ApiError(403, `You are not authorized to delete this video`)
  }
  // TODO: Test Likes deletion
  await Like.deleteMany({ comment: commentId })
  await Comment.findByIdAndDelete(commentId)

  return res.status(200).json(new ApiResponse(200, {}, 'Comment along with associated likes deleted successfully'))
})

export { getVideoComments, addComment, updateComment, deleteComment }
