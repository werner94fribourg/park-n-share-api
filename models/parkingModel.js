/**
 * Definition of the Parking Model used in the application and generating the Park Collection in the MongoDB Database.
 * @module parkingModel
 */

const {mongoose, Schema} = require('mongoose');
const {
    PARKINGS_FOLDER,
    BACKEND_URL,
} = require('../utils/globals');

/**
 * The representation of the Parking model
 * @typedef Parking
 * @property {string} title The title of the parking slot.
 * @property {string} description The description of the parking slot.
 * @property {string} parkType The parking slot type, can be 'indoor' or 'outdoor'.
 * @property {boolean} isOccupied The parking occupation, states whether it is currently occupied or not.
 * @property {boolean} isPending The parking slot status, states whether it has been published or not.
 * @property {number} price The parking slot type, can be 'indoor' or 'outdoor'.
 * @property {Date} date The parking slot publication date.
 * @property {string} location The parking slot location.
 * @property {object} owner The user related attributes which the parking slot will be populated with.
 * @property {string} photo The parking slot photos.
 */

/**
 * The park schema object generated from mongoose.
 * @type {mongoose.Schema<Parking>}
 */
const parkSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, 'Please provide parking slot title'],
        unique: true,
        trim: true,
        lowercase: true,
        maxLength: [30, 'A parking slot title must have less or equal than 15 characters.'],
        minlength: [4, 'A parking slot title must have at least 4 characters.'],
    },
    description: {
        type: String,
        required: false,
        unique: false,
        lowercase: true,
        trim: true,
    },
    parkType: {
        type: String,
        required: [true, 'Please provide your parking type.'],
        enum: ['indoor', 'outdoor'],
        default: 'outdoor'
    },
    isOccupied: {
        type: Boolean,
        default: false,
        select: false,
    },
    isPending: {
        type: Boolean,
        default: true,
        select: false,
    },
    price: {
        type: Number,
        required: [true, "Please provide a value, even if it is for free put 0."],
        unique: false,
        lowercase: true,
        trim: true,
    },
    date: {
        type: Date,
        select: false,
    },
    location: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number],
        city: String,
        address: String
    },
    owner: {
      type: mongoose.Schema.ObjectId,
      ref: 'User'
    },
    photos: [
        {
            type: String,
            trim: true,
        }
    ],
});

/**
 * Function used to generate the absolute path location of the profile picture of an user before sending it back to the client that requested it.
 */
parkSchema.methods.generateFileAbsolutePath = function () {
    if (this.photo) this.photo = `${BACKEND_URL}/${PARKINGS_FOLDER}/${this.photo}`;
};

/**
 * The Park model object generated from mongoose.
 * @type {mongoose.Model<Parking>}
 */
const Parking = mongoose.model('Parking', parkSchema);

module.exports = Parking;
