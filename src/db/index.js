import mongoose from 'mongoose'
import { DB_NAME } from '../constants.js'

// Assume DB is always in another continent that is why
// use async await cos it will take time to connect

// throwing error also exits current process using 'throw err'
// but nodejs gives access of process which we can use anywhere without importing
// and process is the reference of where our current application is running on some process
// so we can use 'process.exit()' to exit current process where our application is running
// using diff codes 0 for successful exit and 1 for failure exit

// mongoose.connect returns an object which we can call connectionInstance which includes many properties ,
// through which we can know about our connection with db

// console logging 'connectionInstance.connection.host' to check where our MongoDB is connected,
// on development or production server

const connectDb = async () => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
    console.log(`MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`)
  } catch (err) {
    console.error('MongoDB connection error', err)
    process.exit(1)
  }
}

export default connectDb
