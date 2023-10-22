/**
 * Functions used to handle the authentication in the API
 * @module authController
 */

const { Request, Response, NextFunction } = require('express');
const User = require('../models/userModel');
const { catchAsync, createSendToken } = require('../utils/utils');
const crypto = require('crypto');
const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const AppError = require('../utils/classes/AppError');
// const Email = require('../utils/classes/Email');
const {
    API_ROUTE,
    TIMEOUTS,
    PASSWORD_VALIDATOR,
    FRONT_END_URL,
} = require('../utils/globals');


exports.signup = catchAsync(async (req, res, next) => {
    const {
        body: {
            username,
            email,
            role,
            password,
            passwordConfirm,
        },
    } = req;

    if (role === 'admin') {
        next(
            new AppError('You cannot create an admin user using this route.', 403)
        );
        return;
    }

    const newUser = await User.create({
        username,
        email,
        role: role ? role : 'student',
        password,
        passwordConfirm,
    });

    const confirmToken = newUser.createConfirmToken();

    await newUser.save({ validateBeforeSave: false });

    try {
        const url = `${FRONT_END_URL}/confirm/${confirmToken}`;

        await new Email(newUser, url).sendWelcome();

        TIMEOUTS[newUser._id.valueOf()] = setTimeout(async () => {
            const id = newUser._id.valueOf();
            console.log(`Delete user ${id} : Confirmation time expired.`);
            await Message.deleteMany({$or: [{sender: id}, {receiver: id}]});
            await Event.deleteMany({organizer: id});

            const participatingEvents = await Event.find({
                $or: [{guests: id}, {attendees: id}],
            });

            await Promise.all(
                participatingEvents.map(
                    event =>
                        async function () {
                            const {_id: eventId, attendees, guests} = event;
                            const newAttendees = attendees.reduce((acc, attendee) => {
                                if (attendee.valueOf() !== id) acc.push(attendee.valueOf());
                                return acc;
                            }, []);
                            const newGuests = guests.reduce((acc, guest) => {
                                if (guest.valueOf() !== id) acc.push(guest.valueOf());
                                return acc;
                            }, []);

                            await Event.findByIdAndUpdate(eventId, {
                                attendees: newAttendees,
                                guests: newGuests,
                            });
                        }
                )
            );

            await Task.deleteMany({performer: id});

            const validatedTasks = await Task.find({validator: id});

            await Promise.all(
                validatedTasks.map(
                    task =>
                        async function () {
                            task.validator = undefined;
                            await task.save();
                        }
                )
            );

            await TeachingDemand.deleteMany({
                $or: [{sender: id}, {receiver: id}],
            });

            const supervisedStudents = await User.find({supervisor: id});

            await Promise.all(
                supervisedStudents.map(
                    student =>
                        async function () {
                            student.supervisor = undefined;
                            await student.save();
                        }
                )
            );

            const contacts = await User.find({contacts: id});

            await Promise.all(
                contacts.map(
                    contact =>
                        async function () {
                            contact.contacts = contact.contacts.reduce((acc, contact) => {
                                if (contact.valueOf() !== id) acc.push(contact.valueOf());
                                return acc;
                            }, []);

                            await contact.save();
                        }
                )
            );

            await User.findByIdAndDelete(id);
            TIMEOUTS[id] = undefined;
            await new Email(newUser, '').sendConfirmationDelete();
        }, 10 * 24 * 60 * 60 * 1000);

        res.status(201).json({
            status: 'success',
            message:
                'Successful registration.\nPlease confirm your e-mail address by accessing the link we sent in your inbox before 10 days.',
        });
    } catch (err) {
        newUser.confirmationToken = undefined;
        newUser.confirmationExpires = undefined;
        await newUser.save({ validateBeforeSave: false });
        next(
            new AppError(
                'There was an error sending the confirmation email. Please contact us at admin@learn-at-home.com!',
                500
            )
        );
    }
});

exports.confirmRegistration = catchAsync(async (req, res, next) => {
    const {
        params: { confToken },
    } = req;

    const confirmationToken = crypto
        .createHash('sha256')
        .update(confToken)
        .digest('hex');

    const user = await User.findOne({
        confirmationToken,
        confirmationExpires: { $gt: Date.now() },
    });

    if (!user) {
        next(new AppError('Invalid link !', 404));
        return;
    }
    const timeout = TIMEOUTS[user._id.valueOf()];

    if (timeout) {
        clearTimeout(timeout);
        TIMEOUTS[user._id.valueOf()] = undefined;
    }

    user.isConfirmed = true;
    user.confirmationToken = undefined;
    user.confirmationExpires = undefined;

    await user.save({ validateBeforeSave: false });

    createSendToken(user, 200, req, res);
});

exports.checkPassword = catchAsync(async (req, res) => {
    const {
        body: { password },
    } = req;
    PASSWORD_VALIDATOR;
    const validationValues = PASSWORD_VALIDATOR.validate(password, {
        details: true,
    });

    res.status(200).json({
        status: 'success',
        data: {
            validations: validationValues,
        },
    });
});

exports.login = catchAsync(async (req, res, next) => {
    const {
        body: { email, username, password },
    } = req;

    // Check if email/username and password exists
    if ((!email && !username) || !password) {
        next(new AppError('Please provide email and password!', 400));
        return;
    }

    const reqObject = { email, username };

    delete reqObject[!email ? 'email' : 'username'];

    // Check if the user exists && password is correct
    const user = await User.findOne(reqObject, null, {
        disableMiddlewares: true,
    }).select('+password +isConfirmed +isDeleted');

    if (!user || !(await user.correctPassword(password, user.password))) {
        next(new AppError('Incorrect credentials.', 401));
        return;
    }

    if (!user.isConfirmed) {
        next(
            new AppError(
                'Please confirm your e-mail address (link sent by e-mail).',
                403
            )
        );
        return;
    }

    const deletedStatus = user.isDeleted;
    let message = '';
    if (deletedStatus) {
        user.isDeleted = false;
        user.deletedAt = undefined;
        const timeout = TIMEOUTS[user._id.valueOf()];
        clearTimeout(timeout);
        TIMEOUTS[user._id.valueOf()] = undefined;
        await user.save({ validateBeforeSave: false });
        message = 'Happy to see you back';
    }

    // If everything is ok, send token to client
    createSendToken(user, 200, req, res, message);
});

exports.forgotPassword = catchAsync(async (req, res, next) => {
    const {
        body: { email },
    } = req;

    const user = await User.findOne({ email });

    if (!user) {
        res
            .status(200)
            .json({ status: 'success', message: 'Reset link sent to email!' });
        return;
    }

    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });
    try {
        const url = `${FRONT_END_URL}/reset-password/${resetToken}`;

        await new Email(user, url).sendPasswordReset();

        res
            .status(200)
            .json({ status: 'success', message: 'Reset link sent to email!' });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        next(
            new AppError('There was an error sending the email. Try Again !', 500)
        );
    }
});

exports.isResetLinkValid = catchAsync(async (req, res, next) => {
    const {
        params: { resetToken },
    } = req;

    const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    res.status(200).json({
        status: 'success',
        data: {
            valid: user,
        },
    });
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    const {
        params: { resetToken },
        body: { password, passwordConfirm },
    } = req;

    const passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    const user = await User.findOne({
        passwordResetToken,
        passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
        next(new AppError('Token is invalid or has expired.', 400));
        return;
    }

    user.password = password;
    user.passwordConfirm = passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    createSendToken(user, 200, req, res, 'Password successfully changed !');
});

exports.updatePassword = catchAsync(async (req, res, next) => {
    const {
        body: { passwordCurrent, password, passwordConfirm },
        user: { _id: id },
    } = req;

    // 1) Get the user from the collection by selecting the password
    const user = await User.findById(id).select('+password');

    // 2) Check if the posted password is correct
    if (!(await user.correctPassword(passwordCurrent, user.password))) {
        next(new AppError('Your current password is wrong.', 401));
        return;
    }

    // 3) Update the password
    user.password = password;
    user.passwordConfirm = passwordConfirm;
    await user.save();

    createSendToken(user, 200, req, res);
});

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
            new AppError('You are not logged in! Please log in to get access.', 401)
        );
        return;
    }

    // 2) Verify the token
    //  JSONWebTokenError : invalid token
    //  TokenExpiredError : the token has expired
    const decoded = await promisify(jwt.verify)(token, JWT_SECRET);

    // 3) Check if the user still exists
    const currentUser = await User.findById(decoded.id).select(
        '+passwordChangedAt +supervisor +supervised'
    );

    if (!currentUser) {
        next(
            new AppError("The requested account doesn't exist or was deleted.", 401)
        );
        return;
    }

    // 4) Check if the user has changed password after the token was issued
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        next(
            new AppError('User recently changed password ! Please log in again.', 401)
        );
        return;
    }

    // Access the logged user to be used in a next middleware
    req.user = currentUser;

    next();
});

exports.restrictTo =
    (...roles) =>
        (req, _res, next) => {
            const {
                user: { role },
            } = req;
            if (!roles.includes(role)) {
                next(
                    new AppError("You don't have permission to perform this action.", 403)
                );
                return;
            }

            next();
        };

exports.restrictUpdatePassword = (req, res, next) => {
    const {
        body: { password, passwordConfirm },
    } = req;
    if (password || passwordConfirm) {
        next(
            new AppError(
                'Use the reset password mechanisms to update the password.',
                400
            )
        );
        return;
    }

    next();
};

exports.restrictUpdateRole = (req, res, next) => {
    const {
        body: { role },
    } = req;

    if (role) {
        next(new AppError('Use the /set-role route to update the role.', 400));
        return;
    }

    next();
};

exports.restrictUpdateTestsAccount = catchAsync(async (req, res, next) => {
    let { document: user } = req;

    if (!user) user = req.user;

    if (user.username === 'student' || user.username === 'teacher') {
        next(new AppError("You can't update the test accounts.", 403));
        return;
    }

    next();
});

exports.checkOtherUser = catchAsync(async (req, res, next) => {
    const {
        params: { userId },
        user: { id },
    } = req;

    if (userId === id) {
        next(new AppError("You can't get conversations with yourself.", 400));
        return;
    }

    const otherUser = await User.findById(userId);

    if (!otherUser || otherUser.isDeleted || otherUser.role === 'admin') {
        next(new AppError('No user found with that Id.', 404));
        return;
    }

    req.otherUser = otherUser;

    next();
});

exports.restrictToReceiver = catchAsync(async (req, res, next) => {
    const {
        params: { messageId },
        user: { id },
    } = req;

    const message = await Message.findById(messageId);

    if (!message) {
        next(new AppError('No message found with that ID.', 404));
        return;
    }

    if (message.receiver.valueOf() !== id) {
        next(
            new AppError(
                "You can't read messages of which you are not the receiver.",
                403
            )
        );
    }

    req.message = message;

    next();
});

exports.restrictReceiverToTeacher = catchAsync(async (req, res, next) => {
    const {
        params: { userId },
    } = req;

    const user = await User.findById(userId);

    if (user.role !== 'teacher') {
        next(
            new AppError(
                "You can't send a teaching demand to an user that is not a teacher.",
                400
            )
        );
    }
    req.teacher = user;

    next();
});