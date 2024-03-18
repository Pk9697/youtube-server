import mongoose from 'mongoose'
import { Tweet } from '../../../models/tweet.model.js'
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body

  if (!content?.trim()) {
    throw new ApiError(400, 'Content field is required!')
  }

  const tweet = await Tweet.create({
    content: content.trim(),
    owner: req.user._id,
  })

  return res.status(200).json(new ApiResponse(200, tweet, 'Tweet created successfully!'))
})

const getUserTweets = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const existingUser = await User.findById(userId)
  if (!existingUser) {
    throw new ApiError(404, 'User does not exist')
  }

  const tweets = await Tweet.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
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
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'likes',
        localField: '_id',
        foreignField: 'tweet',
        as: 'likes',
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
      },
    },
    {
      $sort: {
        createdAt: -1,
      },
    },
    {
      $project: {
        owner: 1,
        content: 1,
        likesCount: 1,
        isLiked: 1,
        createdAt: 1,
      },
    },
  ])

  return res.status(200).json(new ApiResponse(200, tweets, 'User Tweets fetched successfully!'))
})

export { createTweet, getUserTweets }
