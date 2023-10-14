/**
 * AppError module, containing the AppError prototype function used to handle API errors.
 * @module AppError
 */

/**
 * AppError prototype function, used to generate specific API errors in the application.
 * @implements {Error}
 */
class AppError extends Error {
  /**
   * Constructor function used to generate an new instance of an AppError object.
   * @param {string} message the content message of the error.
   * @param {number} statusCode the status code associated with the error that will be returned to the client.
   */
  constructor(message, statusCode) {
    super(message);

    /** @public */
    this.statusCode = statusCode;
    /** @public */
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    /**
     * @public
     * @readonly
     */
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor); // remove the constructor call from the stack trace to not show it
  }
}

module.exports = AppError;
