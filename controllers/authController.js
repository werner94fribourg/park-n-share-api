/**
 * Functions used to handle the authentication in the API
 * @module authController
 */
const { NextFunction, Request, Response } = require('express');
const { catchAsync, createSendToken, sendPinCode } = require('../utils/utils');
const AppError = require('../utils/classes/AppError');
const User = require('../models/userModel');
const { CONFIRMATION_DELAY } = require('../utils/globals');
const crypto = require('crypto');
const Email = require('../utils/classes/Email');

exports.signup = catchAsync(
  /**
   * Function used to handle the signup process of a guest user.
   * @param {Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {NextFunction} next The next function of the express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      body: { username, email, phone, password, passwordConfirm },
    } = req;

    const newUser = await User.create({
      username,
      email,
      phone,
      password,
      passwordConfirm,
    });

    try {
      await sendPinCode(newUser);
    } catch (err) {
      next(
        new AppError(
          'There was an error sending the pin code. Please retry or contact us at admin@parknshare.com.',
          500,
        ),
      );
      console.log(err);
      return;
    }

    setTimeout(async () => {
      const user = User.findById(newUser._id).select('+isConfirmed');
      if (user && !user.isConfirmed) await User.findByIdAndDelete(newUser._id);
    }, CONFIRMATION_DELAY + 1000);

    res.status(201).json({
      status: 'success',
      message: 'Please confirm with the PIN code sent to your phone number.',
    });
  },
);

exports.confirmPin = catchAsync(
  /**
   * Function used to handle the pin confirmation of an user in the signin / signup request.
   * @param {Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {NextFunction} next The next function of the express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      body: { username, pinCode },
    } = req;

    const cryptedPin = crypto
      .createHash('sha256')
      .update(`${pinCode}`)
      .digest('hex');

    const user = await User.findOne({
      username,
      pinCode: cryptedPin,
      pinCodeExpires: { $gt: Date.now() },
    }).select('+isConfirmed +pinCode +pinCodeExpires');

    if (!user) {
      next(new AppError('Invalid PIN Code.', 401));
      return;
    }

    const { isConfirmed } = user;

    if (!isConfirmed) user.isConfirmed = true;
    user.pinCode = undefined;
    user.pinCodeExpires = undefined;

    await user.save({ validateBeforeSave: false });
    const resObject = createSendToken(user._id);

    resObject['message'] = isConfirmed
      ? 'Welcome back!'
      : "Successful registration. Welcome to Park'N'Share!";

    try {
      if (!isConfirmed) await new Email(user).sendWelcome();
    } catch (err) {
      console.error('Error while trying to send the confirmation email.');
      console.error(err);
    }

    res.status(200).json(resObject);
  },
);

exports.signin = catchAsync(
  /**
   * Function used to handle the signin process of a user.
   * @param {Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {NextFunction} next The next function of the express framework, used to handle the next middleware function passed to the express pipeline.
   */ async (req, res, next) => {
    const {
      body: { email, password },
    } = req;

    if (!email || !password) {
      next(new AppError('Please provide email and password!', 400));
      return;
    }

    const user = await User.findOne({ email }, null, {
      disableMiddlewares: true,
    }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
      next(new AppError('Incorrect credentials.', 401));
    }

    try {
      await sendPinCode(newUser);
    } catch (err) {
      next(
        new AppError(
          'There was an error sending the pin code. Please retry or contact us at admin@parknshare.com.',
          500,
        ),
      );
      console.log(err);
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Please confirm with the PIN code sent to your phone number.',
    });
  },
);
