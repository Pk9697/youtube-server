import { Subscription } from '../../../models/subscription.model.js'
import { Video } from '../../../models/video.model.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'

// Get the channel stats like total videos views, total subscribers, total videos likes etc.

const getChannelStats = asyncHandler(async (req, res) => {
  const videos = await Video.aggregate([
    {
      $match: {
        $and: [{ owner: req.user._id }, { isPublished: true }],
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
      $addFields: {
        likesCount: {
          $size: '$likes',
        },
      },
    },
    {
      $group: {
        _id: null,
        totalViews: {
          $sum: '$views',
        },
        totalLikes: {
          $sum: '$likesCount',
        },
      },
    },
    {
      $project: {
        _id: 0,
        totalViews: 1,
        totalLikes: 1,
      },
    },
  ])

  const subscribers = await Subscription.aggregate([
    {
      $match: {
        channel: req.user._id,
      },
    },
    {
      $count: 'totalSubscribers',
    },
  ])

  const totalVideosViews = videos?.length ? videos[0].totalViews : 0
  const totalVideosLikes = videos?.length ? videos[0].totalLikes : 0
  const totalSubscribers = subscribers?.length ? subscribers[0].totalSubscribers : 0

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { totalVideosViews, totalSubscribers, totalVideosLikes },
        'Channel Stats fetched successfully!'
      )
    )
})

export { getChannelStats }
