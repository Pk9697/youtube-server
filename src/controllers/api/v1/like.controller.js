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

  const existingLike = await Like.findOne({ video: videoId, owner: req.user._id })

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

  const existingLike = await Like.findOne({ comment: commentId, owner: req.user._id })

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

  const existingLike = await Like.findOne({ tweet: tweetId, owner: req.user._id })

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

export { toggleVideoLike, toggleCommentLike, toggleTweetLike }
