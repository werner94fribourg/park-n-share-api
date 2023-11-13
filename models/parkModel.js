/**
 * Definition of the Park Model used in the application and generating the Park Collection in the MongoDB Database.
 * @module userModel
 */

const {mongoose, Schema} = require('mongoose');
const {
    PARKINGS_FOLDER,
    BACKEND_URL,
} = require('../utils/globals');

/**
 * The representation of the Park model
 * @typedef Park
 * @property {string} title The title of the parking slot.
 * @property {string} description The description of the parking slot.
 * @property {string} parkType The parking slot type, can be .
 * @property {string} username The username of the user.
 * @property {string} email The email of the user.
 * @property {string} phone The phone number of the user.
 * @property {string} photo The picture related to the parking slot
 */

/**
 * The park schema object generated from mongoose.
 * @type {mongoose.Schema<Park>}
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
 * @type {mongoose.Model<Park>}
 */
const Park = mongoose.model('Park', parkSchema);

module.exports = Park;
