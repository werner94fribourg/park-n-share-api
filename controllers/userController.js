/**
 * Functions related to calling the user resource in the API
 * @module userController
 */
const User = require('../models/userModel');
const AppError = require('../utils/classes/AppError');
const { USERS_FOLDER } = require('../utils/globals');
const { catchAsync, uploadImage, queryById } = require('../utils/utils');
const sharp = require('sharp');

exports.getAllUsers = catchAsync(
  /**
   * Function used to get all existing user resources in the database.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const users = await User.find({});
    users.forEach(user => {
      user.generateFileAbsolutePath();
    });
    res.status(200).json({
      status: 'success',
      data: { users },
    });
  },
);

exports.queryMe = catchAsync(
  /**
   * Function used to set the connected user as the one we will request in the next middleware functions.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    req.params.id = req.user._id.valueOf();
    req.self = true;
    next();
  },
);

exports.getUser = catchAsync(
  /**
   * Function used to get a specific user from the database.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      params: { id },
      self,
    } = req;

    const selectFields = self ? '+role +isEmailConfirmed' : '';

    const user = await queryById(User, id, {}, null, selectFields);

    if (!user) {
      next(
        new AppError("The requested user doesn't exist or was deleted.", 404),
      );
      return;
    }

    user.generateFileAbsolutePath();

    res.status(200).json({
      status: 'success',
      data: { user },
    });
  },
);

exports.updateUser = catchAsync(
  /**
   * Function used to modify an existing user in the database.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      params: { id },
      body: { photo },
    } = req;

    const user = await queryById(User, id);

    if (!user) {
      next(
        new AppError("The requested user doesn't exist or was deleted.", 404),
      );
      return;
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { photo },
      { new: true },
    );

    updatedUser.generateFileAbsolutePath();

    res.status(200).json({ status: 'success', data: { user: updatedUser } });
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
    //1) get the id of the user we want to delete
    const {
      params: { id },
    } = req;

    //2) retrieve him from the database
    const user = await queryById(User, id);

    //3) check if the user wasn't found
    if (!user) {
      next(
        new AppError("The requested user doesn't exist or was deleted.", 404),
      );
      return;
    }

    //4) check if the user is an admin
    if (user.role === 'admin') {
      next(new AppError("You can't delete an admin user.", 403));
      return;
    }

    //5) delete the user
    await User.findByIdAndDelete(id);

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
    const user = await queryById(User, id);

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
      return;
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

    updatedUser.generateFileAbsolutePath();

    // 3) Send the updated User
    res.status(200).json({ status: 'success', data: { user: updatedUser } });
  },
);

/**
 * Multer middleware function that takes care of processing the photo field image associated with the form sent to the server.
 * @returns {import('express').RequestHandler} The request handler function that takes care of processing the sent image.
 */
exports.uploadUserPhoto = uploadImage.single('photo');

exports.resizeUserPhoto = catchAsync(
  /**
   * Function that takes care of resizing the profile picture image sent by the user such that it takes a 500x500 pixel format.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    const {
      file,
      user: { _id: id },
    } = req;

    if (!file) {
      next();
      return;
    }

    const filename = `user-${id}-${Date.now()}.jpeg`;

    await sharp(file.buffer)
      .resize(500, 500)
      .toFormat('jpeg')
      .jpeg({ quality: 100 })
      .toFile(`${USERS_FOLDER}/${filename}`);

    file.filename = filename;

    req.body.photo = filename;
    next();
  },
);
