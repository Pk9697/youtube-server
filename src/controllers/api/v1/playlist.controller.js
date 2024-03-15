import { Playlist } from '../../../models/playlist.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'

// TODO: create playlist

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

export { createPlaylist }
