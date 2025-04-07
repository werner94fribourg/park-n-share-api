/**
 * Functions used to handle the authentication in the API
 * @module authController
 */
const {
  catchAsync,
  createSendToken,
  sendPinCode,
  getToken,
  connectUser,
} = require('../utils/utils');
const AppError = require('../utils/classes/AppError');
const User = require('../models/userModel');
const { FRONTEND_URL } = require('../utils/globals');
const crypto = require('crypto');
const Email = require('../utils/classes/Email');

exports.signup = catchAsync(
  /**
   * Function used to handle the signup process of a guest user.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      body: { username, email, phone, password, passwordConfirm },
    } = req;

    const isConfirmed = true;

    const newUser = await User.create({
      username,
      email,
      phone,
      password,
      passwordConfirm,
      isConfirmed,
    });

    let pins;

    try {
      pins = await sendPinCode(newUser);
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

    const [pinCode, pinCodeExpires] = pins;

    /*res.status(201).json({
      status: 'success',
      message: 'Please confirm with the PIN code sent to your phone number.',
      pinCode,
      pinCodeExpires,
    });*/
    const { resObject, cookieOptions } = createSendToken(req, newUser._id);

    resObject.pinCode = pinCode;
    resObject.pinCodeExpires = pinCodeExpires;
    resObject['message'] = "Successful registration. Welcome to Park'N'Share!";

    try {
      if (!isConfirmed) await new Email(newUser).sendWelcome();
    } catch (err) {
      console.error('Error while trying to send the confirmation email.');
      console.error(err);
    }

    // send the token as a httpOnly cookie
    res.cookie('jwt', resObject.token, cookieOptions);

    res.status(200).json(resObject);
  },
);

exports.confirmPin = catchAsync(
  /**
   * Function used to handle the pin confirmation of an user in the signin / signup request.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      body: { email, pinCode },
    } = req;

    const cryptedPin = crypto
      .createHash('sha256')
      .update(`${pinCode}`)
      .digest('hex');

    const user = await User.findOne({
      email,
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

exports.getPinExpiration = catchAsync(
  /**
   * Function used to get the pin expiration date when the user tries to log in
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      params: { email },
    } = req;

    const user = await User.findOne({
      email,
      pinCodeExpires: { $gt: Date.now() },
    }).select('+pinCodeExpires');

    if (!user) {
      next(new AppError('No PIN code generated by this user.', 404));
      return;
    }

    const { pinCodeExpires } = user;

    res.status(200).json({
      status: 'success',
      pinCodeExpires,
    });
  },
);

exports.signin = catchAsync(
  /**
   * Function used to handle the signin process of a user.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
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
      return;
    }

    let pins;

    try {
      pins = await sendPinCode(user);
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

    const [pinCode, pinCodeExpires] = pins;

    /*res.status(200).json({
      status: 'success',
      message: 'Please confirm with the PIN code sent to your phone number.',
      pinCodeExpires,
      pinCode,
    });*/

    const { resObject, cookieOptions } = createSendToken(req, user._id);

    resObject.pinCode = pinCode;
    resObject.pinCodeExpires = pinCodeExpires;
    resObject['message'] = 'Welcome back!';

    // send the token as a httpOnly cookie
    res.cookie('jwt', resObject.token, cookieOptions);

    res.status(200).json(resObject);
  },
);

exports.protect = catchAsync(
  /**
   * Function used to check if the user is logged in. It will continue to the next middleware function if it is the case, otherwise it will throw an error.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    // 1) Get the token from the header / cookie and check if it exists
    const token = getToken(req);

    if (!token) {
      next(
        new AppError(
          'You are not logged in! Please log in to get access to this route.',
          401,
        ),
      );

      return;
    }

    const currentUser = await connectUser(User, token);

    //3) Access the logged user to be used in the next middleware function if everything is fine
    req.user = currentUser;

    next();
  },
);

exports.validate = catchAsync(
  /**
   * Function used to check if the user is logged in. It will continue to the next middleware function if it is the case, otherwise it will throw an error.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      user: { _id, email },
    } = req;

    res.status(200).json({ status: 'success', data: { user: { _id, email } } });
  },
);

exports.restrictTo =
  /**
   * Function used to restrict the access to a route to users if they aren't from a specific one.
   * @param  {...any} roles The list of roles for which we want to restrict the access of a route.
   * @returns {import('express').RequestHandler} A request handler function that will check that the user has one of the role specified in the list.
   */


    (...roles) =>
    /**
     * Function that will check that the user have of the specified roles to access a route and deny access if it isn't the case.
     * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
     * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
     */
    (req, _, next) => {
      const {
        user: { role },
      } = req;
      if (!roles.includes(role)) {
        next(
          new AppError(
            "You don't have permission to perform this action.",
            403,
          ),
        );
        return;
      }

      next();
    };

exports.sendConfirmationEmail = catchAsync(
  /**
   * Function used to send the confirmation link to the e-mail address of an user.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const { user } = req;

    //1) Check if the user has already confirmed his email address
    if (user.isEmailConfirmed) {
      next(new AppError('Your email address was already confirmed.', 403));
      return;
    }

    //2) Create email confirmation token and confirmation token expiration
    //     The confirmation token will be set in the confirmation link in the confirmation email
    const confirmEmailToken = user.createConfirmEmailToken();

    await user.save({ validateBeforeSave: false });

    //3) Sent the confirmation email
    try {
      const url = `${FRONTEND_URL}/confirm-email/${confirmEmailToken}`;
      await new Email(user, url).sendEmailConfirmation();
      //4) Sent email success message to the user
      res.status(200).json({
        status: 'success',
        message: 'Confirmation email successfully sent to your address.',
      });
    } catch (err) {
      user.confirmEmailToken = undefined;
      user.confirmEmailExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error(
        'Error while trying to send the email confirmation link to email.',
      );
      console.error(err);
      next(
        new AppError(
          'There was an error sending the confirmation email. Please contact us at admin@parknshare.com!',
          500,
        ),
      );

      console.error(err);
    }
  },
);

exports.confirmEmail = catchAsync(
  /**
   * Function used to confirm an email address by using the confirmation token sent to the user by email.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
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
  },
);

exports.changePassword = catchAsync(
  /**
   * Function used to change the password of the connected user.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    // get the user from the database
    const user = await User.findById(req.user._id).select('+password');

    // check if the posted current password is correct
    if (
      !(await user.correctPassword(req.body.passwordCurrent, user.password))
    ) {
      next(new AppError('Your current password is wrong.', 401));
      return;
    }

    // update the password fields
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    // authenticate the client again
    const { resObject, cookieOptions } = createSendToken(req, user._id);

    resObject['message'] = 'Password successfully updated.';

    res.cookie('jwt', resObject.token, cookieOptions);

    // send back the response
    res.status(200).json(resObject);
  },
);

exports.forgotPassword = catchAsync(
  /**
   * Function used to send a forgot password request if the user doesn't remember his one.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    // get the email from user
    const userEmail = req.body.email;

    // query all users with matching userEmail
    const user = await User.findOne({ email: userEmail });

    // check if the posted current password is correct
    if (!user) {
      // No user found with the specified email
      // Simulate that the email request was sent to not give clues in the case where there is an attack
      res.status(200).json({
        status: 'success',
        message: 'Reset password link sent to your email!',
      });
      return;
    }

    // Generate email forgotPassword Reset Token
    const resetToken = user.createPasswordResetToken();

    await user.save({ validateBeforeSave: false });
    try {
      const url = `${FRONTEND_URL}/reset-password/${resetToken}`;

      await new Email(user, url).sendForgotPassword();

      res.status(200).json({
        status: 'success',
        message: 'Reset password link sent to your email!',
      });
    } catch (err) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save({ validateBeforeSave: false });

      console.error(
        'Error while trying to send the forgot password link to email.',
      );
      console.error(err);
      next(
        new AppError('There was an error sending the email. Try Again!', 500),
      );
    }
  },
);

exports.isResetLinkValid = catchAsync(
  /**
   * Function used to check if a reset password link is a valid one.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   */
  async (req, res) => {
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
        valid: user ? true : false,
      },
    });
  },
);

exports.resetPassword = catchAsync(
  /**
   * Function used to reset the password of the user if he has received a reset password link to his email address.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
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

    if (!user) {
      next(new AppError('The link is invalid or has expired.', 400));
      return;
    }

    // update the password fields
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;

    await user.save();

    user.passwordResetExpires = undefined;
    user.passwordResetToken = undefined;

    await user.save({ validateBeforeSave: false });

    // authenticate the client again
    const { resObject, cookieOptions } = createSendToken(req, user._id);

    resObject['message'] = 'Password successfully changed!';

    res.cookie('jwt', resObject.token, cookieOptions);

    // send back the response
    res.status(200).json(resObject);
  },
);

exports.checkProvider = catchAsync(
  /**
   * Middleware function used to check if the sender of a request is a provider so that he can have his own parkings when he queries the existing ones.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    const { user, query } = req;
    query.owner = user._id;

    req.own = true;
    next();
  },
);

exports.checkConnected = catchAsync(
  /**
   * Middleware Function used to get all existing parkings of the user itself if he is a provider.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    const {
      query,
      headers: { authorization },
      cookies: { jwt: cookieToken },
    } = req;

    if (authorization || cookieToken) {
      const token = getToken(req);
      try {
        const connectedUser = await connectUser(User, token);
        if (connectedUser) {
          query.owner = { $ne: connectedUser._id };
          req.user = connectedUser;

          req.own = false;
          next();
        }
      } catch (err) {
        next();
      }

      return;
    }

    next();
  },
);
