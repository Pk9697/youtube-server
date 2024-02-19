/* eslint-disable import/prefer-default-export */
// right now when we send a response to client there is no structure provided one can easily forget what to send to client
// like success flag or message so to standardize the common structure for all responses we can define our custom classes
// now to standardize Error node js gives us error class which we can inherit to send custom error response

// Error class which we inherited expects a message parameter in its constructor so we invoke it using super and pass down
// message as argument

class ApiError extends Error {
  constructor(statusCode, message = 'Something went wrong', errors = [], stack = '') {
    super(message)
    this.statusCode = statusCode
    this.message = message
    this.errors = errors
    this.data = null
    this.success = false

    if (stack) {
      this.stack = stack
    } else {
      Error.captureStackTrace(this, this.constructor)
    }
  }
}

export { ApiError }
