/**
 * Functions related to calling the user resource in the API
 * @module userController
 */
const User = require('../models/userModel');
const AppError = require('../utils/classes/AppError');
const { catchAsync } = require('../utils/utils');

exports.getAllUsers = catchAsync(
  /**
   * Function used to handle the requesting of all existing user resources.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const users = await User.find({});

    res.status(200).json({
      status: 'success',
      data: { users },
    });
  },
);

exports.deleteUser = catchAsync(
  /**
   * Function used to delete an existing user from the platform.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    //1) Get the id of the user we want to delete
    const {
      params: { id },
    } = req;

    //2) Retrieve him from the database
    const user = await User.findById(id);

    //3) check if the user wasn't found
    if (!user) {
      next(
        new AppError("The requested user doesn't exist or was deleted.", 404),
      );
      return;
    }

    // 4) check if the user is an admin
    if (user.role === 'admin') {
      next(new AppError("You can't delete an admin user.", 403));
      return;
    }

    // delete the user
    await User.findByIdAndDelete(id);

    // If the user was successfully deleted, you can send a success response
    // N.B. : it is a practice to not send any content back
    res.status(204).json({
      status: 'success',
    });
  },
);

exports.setRole = catchAsync(
  /**
   * Function used to change the role of an existing user.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      params: { id },
      body: { role },
    } = req;
    const user = await User.findById(id);

    // 1) check if the user wasn't found
    if (!user) {
      next(
        new AppError("The requested user doesn't exist or was deleted.", 404),
      );
      return;
    }

    // 2) Create Error if the requested user is an admin
    if (user.role === 'admin') {
      next(new AppError("You can't update the role of an admin user.", 403));
    }

    // 3) Update the user
    const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { role },
      {
        new: true,
        runValidators: true,
      },
    );

    // 3) Send the updated User
    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  },
);
