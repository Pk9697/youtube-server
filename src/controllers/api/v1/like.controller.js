import mongoose from 'mongoose'
import { Comment } from '../../../models/comment.model.js'
import { Dislike } from '../../../models/dislike.model.js'
import { Like } from '../../../models/like.model.js'
import { Tweet } from '../../../models/tweet.model.js'
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const existingVideo = await Video.findById(videoId)
  if (!existingVideo) {
    throw new ApiError(404, 'Video does not exist!')
  }

  if (!existingVideo.isPublished) {
    throw new ApiError(403, `Video is not published yet!`)
  }

  const existingLike = await Like.findOne({
    video: videoId,
    owner: req.user._id,
  })

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id)
  } else {
    await Dislike.deleteOne({ video: videoId, owner: req.user._id })
    await Like.create({
      video: videoId,
      owner: req.user._id,
    })
  }

  const videoWithLikesAndDislikesCount = await Video.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(videoId) },
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
      $project: {
        likesCount: 1,
        isLiked: 1,
        dislikesCount: 1,
        isDisliked: 1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, videoWithLikesAndDislikesCount[0], 'Video like toggled successfully!'))
})

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  const existingComment = await Comment.findById(commentId)
  if (!existingComment) {
    throw new ApiError(404, 'Comment does not exist!')
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    owner: req.user._id,
  })

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id)
  } else {
    await Dislike.deleteOne({ comment: commentId, owner: req.user._id })
    await Like.create({
      comment: commentId,
      owner: req.user._id,
    })
  }

  const commentWithLikesAndDislikesCount = await Comment.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(commentId) },
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
    {
      $project: {
        likesCount: 1,
        isLiked: 1,
        dislikesCount: 1,
        isDisliked: 1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, commentWithLikesAndDislikesCount[0], 'Comment like toggled successfully!'))
})

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  const existingTweet = await Tweet.findById(tweetId)
  if (!existingTweet) {
    throw new ApiError(404, 'Tweet does not exist!')
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    owner: req.user._id,
  })

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id)
  } else {
    await Dislike.deleteOne({ tweet: tweetId, owner: req.user._id })
    await Like.create({
      tweet: tweetId,
      owner: req.user._id,
    })
  }

  const tweetWithLikesAndDislikesCount = await Tweet.aggregate([
    {
      $match: { _id: new mongoose.Types.ObjectId(tweetId) },
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
      $project: {
        likesCount: 1,
        isLiked: 1,
        dislikesCount: 1,
        isDisliked: 1,
      },
    },
  ])

  return res
    .status(200)
    .json(new ApiResponse(200, tweetWithLikesAndDislikesCount[0], 'Tweet like toggled successfully!'))
})

// get all liked videos of current logged in user

const getLikedVideos = asyncHandler(async (req, res) => {
  const likedVideos = await Like.aggregate([
    {
      $match: {
        $and: [{ video: { $exists: true } }, { owner: req.user._id }],
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'video',
        foreignField: '_id',
        as: 'video',
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
                    fullName: 1,
                    userName: 1,
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
            $project: {
              owner: 1,
              videoFile: 1,
              thumbnail: 1,
              title: 1,
              duration: 1,
              views: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        video: {
          $arrayElemAt: ['$video', 0],
        },
      },
    },
    {
      $project: {
        video: 1,
      },
    },
  ])

  return res.status(200).json(new ApiResponse(200, likedVideos, 'Logged in user liked videos fetched successfully'))
})

export { toggleVideoLike, toggleCommentLike, toggleTweetLike, getLikedVideos }
