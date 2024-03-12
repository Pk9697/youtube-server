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

export { toggleSubscription }
