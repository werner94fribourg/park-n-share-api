/**
 * Definition of the client Model used in the application and generating the client Collection in the MongoDB Database.
 * @module clientModel
 */
const mongoose = require('mongoose');

/**
 * The representation of the client model
 * @typedef Client
 * @property {string} username The username of the client.
 * @property {string} mail The E-mail of the client.
 * @property {string} password The password of the client.
 * @property {number} phoneNumber The phone number of the client.
 * @property {number} rating The rating given by the average "stars" the client got from other users.
 * @property {string} role The placeholder of the role in the platform of the user.
 */

/**
 * The client schema object generated from mongoose.
 * @type {mongoose.Schema<Client>}
 */
const clientSchema = new mongoose.Schema({
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
  rating: {
    type: Number,
  },
  role: {
    type: String
  }
});

/**
 * The client model object generated from mongoose.
 * @type {mongoose.Model<Client>}
 */
const Client = mongoose.model('Client', clientSchema);

module.exports = Client;
