import mongoose from 'mongoose'
import { Comment } from '../../../models/comment.model.js'
import { Dislike } from '../../../models/dislike.model.js'
import { Like } from '../../../models/like.model.js'
import { Tweet } from '../../../models/tweet.model.js'
import { Video } from '../../../models/video.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { Playlist } from '../../../models/playlist.model.js'

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

  const likedVideosPlaylist = await Playlist.findOne({ name: 'LL', owner: req.user._id })

  if (existingDislike) {
    await Dislike.findByIdAndDelete(existingDislike._id)
  } else {
    await Like.deleteOne({ video: videoId, owner: req.user._id })
    await Dislike.create({
      video: videoId,
      owner: req.user._id,
    })
    if (likedVideosPlaylist) {
      const filteredPlaylistVideos = await likedVideosPlaylist?.videos.filter((id) => !id.equals(videoId))
      likedVideosPlaylist.videos = filteredPlaylistVideos
      await likedVideosPlaylist.save({ validateBeforeSave: false })
    }
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
    .json(new ApiResponse(200, videoWithLikesAndDislikesCount[0], 'Video dislike toggled successfully!'))
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
    .json(new ApiResponse(200, commentWithLikesAndDislikesCount[0], 'Comment dislike toggled successfully!'))
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
    .json(new ApiResponse(200, tweetWithLikesAndDislikesCount[0], 'Tweet dislike toggled successfully!'))
})

export { toggleVideoDislike, toggleCommentDislike, toggleTweetDislike }
