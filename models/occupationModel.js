/**
 * Definition of the Occupation Model used in the application and generating the Occupation Collection in the MongoDB Database.
 * @module occupationModel
 */

const { mongoose, Schema } = require('mongoose');

/**
 * The representation of the Occupation model
 * @typedef Occupation
 * @property {string} username The username of the user.
 * @property {string} email The email of the user.
 * @property {string} phone The phone number of the user.
 * @property {string} photo The profile picture of the user.
 * @property {string} password The password of the user.
 * @property {string} passwordConfirm The password confirmation of the user, which will not be stored in the database.
 * @property {string} role The role of the user.
 * @property {Date} passwordChangedAt The last moment where the user changed his password.
 * @property {string} passwordResetToken The hashed email reset token, generated in the reset email sent to the user when he has forgotten his password.
 * @property {Date} passwordResetExpires The expiration time of the reset email validity.
 * @property {boolean} isConfirmed The confirmation status of the user.
 * @property {string} pinCode The hashed pin code sent to the user when he's trying to connect / register.
 * @property {Date} pinCodeExpires The expiration time of the pin code validity.
 * @property {boolean} isEmailConfirmed The confirmation status of the email address.
 * @property {string} confirmEmailToken The hashed email confirmation token, generated in the confirmation email sent to the user.
 * @property {Date} confirmEmailExpires The expiration time of the confirmation email validity.
 * @property {boolean} isDeactivated The activation status of the account.
 * @property {Date} isDeactivatedAt The deactivation date of the account.
 */

/**
 * The Occupation schema object generated from mongoose.
 * @type {mongoose.Schema<Occupation>}
 */
const occupationSchema = new mongoose.Schema({
    title: {
        type: Schema.ObjectId,
        ref: 'Park'
    },
    startOccupation: {
        type: Date,
    },
    endOccupation: {
        type: Date,
    }
});

/**
 * The Park model object generated from mongoose.
 * @type {mongoose.Model<Occupation>}
 */
const Occupation = mongoose.model('Occupation', occupationSchema);

module.exports = Occupation;
