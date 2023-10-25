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
});

// Creation of the user or modification of the password
//  - hash and store the new one
//  - remove the confirm to avoid a passwordConfirm field to be stored in the database
userSchema.pre('save', async function (next) {
  if (this.password && this.isModified('password'))
    this.password = await bcrypt.hash(this.password, 12);

  this.passwordConfirm = undefined;

  next();
});

// Password changing
//  - set a password changing date
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || this.isNew) {
    next();
    return;
  }

  this.passwordChangedAt = Date.now() - 1000; // 1 s in past ensures the token was always created after the password has been changed

  next();
});

// Password checking when the user tries to connect
userSchema.methods.correctPassword = async (writtenPassword, userPassword) =>
  await bcrypt.compare(writtenPassword, userPassword);

// Create a pin code for 2-step confirmation and hash the pin to be able to store it in the database.
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

// Create a confirmation token link to be sent to the user when he wants to confirm his e-mail address
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
