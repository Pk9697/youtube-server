/* eslint-disable import/prefer-default-export */
// to standardize responses to client except server error
// we create this class which will create a structure which would be passed down to client

class ApiResponse {
  constructor(statusCode, data, message = 'Success') {
    this.statusCode = statusCode
    this.data = data
    this.message = message
    this.success = statusCode < 400
  }
}

export { ApiResponse }
