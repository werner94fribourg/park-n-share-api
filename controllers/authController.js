/**
 * Functions used to handle the authentication in the API
 * @module authController
 */

const { catchAsync, createSendToken } = require('../utils/utils');
const AppError = require('../utils/classes/AppError');
const User = require('../models/userModel');

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

    //TODO: add sms confirmation

    res.status(201).json({
        status: 'success',
        message: 'Please confirm your PIN code sent to your phone number.',
    });
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

    const resObject = createSendToken(user._id);

    //TODO: add sms confirmation

    res.status(200).json(resObject);
});