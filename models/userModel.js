/**
 * Definition of the User Model used in the application and generating the User Collection in the MongoDB Database.
 * @module userModel
 */
const { PASSWORD_VALIDATOR } = require('../utils/globals');
const bcrypt = require('bcryptjs');
const { isEmail } = require('validator');
const mongoose = require('mongoose');
const { phone } = require('phone');

const validatePassword = value => PASSWORD_VALIDATOR.validate(value);

/**
 * The representation of the User model
 * @typedef User
 * @property {string} username The username of the user.
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

/**
 * The User model object generated from mongoose.
 * @type {mongoose.Model<User>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;