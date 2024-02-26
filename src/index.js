import dotenv from 'dotenv'
import connectDb from './db/index.js'
import app from './app.js'

dotenv.config({
  path: './.env',
})

// variable PORT from .env is assigned automatically according to free port which will be useful
// when deploying as our required port is not always available when deploying
// to use specific port save diff port name in .env like YOUTUBE_PORT instead of PORT

const PORT = process.env.YOUTUBE_PORT || 8000

// connectDb is an async method so it returns a promise once it completes its execution when called
// so with promise we can use .then when promise resolves and .catch when rejects

connectDb()
  .then(() => {
    app.listen(PORT, (err) => {
      if (err) {
        console.error(`Error in running server : ${err}`)
        process.exit(1)
      }
      console.log(`Server is running on PORT ${PORT}`)
    })
  })
  .catch((err) => console.error('MongoDB connection failed !!!', err))
