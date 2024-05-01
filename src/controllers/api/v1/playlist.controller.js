import mongoose from 'mongoose'
import { Playlist } from '../../../models/playlist.model.js'
import { User } from '../../../models/user.model.js'
import { ApiError } from '../../../utils/ApiError.js'
import { ApiResponse } from '../../../utils/ApiResponse.js'
import { asyncHandler } from '../../../utils/asyncHandler.js'
import { Video } from '../../../models/video.model.js'

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description, visibility } = req.body

  if (!name?.trim() || !description?.trim()) {
    throw new ApiError(400, 'Name and desctiption field is required!')
  }

  const playlist = await Playlist.create({
    name: name.trim(),
    description: description.trim(),
    owner: req.user._id,
    visibility,
  })

  return res.status(201).json(new ApiResponse(201, playlist, 'Playlist created successfully!'))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId, userName } = req.query

  const existingUser = await User.findOne({
    $or: [{ _id: userId }, { userName }],
  })
  if (!existingUser) {
    throw new ApiError(404, 'User does not exist!')
  }

  const playlists = await Playlist.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(existingUser._id),
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
        pipeline: [
          {
            $project: {
              avatar: 1,
              userName: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: '$owner',
        },
      },
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',
        pipeline: [
          {
            $project: {
              thumbnail: 1,
            },
          },
        ],
      },
    },
    {
      $sort: {
        updatedAt: -1,
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        createdAt: 1,
        updatedAt: 1,
        videos: 1,
        owner: 1,
        visibility: 1,
      },
    },
  ])

  // remove Liked Videos Playlist

  let filteredPlaylists = playlists.filter((playlist) => playlist.name !== 'LL')

  if (!existingUser._id.equals(req.user._id)) {
    filteredPlaylists = playlists.filter((playlist) => playlist.visibility === 'public')
  }

  return res.status(200).json(new ApiResponse(200, filteredPlaylists, 'User Playlists fetched successfully'))
})

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  const existingPlaylist = await Playlist.findById(playlistId)
  if (!existingPlaylist) {
    throw new ApiError(404, 'Playlist does not exist!')
  }

  const playlist = await Playlist.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $unwind: '$videos',
    },
    {
      $lookup: {
        from: 'videos',
        localField: 'videos',
        foreignField: '_id',
        as: 'videos',
        pipeline: [
          {
            $match: {
              isPublished: true,
            },
          },
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
                    avatar: 1,
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
              thumbnail: 1,
              owner: 1,
              title: 1,
              views: 1,
              duration: 1,
              description: 1,
              createdAt: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'owner',
        foreignField: '_id',
        as: 'owner',
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
            },
          },
          {
            $project: {
              fullName: 1,
              avatar: 1,
              subscribersCount: 1,
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
        videos: {
          $arrayElemAt: ['$videos', 0],
        },
      },
    },
    {
      $group: {
        _id: '$_id',
        name: {
          $first: '$name',
        },
        description: {
          $first: '$description',
        },
        videos: {
          $push: '$videos',
        },
        owner: {
          $first: '$owner',
        },
        createdAt: {
          $first: '$createdAt',
        },
        updatedAt: {
          $first: '$updatedAt',
        },
      },
    },
    {
      $project: {
        name: 1,
        description: 1,
        videos: 1,
        owner: 1,
        createdAt: 1,
        updatedAt: 1,
      },
    },
  ])

  return res.status(200).json(new ApiResponse(200, playlist[0], 'Playlist fetched successfully!'))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.query

  if (!playlistId?.trim() || !videoId?.trim()) {
    throw new ApiError(400, 'playlistId and videoId field is required!')
  }

  const existingPlaylist = await Playlist.findById(playlistId)
  if (!existingPlaylist) {
    throw new ApiError(404, 'Playlist does not exist!')
  }

  const existingVideo = await Video.findById(videoId).populate({
    path: 'owner',
    select: { avatar: 1, fullName: 1, userName: 1 },
  })
  if (!existingVideo) {
    throw new ApiError(404, 'Video does not exist!')
  }

  if (!existingVideo.isPublished) {
    throw new ApiError(403, `Video is not published yet!`)
  }

  if (!existingPlaylist.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to add video to this playlist!')
  }

  const filteredPlaylistVideos = await existingPlaylist.videos.filter((id) => !id.equals(videoId))

  existingPlaylist.videos = [videoId, ...filteredPlaylistVideos]
  await existingPlaylist.save({ validateBeforeSave: false, new: true })

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { playlist: existingPlaylist, video: existingVideo },
        'Added video to playlist successfully!'
      )
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.query

  if (!playlistId?.trim() || !videoId?.trim()) {
    throw new ApiError(400, 'playlistId and videoId field is required!')
  }

  const existingPlaylist = await Playlist.findById(playlistId)
  if (!existingPlaylist) {
    throw new ApiError(404, 'Playlist does not exist!')
  }

  const existingVideo = await Video.findById(videoId)
  if (!existingVideo) {
    throw new ApiError(404, 'Video does not exist!')
  }

  if (!existingPlaylist.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to remove video from this playlist!')
  }

  const filteredPlaylistVideos = await existingPlaylist.videos.filter((id) => !id.equals(videoId))
  existingPlaylist.videos = filteredPlaylistVideos
  await existingPlaylist.save({ validateBeforeSave: false, new: true })

  return res.status(200).json(new ApiResponse(200, existingPlaylist, 'Removed video from playlist successfully!'))
})

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params

  const existingPlaylist = await Playlist.findById(playlistId)
  if (!existingPlaylist) {
    throw new ApiError(404, 'Playlist does not exist!')
  }

  if (!existingPlaylist.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to delete this playlist!')
  }

  await Playlist.findByIdAndDelete(playlistId)

  return res.status(200).json(new ApiResponse(200, {}, 'Playlist deleted successfully!'))
})

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params
  const { name, description, visibility } = req.body

  if (!name?.trim() && !description?.trim()) {
    throw new ApiError(400, 'name or description field is required!')
  }

  const existingPlaylist = await Playlist.findById(playlistId)
  if (!existingPlaylist) {
    throw new ApiError(404, 'Playlist does not exist!')
  }

  if (existingPlaylist.name === 'WL') {
    throw new ApiError(403, 'Watch Later playlist cannot be updated!')
  }

  if (!existingPlaylist.owner.equals(req.user._id)) {
    throw new ApiError(403, 'You are not authorized to update this playlist!')
  }

  if (name?.trim()) {
    existingPlaylist.name = name.trim()
  }

  if (description?.trim()) {
    existingPlaylist.description = description.trim()
  }

  if (visibility?.trim()) {
    existingPlaylist.visibility = visibility.trim()
  }

  await existingPlaylist.save({ validateBeforeSave: false, new: true })

  return res.status(200).json(new ApiResponse(200, existingPlaylist, 'Playlist Updated successfully!'))
})

const getLoggedInUserPlaylistIdByName = asyncHandler(async (req, res) => {
  const { playlistName: name } = req.params
  if (!name?.trim()) {
    throw new ApiError(400, 'PlaylistName field is required!')
  }
  const playlist = await Playlist.findOne({ name, owner: req.user._id })
  if (!playlist) {
    throw new ApiError(404, 'Playlist does not exist!')
  }
  return res.status(200).json(new ApiResponse(200, playlist._id, 'Playlist fetched successfully!'))
})

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
  getLoggedInUserPlaylistIdByName,
}
