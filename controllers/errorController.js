/**
 * Functions related to error handling in an API call
 * @module errorController
 */
const AppError = require('../utils/classes/AppError');
const {
  handleCastErrorDB,
  handleDuplicateFieldsDB,
  handleValidationErrorDB,
  handleJWTError,
  handleJWTExpiredError,
  sendErrorDev,
  sendErrorProd,
} = require('../utils/utils');

/**
 * Error handling function, that will take care of generating the correct HTTP response object
 * to the user in the case an error was generated during a route call.
 * @param {AppError} err The generated error in the application.
 * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
 * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
 */
module.exports = (err, _, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // eslint-disable-next-line prettier/prettier, node/no-unsupported-features/es-syntax
  let error = err;

  if (err.name === 'CastError') error = handleCastErrorDB(err);

  if (err.code === 11000) error = handleDuplicateFieldsDB(err);

  if (err.name === 'ValidationError') error = handleValidationErrorDB(err);

  if (err.name === 'JsonWebTokenError') error = handleJWTError(err);

  if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(err);

  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test')
    sendErrorDev(err, res);
  else if (process.env.NODE_ENV === 'production') sendErrorProd(error, res);

  next();
};
