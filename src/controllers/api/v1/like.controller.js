import { Comment } from '../../../models/comment.model.js'
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

  const existingLike = await Like.findOne({
    video: videoId,
    owner: req.user._id,
  })

  if (existingLike) {
    await Like.findByIdAndDelete(existingLike._id)
  } else {
    await Like.create({
      video: videoId,
      owner: req.user._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Video like toggled successfully!'))
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
    await Like.create({
      comment: commentId,
      owner: req.user._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Comment like toggled successfully!'))
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
    await Like.create({
      tweet: tweetId,
      owner: req.user._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Tweet like toggled successfully!'))
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
