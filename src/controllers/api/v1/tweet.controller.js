import { Tweet } from '../../../models/tweet.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'

// TODO: create tweet
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

export { createTweet }
