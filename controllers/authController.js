/**
 * Functions used to handle the authentication in the API
 * @module authController
 */
const { NextFunction, Request, Response } = require('express');
const { catchAsync, createSendToken, sendPinCode } = require('../utils/utils');
const AppError = require('../utils/classes/AppError');
const User = require('../models/userModel');
const { CONFIRMATION_DELAY, FRONT_END_URL } = require('../utils/globals');
const crypto = require('crypto');
const Email = require('../utils/classes/Email');
const jwt = require('jsonwebtoken');
const { promisify } = require('util');

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
      console.error(err);
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
    // Create jwt token and authenticate the user if he correctly signed in/up
    const { resObject, cookieOptions } = createSendToken(req, user._id);

    resObject['message'] = isConfirmed
      ? 'Welcome back!'
      : "Successful registration. Welcome to Park'N'Share!";

    try {
      if (!isConfirmed) await new Email(user).sendWelcome();
    } catch (err) {
      console.error('Error while trying to send the confirmation email.');
      console.error(err);
    }

    // send the token as a httpOnly cookie
    res.cookie('jwt', resObject.token, cookieOptions);

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
    }).select('+password +isConfirmed');

    if (
      !user ||
      !user?.isConfirmed ||
      !(await user.correctPassword(password, user.password))
    ) {
      next(new AppError('Incorrect credentials.', 401));
    }

    try {
      await sendPinCode(user);
    } catch (err) {
      next(
        new AppError(
          'There was an error sending the pin code. Please retry or contact us at admin@parknshare.com.',
          500,
        ),
      );
      console.error(err);
      return;
    }

    res.status(200).json({
      status: 'success',
      message: 'Please confirm with the PIN code sent to your phone number.',
    });
  },
);

exports.protect = catchAsync(async (req, _, next) => {
  // 1) Get the token from the header / cookie and check if it exists
  const {
    headers: { authorization },
    cookies: { jwt: cookieToken },
  } = req;

  const {
    env: { JWT_SECRET },
  } = process;

  let token = '';

  if (authorization && authorization.startsWith('Bearer'))
    token = authorization.split(' ')[1];
  else if (cookieToken) token = cookieToken;

  if (!token) {
    next(
      new AppError(
        'You are not logged in! Please log in to get access to this route.',
        401,
      ),
    );

    return;
  }

  // 2) Verify the token : errors that can be thrown in the process and catched by catchAsync
  //  JSONWebTokenError : invalid token
  //  TokenExpiredError : the token has expired
  const decoded = await promisify(jwt.verify)(token, JWT_SECRET);

  // 3) Check if the user still exists
  const currentUser = await User.findById(decoded.id).select(
    '+passwordChangedAt +isConfirmed +isEmailConfirmed',
  );

  if (!currentUser) {
    next(
      new AppError("The requested account doesn't exist or was deleted.", 401),
    );
    return;
  }

  // TODO:4) Check if the user has changed password after the token was issued

  //Access the logged user to be used in the next middleware function
  req.user = currentUser;

  next();
});

exports.sendConfirmationEmail = catchAsync(async (req, res, next) => {
  const { user } = req;

  const confirmEmailToken = user.createConfirmEmailToken();

  await user.save({ validateBeforeSave: false });

  if (user.isEmailConfirmed) {
    next(new AppError('Your email address was already confirmed.', 403));
    return;
  }

  try {
    const url = `${FRONT_END_URL}/confirm-email/${confirmEmailToken}`;
    await new Email(user, url).sendEmailConfirmation();
  } catch (err) {
    user.confirmEmailToken = undefined;
    user.confirmEmailExpires = undefined;
    await user.save({ validateBeforeSave: false });
    next(
      new AppError(
        'There was an error sending the confirmation email. Please contact us at admin@parknshare.com!',
        500,
      ),
    );

    console.error(err);
  }

  res.status(200).json({
    status: 'success',
    message: 'Confirmation email successfully sent to your address.',
  });
});

exports.confirmEmail = catchAsync(async (req, res, next) => {
  const {
    params: { confToken },
  } = req;

  const confirmEmailToken = crypto
    .createHash('sha256')
    .update(confToken)
    .digest('hex');

  const user = await User.findOne({
    confirmEmailToken,
    confirmEmailExpires: { $gt: Date.now() },
  });

  if (!user) {
    next(new AppError('Invalid link!', 404));
    return;
  }

  user.isEmailConfirmed = true;
  user.confirmEmailToken = undefined;
  user.confirmEmailExpires = undefined;

  user.save({ validateBeforeSave: false });

  res.status(200).json({
    status: 'success',
    message: 'Email address successfully confirmed.',
  });
});
