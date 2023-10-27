/**
 * Functions related to calling the user resource in the API
 * @module userController
 */
const User = require('../models/userModel');
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

exports.changePassword = catchAsync(async (req, res, next) => {
  // get the user from the database
  const user = await User.findById(req.user._id).select('+password');

  // check if the posted current password is correct
  if (!(await user.password.correctPassword(req.body.password, user.password))) {
    return res.status(403).json({ message: "Wrong Password input, please enter your previous password" });
  }

  // update the password fields
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordChangedAt = Date.now();

  await user.save();

  // output to client
  res.status(200).json({ status: 'success', message: 'Password updated successfully' });
});

exports.deleteUser = catchAsync(async (req, res, next) => {
  const { user } = req;
  const { id } = user;

  // update the user by setting isDeleted to true and recording the deletion time
  const updatedUser = await User.findByIdAndUpdate(id, {
    isDeleted: true,
    deletedAt: Date.now(),
  });

  // Check if the user was not found
  if (!updatedUser) {
    return res.status(404).json({ message: "User not found" });
  }

  // If the user was successfully updated, you can send a success response
  res.status(200).json({ status: "success", message: "User account has been deleted", data: { user: updatedUser } });
});

exports.setRole = catchAsync(async (req, res, next) => {
  const {
    params: { id },
    body: { role },
  } = req;
  const user = await User.findById(id);

  // 1) Create Error if the requested user is an admin
  if (user.role === 'admin') {
    return res.status(403).json("You can't update the role of an admin user.");
  }
  // 2) Update the user
  const updatedUser = await User.findByIdAndUpdate(
      user.id,
      { role },
      {
        new: true,
        runValidators: true,
      }
  );

  // 3) Send the updated User
  res.status(200).json({ status: 'success', data: { user: updatedUser } });
});
