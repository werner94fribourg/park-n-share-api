/**
 * All global parameters contained in the application.
 * @module globals
 */
const PasswordValidator = require('password-validator');
const TwilioSDK = require('twilio');
const twilio = require('twilio');

const {
  env: { ACCOUNT_SID, TWILIO_AUTH_TOKEN },
} = process;

const Influx = require('../utils/classes/Influx');

/**
 * Base URL of the API.
 * @type {string}
 */
exports.API_ROUTE = '/api/v1';

/**
 * Filepath of the public static directory.
 * @type {string}
 */
exports.PUBLIC_FOLDER = 'public';

/**
 * Filepath of the img static directory.
 */
exports.IMG_FOLDER = exports.PUBLIC_FOLDER + '/img';

/**
 * File path of the users (i.e. user profile images) static directory.
 */
exports.USERS_FOLDER = exports.IMG_FOLDER + '/users';

/**
 * Base URL of the frontend application.
 * @type {string}
 */
exports.FRONTEND_URL = 'http://localhost:3000';

/**
 * Base URL of the backend application.
 */
exports.BACKEND_URL = 'http://localhost:3001';

/**
 * List of url parameters that can happen multiple times.
 * @type {string[]}
 */
exports.PARAMETER_WHITELIST = [];


exports.INFLUX_ORG = 'pnsOrg';
exports.INFLUX_BUCKET = 'pnsBucket';

exports.INFLUX = new Influx(this.INFLUX_ORG, this.INFLUX_BUCKET);

const PASSWORD_VALIDATOR = new PasswordValidator();

PASSWORD_VALIDATOR.is()
  .min(8, 'The password must contain at least 8 characters.') // Minimum length 8
  .is()
  .max(100, 'The password must contain at most 100 characters.') // Maximum length 100
  .has()
  .uppercase(1, 'The password must contain at least 1 letter in uppercase.') // Must have uppercase letters
  .has()
  .lowercase(1, 'The password must contain at least 1 letter in lowercase.') // Must have lowercase letters
  .has()
  .digits(1, 'The password must contain at least 1 digit.') // Must have at least 1 digits
  .has()
  .symbols(1, 'The password must contain at least 1 special character.') // Must contain at least 1 symbol
  .has()
  .not()
  .spaces(1, 'The password must not contain spaces.'); // Must not contain spaces

/**
 * Password validator in the application.
 * @type {PasswordValidator}
 */
exports.PASSWORD_VALIDATOR = PASSWORD_VALIDATOR;

const TWILIO_CLIENT = twilio(ACCOUNT_SID, TWILIO_AUTH_TOKEN);

/**
 * Twilio authentication client used to send SMS to the user.
 * @type {TwilioSDK.Twilio}
 */
exports.TWILIO_CLIENT = TWILIO_CLIENT;

/**
 * Confirmation delay given in ms given to the user to type his PIN code in the signin/signup request.
 * @type {number}
 */
exports.CONFIRMATION_DELAY = 5 * 60 * 1000; // 5 minutes

/**
 * Confirmation delay given in ms given to the user to confirm his email address when he requested.
 * @type {number}
 */
exports.EMAIL_CONFIRMATION_DELAY = 10 * 24 * 60 * 60 * 1000; // 10 days

