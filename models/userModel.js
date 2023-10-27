/**
 * Definition of the User Model used in the application and generating the User Collection in the MongoDB Database.
 * @module userModel
 */
const {
  PASSWORD_VALIDATOR,
  CONFIRMATION_DELAY,
  EMAIL_CONFIRMATION_DELAY,
} = require('../utils/globals');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');
const mongoose = require('mongoose');
const { phone } = require('phone');
const crypto = require('crypto');
const { createLinkToken } = require('../utils/utils');

const validatePassword = value => PASSWORD_VALIDATOR.validate(value);

/**
 * The representation of the User model
 * @typedef User
 * @property {string} username The username of the user.
 * @property {string} email The email of the user.
 * @property {string} phone The phone number of the user.
 * @property {string} password The password of the user.
 * @property {string} passwordConfirm The password confirmation of the user, which will not be stored in the database.
 * @property {string} role The role of the user.
 * @property {Date} passwordChangedAt The last moment where the user changed his password.
 * @property {boolean} isConfirmed The confirmation status of the user.
 * @property {string} pinCode The hashed pin code sent to the user when he's trying to connect / register.
 * @property {Date} pinCodeExpires The expiration time of the pin code validity.
 * @property {boolean} isEmailConfirmed The confirmation status of the email address.
 * @property {string} confirmEmailToken The hashed email confirmation token, generated in the confirmation email sent to the user.
 * @property {Date} confirmEmailExpires The expiration time of the confirmation email validity.
 */

/**
 * The user schema object generated from mongoose.
 * @type {mongoose.Schema<User>}
 */
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, 'Please provide your username'],
    unique: true,
    trim: true,
    lowercase: true,
    maxLength: [30, 'An username must have less or equal than 30 characters.'],
    minlength: [4, 'An username must have at least 4 characters.'],
  },
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    validate: [isEmail, 'Please provide a valid email address.'],
    lowercase: true,
    trim: true,
  },
  phone: {
    type: String,
    required: [true, 'Please provide your phone number.'],
    unique: [true, 'The provided phone number is not available.'],
    validate: {
      validator: function (number) {
        return phone(number).isValid;
      },
      message: 'Please provide a valid phone number.',
    },
  },
  password: {
    type: String,
    required: [true, 'Please provide your password.'],
    validate: [validatePassword, 'Please provide a valid password.'],
    select: false,
  },
  passwordConfirm: {
    type: String,
    required: [true, 'Please confirm your password.'],
    validate: {
      validator: function (val) {
        return val === this.password;
      },
      message: 'Passwords are not the same.',
    },
  },
  role: {
    type: String,
    enum: ['client', 'provider', 'admin'],
    default: 'client',
  },
  passwordChangedAt: {
    type: Date,
    select: false,
  },
  isConfirmed: {
    type: Boolean,
    default: false,
    select: false,
  },
  pinCode: {
    type: String,
    select: false,
  },
  pinCodeExpires: {
    type: Date,
    select: false,
  },
  isEmailConfirmed: {
    type: Boolean,
    select: false,
    default: false,
  },
  confirmEmailToken: {
    type: String,
    select: false,
  },
  confirmEmailExpires: {
    type: Date,
    select: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
  isDeletedAt: {
    type: Date,
    select: false,
  },
});

// Creation of the user or modification of the password
//  - hash and store the new one
//  - remove the confirm to avoid a passwordConfirm field to be stored in the database
userSchema.pre(
  'save',
  /**
   * Function used to the check the password field before saving an user and has it if it has been modified or is new.
   * @param {import('mongoose').PreSaveMiddlewareFunction<User>} next The next middleware function that will be called in the pre saving process.
   */
  async function (next) {
    if (this.password && this.isModified('password'))
      this.password = await bcrypt.hash(this.password, 12);

    this.passwordConfirm = undefined;

    next();
  },
);

// Password changing
//  - set a password changing date
userSchema.pre(
  'save',
  /**
   * Function used to put a modification date if the user is modifying the password.
   * @param {import('mongoose').PreSaveMiddlewareFunction} next  The next middleware function that will be called in the pre saving process.
   */
  async function (next) {
    if (!this.isModified('password') || this.isNew) {
      next();
      return;
    }

    this.passwordChangedAt = Date.now() - 1000; // 1 s in past ensures the token was always created after the password has been changed

    next();
  },
);

/**
 * Function used to check the password when the user tries to connect.
 * @param {string} writtenPassword The non crypted password sent by the user.
 * @param {string} userPassword The crypted password of the user stored in the database.
 * @returns {boolean} True if the encryption of the password corresponds to the stored one, false otherwise.
 */
userSchema.methods.correctPassword = async (writtenPassword, userPassword) =>
  await bcrypt.compare(writtenPassword, userPassword);

/**
 * Function used to create a 6-digit pin code for 2-step authentication and store an encrypted version of it in the user schema in the database.
 * @returns {string} The encrypted value of the pin code.
 */
userSchema.methods.createPinCode = function () {
  const pinCode = Math.floor(Math.random() * 1000000 + 100000);

  const cryptedPin = crypto
    .createHash('sha256')
    .update(`${pinCode}`)
    .digest('hex');
  this.pinCode = cryptedPin;
  this.pinCodeExpires = Date.now() + CONFIRMATION_DELAY;
  return pinCode;
};

/**
 * Function used to create a confirmation token that will be set to the confirmation link when the user wants to confirm his e-mail address.
 * @returns {string} the confirmation email token that will be set in the url.
 */
userSchema.methods.createConfirmEmailToken = function () {
  const [confirmEmailToken, hashedConfirmEmailToken] = createLinkToken();

  this.confirmEmailToken = hashedConfirmEmailToken;

  this.confirmEmailExpires = Date.now() + EMAIL_CONFIRMATION_DELAY; // Set up confirmation link validity

  return confirmEmailToken;
};

/**
 * The User model object generated from mongoose.
 * @type {mongoose.Model<User>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
