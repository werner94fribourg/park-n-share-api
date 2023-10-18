/**
 * Definition of the Admin Model used in the application and generating the Admin Collection in the MongoDB Database.
 * @module adminModel
 */
const mongoose = require('mongoose');

/**
 * The representation of the Admin model
 * @typedef Admin
 * @property {string} username The username of the admin.
 * @property {string} mail The E-mail of the admin.
 * @property {string} password The password of the admin.
 * @property {number} phoneNumber The phone number of the admin.
 * @property {string} role The placeholder of the role in the platform of the admin.
 */

/**
 * The admin schema object generated from mongoose.
 * @type {mongoose.Schema<Admin>}
 */
const adminSchema = new mongoose.Schema({
    username: {
        type: String,
    },
    mail: {
        type: String,
    },
    password: {
        type: String,
    },
    phoneNumber: {
        type: Number,
    },
    role: {
        type: String
    }
});

/**
 * The Admin model object generated from mongoose.
 * @type {mongoose.Model<Admin>}
 */
const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
