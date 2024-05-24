/* eslint-disable import/prefer-default-export */

import { emptyFolder } from './emptyFolder.js'

// asyncHandler will be our wrapper to avoid try catch block which we will have to write inside every controller
// this fxn will accept fxn as a parameter and will return a fxn on executing so it is a higher order fxn
// a higher order fxn is a fxn which accepts or returns a fxn

// this fxn will receive req,res,next when called via controller which express provides
// which we will pass down to the fxn we are receiving as parameters

const asyncHandler = (requestHandler) => async (req, res, next) => {
  try {
    return await requestHandler(req, res, next)
  } catch (err) {
    console.error(err)
    emptyFolder('./public/temp')
    return res.status(err.statusCode || 500).json({
      success: false,
      message: err.message,
    })
  }
}

export { asyncHandler }

/*

// to understand without arrow fxn our asyncHandler would look like this

function asyncHandler2(requestHandler) {
  return async function (req, res, next) {
    try {
      await requestHandler(req, res, next)
    } catch (err) {
      res.status(err.code || 500).json({
        success: false,
        message: err.message,
      })
    }
  }
}

// using promises

const asyncHandler3 = (requestHandler) => {
  return (req, res, next) => {
    return Promise.resolve(requestHandler(req, res, next)).reject((err) => next(err))
  }
}

*/
