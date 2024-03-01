/* eslint-disable import/prefer-default-export */
// express can't handle file upload like image,video,pdf etc so we use multer to handle file upload
// here we are also using cloudinary a separate service
// where we can upload our files which cloudinary on return sends the url of the uploaded file
// using multer we can directly upload to cloudinary but on production grade application using multer
// we temporarily store the file recieved from client in our server then upload it in cloudinary and delete
// the file stored from our server and save the received cloudinary response url of the file uploaded in db

import { v2 as cloudinary } from 'cloudinary'

// nodejs provides us fs which is file system management which helps us read,write,remove etc files

import fs from 'fs'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null
    const response = await cloudinary.uploader.upload(localFilePath, { resource_type: 'auto' })
    // console.log('File uploaded on cloudinary', response.url)
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath) // remove the locally saved temp file after cloudinary upload successful cos if there was an error on upload to cloudinary it would have been directly caught by catch block
    return response
  } catch (err) {
    if (fs.existsSync(localFilePath)) fs.unlinkSync(localFilePath) // remove the locally saved temp file when cloudinary upload failed
    return null
  }
}

const deleteOnCloudinary = async (avatarPublicId) => {
  try {
    if (!avatarPublicId) return null
    const response = await cloudinary.uploader.destroy(avatarPublicId)
    // console.log('File deleted on cloudinary', response)
    return response
  } catch (err) {
    return null
  }
}

export { uploadOnCloudinary, deleteOnCloudinary }
