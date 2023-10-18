/**
 * Definition of the Provider Model used in the application and generating the Provider Collection in the MongoDB Database.
 * @module providerModel
 */
const mongoose = require('mongoose');

/**
 * The representation of the User model
 * @typedef Provider
 * @property {string} username The username of the Provider.
 * @property {string} mail The E-mail of the Provider.
 * @property {string} password The password of the Provider.
 * @property {number} phoneNumber The phone number of the Provider.
 * @property {number} rating The rating given by the average "stars" the provider got from other Users.
 * @property {string} role The placeholder of the role in the platform of the Provider.
 */

/**
 * The provider schema object generated from mongoose.
 * @type {mongoose.Schema<Provider>}
 */
const providerSchema = new mongoose.Schema({
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
    address: {
        type: String
    },
    rating: {
        type: Number,
    },
    role: {
        type: String
    }
});

/**
 * The Provider model object generated from mongoose.
 * @type {mongoose.Model<Provider>}
 */
const Provider = mongoose.model('Provider', providerSchema);

module.exports = Provider;
