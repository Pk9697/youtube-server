import { Comment } from '../../../models/comment.model.js'
import { Dislike } from '../../../models/dislike.model.js'
import { Like } from '../../../models/like.model.js'
import { Tweet } from '../../../models/tweet.model.js'
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'

const toggleVideoDislike = asyncHandler(async (req, res) => {
  const { videoId } = req.params

  const existingVideo = await Video.findById(videoId)
  if (!existingVideo) {
    throw new ApiError(404, 'Video does not exist!')
  }

  if (!existingVideo.isPublished) {
    throw new ApiError(403, `Video is not published yet!`)
  }

  const existingDislike = await Dislike.findOne({
    video: videoId,
    owner: req.user._id,
  })

  if (existingDislike) {
    await Dislike.findByIdAndDelete(existingDislike._id)
  } else {
    await Like.deleteOne({ video: videoId, owner: req.user._id })
    await Dislike.create({
      video: videoId,
      owner: req.user._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Video dislike toggled successfully!'))
})

const toggleCommentDislike = asyncHandler(async (req, res) => {
  const { commentId } = req.params

  const existingComment = await Comment.findById(commentId)
  if (!existingComment) {
    throw new ApiError(404, 'Comment does not exist!')
  }

  const existingDislike = await Dislike.findOne({
    comment: commentId,
    owner: req.user._id,
  })

  if (existingDislike) {
    await Dislike.findByIdAndDelete(existingDislike._id)
  } else {
    await Like.deleteOne({ comment: commentId, owner: req.user._id })
    await Dislike.create({
      comment: commentId,
      owner: req.user._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Comment dislike toggled successfully!'))
})

const toggleTweetDislike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params

  const existingTweet = await Tweet.findById(tweetId)
  if (!existingTweet) {
    throw new ApiError(404, 'Tweet does not exist!')
  }

  const existingDislike = await Dislike.findOne({
    tweet: tweetId,
    owner: req.user._id,
  })

  if (existingDislike) {
    await Dislike.findByIdAndDelete(existingDislike._id)
  } else {
    await Like.deleteOne({ tweet: tweetId, owner: req.user._id })
    await Dislike.create({
      tweet: tweetId,
      owner: req.user._id,
    })
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Tweet dislike toggled successfully!'))
})

export { toggleVideoDislike, toggleCommentDislike, toggleTweetDislike }
