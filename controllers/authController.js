/**
 * Functions used to handle the authentication in the API
 * @module authController
 */

const { catchAsync, createSendToken, sendPinCode } = require('../utils/utils');
const AppError = require('../utils/classes/AppError');
const User = require('../models/userModel');
const { CONFIRMATION_DELAY } = require('../utils/globals');
const crypto = require('crypto');
const Email = require('../utils/classes/Email');

exports.signup = catchAsync(async (req, res, next) => {
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

  await sendPinCode(newUser);

  setTimeout(async () => {
    const user = User.findById(newUser._id).select('+isConfirmed');
    if (user && !user.isConfirmed) await User.findByIdAndDelete(newUser._id);
  }, CONFIRMATION_DELAY + 1000);

  res.status(201).json({
    status: 'success',
    message: 'Please confirm with the PIN code sent to your phone number.',
  });
});

exports.confirmPin = catchAsync(async (req, res, next) => {
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
    next(new AppError('Invalid PIN Code.', 403));
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
    console.error('Error while trying to send the confirmation e-mail.');
    console.error(err);
  }

  res.status(200).json(resObject);
});

exports.signin = catchAsync(async (req, res, next) => {
  const {
    body: { username, password },
  } = req;

  if (!username || !password) {
    next(new AppError('Please provide email and password', 400));
    return;
  }

  const user = await User.findOne({ username }, null, {
    disableMiddlewares: true,
  }).select('+password');

  if (!user || !(await user.correctPassword(password, user.password))) {
    next(new AppError('Incorrect credentials.', 401));
  }

  await sendPinCode(user);

  res.status(200).json({
    status: 'success',
    message: 'Please confirm with the PIN code sent to your phone number.',
  });
});
