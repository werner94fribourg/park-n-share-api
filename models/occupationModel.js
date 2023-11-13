/**
 * Definition of the Occupation Model used in the application and generating the Occupation Collection in the MongoDB Database.
 * @module occupationModel
 */

const { mongoose, Schema } = require('mongoose');

/**
 * The representation of the Occupation model
 * @typedef Occupation
 * @property {Date} start The starting time of the occupation.
 * @property {Date} end The end time of the occupation.
 * @property {mongoose.Schema.ObjectId} parking The id reference to the parking that is occupied during this time.
 */

/**
 * The Occupation schema object generated from mongoose.
 * @type {mongoose.Schema<Occupation>}
 */
const occupationSchema = new mongoose.Schema({
  start: {
    type: Date,
  },
  endOccupation: {
    type: Date,
  },
  parking: {
    type: Schema.ObjectId,
    ref: 'Parking',
  },
});

/**
 * The Occupation model object generated from mongoose.
 * @type {mongoose.Model<Occupation>}
 */
const Occupation = mongoose.model('Occupation', occupationSchema);

module.exports = Occupation;
