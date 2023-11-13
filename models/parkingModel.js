/**
 * Definition of the Parking Model used in the application and generating the Parking Collection in the MongoDB Database.
 * @module parkingModel
 */

const { mongoose, Schema } = require('mongoose');
const { PARKINGS_FOLDER, BACKEND_URL } = require('../utils/globals');

/**
 * The representation of the Parking model
 * @typedef Parking
 * @property {string} name The name of the parking slot.
 * @property {string} description The description of the parking slot.
 * @property {string} type The type of the parking slot (indoor / outdoor).
 * @property {boolean} isOccupied The occupation state of the parking slot.
 * @property {boolean} isPending The reservation state of the parking slot.
 * @property {boolean} isValidated The validation state of the parking slot before making it accessible to the existing list.
 * @property {number} price The hourly price of the parking slot.
 * @property {Date} creationDate The creation date of the parking slot.
 * @property {Object} location The location (address and coordinates) of the parking slot.
 * @property {mongoose.Schema.ObjectId} owner The id reference to the owner of the parking slot.
 * @property {string[]} photos The photos of the parking slot.
 */

/**
 * The parking schema object generated from mongoose.
 * @type {mongoose.Schema<Parking>}
 */
const parkingSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please provide a name to your parking slot.'],
    trim: true,
    maxLength: [30, "A parking slot name can't be longer than 30 characters."],
    minlength: [4, "A parking slot name can't be shorter than 4 characters."],
  },
  description: {
    type: String,
    trim: true,
  },
  type: {
    type: String,
    enum: ['indoor', 'outdoor'],
    default: 'outdoor',
  },
  isOccupied: {
    type: Boolean,
    default: false,
    select: false,
  },
  isPending: {
    type: Boolean,
    default: false,
    select: false,
  },
  isValidated: {
    type: Boolean,
    default: false,
    select: false,
  },
  price: {
    type: Number,
    required: [true, 'Please provide an hourly price for your parking slot.'],
  },
  creationDate: {
    type: Date,
    select: false,
  },
  location: {
    type: {
      type: String,
      default: 'Point',
      enum: ['Point'],
    },
    coordinates: [Number],
    city: String,
    address: String,
  },
  owner: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  photos: [
    {
      type: String,
      trim: true,
    },
  ],
});

/**
 * Function used to generate the absolute path location of the parkings photos of a parking before sending it back to the client that requested it.
 */
parkingSchema.methods.generateFileAbsolutePath = function () {
  if (this.photos)
    this.photos = this.photos.map(
      photo => `${BACKEND_URL}/${PARKINGS_FOLDER}/${photo}`,
    );
};

/**
 * The Parking model object generated from mongoose.
 * @type {mongoose.Model<Parking>}
 */
const Parking = mongoose.model('Parking', parkingSchema);

module.exports = Parking;
