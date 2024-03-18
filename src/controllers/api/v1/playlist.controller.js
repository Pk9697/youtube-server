import mongoose from 'mongoose'
import { Playlist } from '../../../models/playlist.model.js'
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, 'Name and desctiption field is required!')
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
  })

  return res.status(201).json(new ApiResponse(201, playlist, 'Playlist created successfully!'))
})

// TODO: get user playlists

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params

  const existingUser = await User.findById(userId)
  if (!existingUser) {
    throw new ApiError(404, 'User does not exist!')
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        videos: 1,
      },
    },
  ])

  return res.status(200).json(new ApiResponse(200, playlists, 'User Playlists fetched successfully'))
})

export { createPlaylist, getUserPlaylists }
