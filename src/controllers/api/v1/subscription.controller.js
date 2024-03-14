/* eslint-disable no-underscore-dangle */
import mongoose from 'mongoose'
import { Subscription } from '../../../models/subscription.model.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params

  const existingChannel = await User.findById(channelId)
  if (!existingChannel) {
    throw new ApiError(404, 'Channel does not exist!')
  }

  const subscription = await Subscription.findOne({
    $and: [
      {
        channel: new mongoose.Types.ObjectId(channelId),
      },
      {
        subscriber: req.user._id,
      },
    ],
  })

  if (!subscription) {
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    })
  } else {
    await Subscription.findByIdAndDelete(subscription._id)
  }

  return res.status(200).json(new ApiResponse(200, {}, 'Subscription toggled successfully!'))
})

// controller to return channel list to which user has subscribed

const getUserSubscribedToChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params

  const existingSubscriber = await User.findById(subscriberId)
  if (!existingSubscriber) {
    throw new ApiError(404, 'Subscriber does not exist!')
  }

  const channels = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'channel',
        foreignField: '_id',
        as: 'channel',
        pipeline: [
          {
            $lookup: {
              from: 'subscriptions',
              localField: '_id',
              foreignField: 'channel',
              as: 'subscribers',
            },
          },
          {
            $addFields: {
              subscribersCount: {
                $size: '$subscribers',
              },
              isSubscribed: {
                $cond: {
                  if: { $in: [req.user?._id, '$subscribers.subscriber'] },
                  then: true,
                  else: false,
                },
              },
            },
          },
          {
            $project: {
              fullName: 1,
              avatar: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        channel: {
          $first: '$channel',
        },
      },
    },
    {
      $project: {
        channel: 1,
      },
    },
  ])

  return res.status(200).json(new ApiResponse(200, channels, 'User Subscribed to Channels fetched successfully'))
})

export { toggleSubscription, getUserSubscribedToChannels }
