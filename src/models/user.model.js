/* eslint-disable no-underscore-dangle */
/* eslint-disable import/prefer-default-export */
// file named as user.model.js for personal convention, as it is a standard practice

// if we want to make any field searchable in an optimized way then add index:true property to that field,
// doing this yes it makes db operation expensive but if you know that this field is going to be used more often for searching
// then include this property so that this field is present in db searching

// password type is always taken as String cos it's preferred or standard practice
// to put encrypted passwords on db cos of db leak issues

import mongoose, { Schema } from 'mongoose'

// hash passwords using bcrypt

import bcrypt from 'bcrypt'

// jwt is a bearer token, which means whoever holds/bears this jwt token is verified and can receive data from server
// so it's like a key
// send payload to client in an encrypted way which will be stored in client's cookies
// which will be used to authorize user for any request which requires authorization
// so that user need not login again and again

import jwt from 'jsonwebtoken'

const userSchema = new Schema(
  {
    userName: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    avatar: {
      type: String, // uploaded file url from cloudinary (uploaded file in cloudinary provides url of the file)
      required: true,
    },
    coverImage: {
      type: String, // uploaded file url from cloudinary
    },
    watchHistory: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Video',
      },
    ],
    password: {
      type: String,
      required: [true, 'Password is required'],
    },
    refreshToken: {
      type: String,
    },
  },
  { timestamps: true }
)

// pre hook is a middleware provided by mongoose which executes before saving in db
// on save event execute callback fxn which should not be a arrow fxn cos we require current context using this
// to access password
// it's a mw so next is provided which should be called after completing fxn so that it gets passed to next process

// now this pre hook will run everytime user is updated even if password is not , like uploading avatar or coverImage separately
// will also hash password again and again , and we want to update password only the first time or while updating password
// so we get access to check whether a particular field is updated or not using 'this.isModified(<fieldname>)'

userSchema.pre('save', async function cb(next) {
  if (!this.isModified('password')) return next()
  this.password = await bcrypt.hash(this.password, 10)
  return next()
})

// can inject custom methods userSchema methods object
// since bcrypt hashed our password so it can also decrypt hashed password and can compare
// with the password sent from client to verify whether correct password is sent from client to login or not

userSchema.methods.isPasswordCorrect = async function fn(password) {
  const result = await bcrypt.compare(password, this.password)
  return result
}

// jwt.sign fxn requires payload which you want to send to client,secret key and token expiry

userSchema.methods.generateAccessToken = async function fn() {
  return jwt.sign(
    {
      _id: this._id,
      email: this.email,
      userName: this.userName,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY,
    }
  )
}

// refresh token consists of less payload,
// cos refresh token as name implies gets refreshed multiple times so we only keep id inside payload

userSchema.methods.generateRefreshToken = async function fn() {
  return jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
    }
  )
}

// telling mongoose to create a model named User by referring to userSchema,
// which mongodb stores as Users in plural form in db

export const User = mongoose.model('User', userSchema)
