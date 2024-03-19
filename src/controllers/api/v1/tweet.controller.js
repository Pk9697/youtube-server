import mongoose from 'mongoose'
import { Tweet } from '../../../models/tweet.model.js'
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { Like } from '../../../models/like.model.js'
import { Dislike } from '../../../models/dislike.model.js'

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
      $lookup: {
        from: 'dislikes',
        localField: '_id',
        foreignField: 'tweet',
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
        dislikesCount: 1,
        isDisliked: 1,
        createdAt: 1,
      },
    },
  ])

  return res.status(200).json(new ApiResponse(200, tweets, 'User Tweets fetched successfully!'))
})

const updateTweet = asyncHandler(async (req, res) => {
  const { content } = req.body
  const { tweetId } = req.params

  if (!content?.trim()) {
    throw new ApiError(400, 'Content field is required!')
  }

  const existingTweet = await Tweet.findById(tweetId)
  if (!existingTweet) {
    throw new ApiError(404, 'Tweet does not exist!')
  }

  if (!existingTweet.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to update this post!')
  }

  existingTweet.content = content
  await existingTweet.save({ validateBeforeSave: false })

  return res.status(200).json(new ApiResponse(200, existingTweet, 'Tweet updated successfully!'))
})

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  const existingTweet = await Tweet.findById(tweetId)
  if (!existingTweet) {
    throw new ApiError(404, 'Tweet does not exist!')
  }

  if (!existingTweet.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to delete this post!')
  }

  await Dislike.deleteMany({ tweet: tweetId })
  await Like.deleteMany({ tweet: tweetId })
  await Tweet.findByIdAndDelete(tweetId)

  return res
    .status(200)
    .json(new ApiResponse(200, {}, 'Tweet along with associated likes and dislikes deleted successfully!'))
})

export { createTweet, getUserTweets, updateTweet, deleteTweet }
