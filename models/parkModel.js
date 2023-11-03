/**
 * Definition of the Park Model used in the application and generating the Park Collection in the MongoDB Database.
 * @module userModel
 */

const mongoose = require('mongoose');

/**
 * The representation of the Park model
 * @typedef Park
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
        maxLength: [30, 'An username must have less or equal than 15 characters.'],
        minlength: [4, 'An username must have at least 4 characters.'],
    },
    description: {
        type: String,
        required: false,
        unique: false,
        lowercase: true,
        trim: true,
    },
    type: {
        type: String,
        required: [true, 'Please provide your parking type.'],
        validate: {
            validator: function (string) {
                return parkType(string).isParkType;
            },
            message: 'Please provide a valid phone number.',
        },
    },
    price: {
        type: String,
        required: true,
        unique: false,
        lowercase: true,
        trim: true,
    },
    date: {
        type: Date,
        select: false,
    },
    location: {
        type: String,
        required: true,
        unique: false,
        lowercase: true,
        trim: true,
    },
    provider: {
        type: String,
        required: false,
        unique: false,
        lowercase: true,
        trim: true,
    },
    phone: {
        type: String,
        required: [true, 'Please provide your phone number.'],
        unique: [true, 'The provided phone number is not available.'],
        validate: {
            validator: function (number) {
                return phone(number).isValid;
            },
            message: 'Please provide a valid phone number.',
        },
    },
    email: {
        type: String,
        required: [true, 'Please provide your email.'],
        unique: true,
        validate: [isEmail, 'Please provide a valid email address.'],
        lowercase: true,
        trim: true,
    },
    photo: {
        type: String,
        trim: true,
        default: 'defaultPark.jpg',
    },
    isPending: {
        type: Boolean,
        default: true,
        select: false,
    },
});

/**
 * Function used to generate the absolute path location of the profile picture of an user before sending it back to the client that requested it.
 */
parkSchema.methods.generateFileAbsolutePath = function () {
    if (this.photo) this.photo = `${BACKEND_URL}/${PARK_FOLDER}/${this.photo}`;
};

/**
 * The Park model object generated from mongoose.
 * @type {mongoose.Model<Park>}
 */
const Park = mongoose.model('Park', parkSchema);

module.exports = Park;
