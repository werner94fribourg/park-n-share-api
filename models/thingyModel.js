/**
 * Definition of the Thingy Model used in the application and generating the Thingy Collection in the MongoDB Database.
 * @module thingyModel
 */
const { mongoose, Schema } = require('mongoose');

/**
 * The representation of the Thingy model
 * @typedef Thingy
 * @property {string} name The name of the thingy.
 */

/**
 * The thingy schema object generated from mongoose.
 * @type {mongoose.Schema<Thingy>}
 */
const thingySchema = new Schema({
  name: {
    type: String,
    required: true,
  },
});

/**
 * The Thingy model object generated from mongoose.
 * @type {mongoose.Model<Thingy>}
 */
const Thingy = mongoose.model('Thingy', thingySchema);

module.exports = Thingy;
