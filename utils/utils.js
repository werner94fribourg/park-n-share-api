/**
 * All utilities functions used in the application.
 * @module utils
 */
const { Server } = require('http');
const { Connection } = require('mongoose');
const mongoose = require('mongoose');
const { Response } = require('express');
const AppError = require('./classes/AppError');

/**
 * Function used to handle mongoose invalid requests generating CastError.
 * @param {mongoose.Error} error The error generated by the invalid operation on the database.
 * @returns {AppError} A CastError AppError object with a 400 status code.
 */
exports.handleCastErrorDB = error => {
  const message = `Invalid ${error.path}: ${error.value}`;
  return new AppError(message, 400);
};

/**
 * Function used to handle mongoose duplicate field database errors.
 * @param {mongoose.Error} error The error generated by the invalid operation on the database.
 * @returns {AppError} A duplicate field AppError object with a 400 status code.
 */
exports.handleDuplicateFieldsDB = error => {
  const [value] = error.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/);

  const message = `Duplicate field value: ${value}. Please use another value!`;

  return new AppError(message, 400);
};

/**
 * Function used to handle mongoose validation database errors.
 * @param {mongoose.Error} error The error generated by the invalid operation on the database.
 * @returns {AppError} A validation AppError object with a 400 status code.
 */
exports.handleValidationErrorDB = error => {
  const message = `Invalid input data.`;
  const errors = Object.entries(error.errors).map(([key, value]) => ({
    [key]: value.message,
  }));

  const appError = new AppError(message, 400);
  appError.fields = errors;
  return appError;
};

/**
 * Function used to handle requests containing an invalid JWT authentication token.
 * @returns {AppError} An invalid JWT AppError object with a 401 status code.
 */
exports.handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

/**
 * Function used to handler requests containing an invalid expired JWT authentication token.
 * @returns {AppError} An invalid JWT AppError object with a 401 status code.
 */
exports.handleJWTExpiredError = () =>
  new AppError('Your token has expired. Please log in again!', 401);

/**
 * Function used to handle the respone object returned to the client when the server is in dev mode.
 * @param {Error} error The error object for which we want to send a response.
 * @param {Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
 */
exports.sendErrorDev = (error, res) => {
  const { statusCode, status, message, stack } = error;
  res.status(statusCode).json({ status, error, message, stack });
};

/**
 * Function used to handle the response object returned to the client when the server is in prod mode.
 * @param {Error} err the error object for which we want to send a response.
 * @param {Response} res the response object of the Express framework, used to handle the response we will give back to the end user.
 */
exports.sendErrorProd = (err, res) => {
  if (err.isOperational) {
    const { statusCode, status, message, fields } = err;
    res.status(statusCode).json({ status, message, fields });
    return;
  }
  // Log error
  console.error('ERROR: ', err);

  // Send generic message
  res
    .status(500)
    .json({ status: 'error', message: 'Something went wrong. Try Again !' });
};

/**
 * Function used to gracefully shut down the server in the case of a fatal unhandled error happening on it.
 * @param {Server} server The HTTP server we want to gracefully shut down.
 * @param {Connection} dbConnection The opened mongoose db connection we want to shut down simultaneously as the server.
 * @param {string} message The error message we want to display when we shut down the server.
 * @param {Error} error The unhandled error that has caused the server to crash.
 */
exports.shutDownAll = async (server, dbConnection, message, error) => {
  try {
    console.log(message);
    if (error) console.error(error.name, error.message);
    if (dbConnection) {
      console.log('Close DB connection.');
      await dbConnection.close();
    }

    if (server)
      server.close(() => {
        console.log('Close server.');
        process.exit(1);
      });
    else process.exit(1);
  } catch (err) {
    console.error(err.name, err.message);
    process.exit(1);
  }
};

/**
 * Function used to handle errors generated in controllers function and redirect them to the Error handling NextFunction in the case where it happens.
 * @param {Function} fn the async controller function for which we want to catch the errors and handle the response in the route.
 */
exports.catchAsync = fn => (req, res, next) => {
  fn(req, res, next).catch(err => next(err));
};
