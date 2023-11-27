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
 * @property {mongoose.Schema.ObjectId} client The id reference to the user that occupied the parking during this time.
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
  end: {
    type: Date,
  },
  client: {
    type: Schema.ObjectId,
    ref: 'User',
  },
  parking: {
    type: Schema.ObjectId,
    ref: 'Parking',
  },
  bill: {
    type: Number,
  },
});

/**
 * The Occupation model object generated from mongoose.
 * @type {mongoose.Model<Occupation>}
 */
const Occupation = mongoose.model('Occupation', occupationSchema);

module.exports = Occupation;
