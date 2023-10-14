/**
 * Definition of the User Model used in the application and generating the User Collection in the MongoDB Database.
 * @module userModel
 */
const mongoose = require('mongoose');

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
  },
});

/**
 * The User model object generated from mongoose.
 * @type {mongoose.Model<User>}
 */
const User = mongoose.model('User', userSchema);

module.exports = User;
