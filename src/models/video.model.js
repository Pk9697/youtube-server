/* eslint-disable import/prefer-default-export */
import mongoose, { Schema } from 'mongoose'

// mongoose-aggregate-paginate-v2 package allows us to write aggregation queries
// till now we are only familiar with with normal mongoDb queries like insertMany , updateMany  etc
// but true power of mongoDB which developers use in production is achieved by aggregation queries which this package provides to do complex queries
// search mongodb aggregation pipeline for more details

import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2'

const videoSchema = new Schema(
  {
    videoFile: {
      type: String, // uploaded file url from cloudinary
      required: true,
    },
    thumbnail: {
      type: String, // uploaded file url from cloudinary
      required: true,
    },
    owner: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    duration: {
      type: Number, // uploaded file duration from cloudinary (when file is uploaded on cloudinary , then it sends file info like url,duration etc)
      required: true,
    },
    views: {
      type: Number,
      default: 0,
    },
    isPublished: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// mongoose provides various middlewares like pre (do something just b4 saving),
// post(do something just after saving)
// also can inject our own plugins
// Refer mongoose middleware docs in bookmarks

// Now we can use aggregation queries in controllers ,
// cos we have attached mongooseAggregatePaginate plugin to videoSchema

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)
