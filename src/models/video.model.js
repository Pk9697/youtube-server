/* eslint-disable import/prefer-default-export */
import mongoose, { Schema } from 'mongoose'

// mongoose-aggregate-paginate-v2 package allows us to write aggregation paginate queries
// it's used to limit files which would be sent to client ,
// here there can be many videos in our server so to reduce load we limit these files
//  sending only in batches according to what client requires like 10 files at a time
// so we use this package in models like video,post,comments etc

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

// Now we can use aggregation paginate queries in controllers ,
// cos we have attached mongooseAggregatePaginate plugin to videoSchema

videoSchema.plugin(mongooseAggregatePaginate)

export const Video = mongoose.model('Video', videoSchema)
