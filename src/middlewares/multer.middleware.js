/* eslint-disable import/prefer-default-export */
/* eslint-disable func-names */
/* eslint-disable object-shorthand */
// to understand mw rem this saying 'jate wakt mujhse milke jana' which means that
// when client hits route and is going to a particular controller then in middle mw has access to read the client requests send responses directly from here or can forward the request to controller if mw allows
// it's used when suppose client is making a request to delete a post so mw can check in middle whether the client is the authorized user of that post or not,
// if yes forward it to the specific controller or reject the request and send failed response back to client

// here we are using multer to create mw, but we can use it directly without creating multer as mw
// but we will need file upload capabilities in multiple places/routes which we can easily inject using multer as mw in those places

// Multer adds a body object and a file or files object to the request object.
// The body object contains the values of the text fields of the form,
// the file or files object contains the files uploaded via the form.

import multer from 'multer'

// config multer

// here we get access of req object consisting of json/form data from client , any file sent via client and cb is just a callback
// which needs to be called where 1st argument is for error pass if any and 2nd depends ,on dest property
// it's the destination where you want to store this file and in filename prop 2nd arg is to assign a name of this file

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/temp')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`
    cb(null, `${file.fieldname}-${uniqueSuffix}`)
  },
})

export const upload = multer({ storage })
