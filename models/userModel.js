/**
 * Definition of the user Model used in the application and generating the user Collection in the MongoDB Database.
 * @module userModel
 */
const mongoose = require('mongoose');
const { PASSWORD_VALIDATOR } = require('../utils/globals');
const { isEmail } = require('validator');

const validatePassword = value => PASSWORD_VALIDATOR.validate(value);

/**
 * The representation of the user model
 * @typedef User
 * @property {string} username The username of the user.
 * @property {string} mail The E-mail of the user.
 * @property {string} password The password of the user.
 * @property {number} phoneNumber The phone number of the user.
 * @property {number} rating The rating given by the average "stars" the user got from other users.
 * @property {string} role The placeholder of the role in the platform of the user.
 */

/**
 * The user schema object generated from mongoose.
 * @type {mongoose.Schema<user>}
 */
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, 'Please provide your email.'],
    unique: true,
    trim: true,
    lowercase: true,
    validate: [isEmail, 'Please provide a valid email address.'],
  },
  username: {
    type: String,
    required: [true, 'Please provide your username.'],
    unique: true,
    trim: true,
    lowercase: true,
    maxLength: [30, 'An username must have less or equal than 30 characters.'],
    minLength: [4, 'A username must have at least 4 characters.'],
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
    enum: ['admin', 'provider', 'client'],
    default: 'client',
  },
  isConfirmed: {
    type: Boolean,
    default: false,
    select: false,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    select: false,
  },
  confirmationToken: {
    type: String,
    select: false,
  },
  confirmationExpires: {
    type: Date,
    select: false,
  },
  passwordResetToken: {
    type: String,
    select: false,
  },
  passwordResetExpires: {
    type: Date,
    select: false,
  },
});

/**
 * The user model object generated from mongoose.
 * @type {mongoose.Model<User>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
