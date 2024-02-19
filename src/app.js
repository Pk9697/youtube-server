import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'

// get all the functionalities or properties express provides by calling it

const app = express()

// cors-> Cross-origin resource sharing to allow which clients to access this api from, * for all

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
  })
)

// data from client can be recieved in any type like json , form body , url like query params or string params
// so to parse them we configure or tell express to keep track of these files from client or
// telling express to accept json data etc and to configure this all we use middlewares using .use

// limit to avoid server crash for large json files
// previously we had to use body-parser for accepting json type , now express can parse json by default
// express.json can only parse json or form data from client

app.use(express.json({ limit: '16kb' }))

// getting data from url has some issues
// cos when data is sent to url the data having spaces is replaced by '+' or '%20' in different urls
// so url has it's own encoder which converts using its own algorithm like '%20' instead of space
// to parse data from url we need to tell express that data can come from url as well
// extended:true means clients can send nested objects through url which express will parse

app.use(express.urlencoded({ extended: true, limit: '16kb' }))

// to make a folder publically available so that anywhere one can access it
// mainly used to store pdf,image,video from client to our local server folder

app.use(express.static('public'))

// to apply CRUD operations on client's cookies for authorizing client so that they don't need to keep logging in for every
// request where authorization is needed

app.use(cookieParser())

export default app
