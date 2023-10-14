/**
 * Functions related to calling the user resource in the API
 * @module userController
 */
const { Request, Response, NextFunction } = require('express');
const User = require('../models/userModel');
const { catchAsync } = require('../utils/utils');

exports.getAllUsers = catchAsync(
  /**
   * Function used to handle the requesting of all existing user resources.
   * @param {Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {NextFunction} next The next function of the express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const users = await User.find({});

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  },
);
