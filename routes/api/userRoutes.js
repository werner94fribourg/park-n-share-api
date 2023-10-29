/**
 * User resource router of the REST API.
 * @module userRoutes
 */
const {
    signin,
    signup,
    confirmPin,
    protect,
    sendConfirmationEmail,
    confirmEmail,
    restrictTo,
    changePassword,
    forgotPassword,
    isResetLinkValid,
    resetPassword,
} = require('../../controllers/authController');
const {Router} = require('express');
const {
    getAllUsers,
    deleteUser,
    setRole
} = require('../../controllers/userController');

/**
 * The User resource router.
 * @type {Router}
 */
const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The id of the user
 *           example: 642c38f3b7ed1dbd25858e9e
 *         username:
 *           type: string
 *           description: The username of the user
 *           example: johndoe27
 *         email:
 *           type: string
 *           description: The email of the user
 *           example: johndoe@example.com
 *         phone:
 *           type: string
 *           description: The phone number of the user
 *           example: +41888888888
 *         role:
 *           type: string
 *           description: The role of the user
 *           example: client
 */

/**
 * @swagger
 * components:
 *   examples:
 *     notLoggedInExample:
 *       summary: User Not logged in
 *       value:
 *         status: fail
 *         message: You are not logged in! Please log in to get access to this route.
 *     accountNotFoundExample:
 *       summary: Account not found or deleted
 *       value:
 *         status: fail
 *         message: The requested account doesn't exist or was deleted.
 *     passwordChangedExample:
 *       summary: Password changed after the token was issued
 *       value:
 *         status: fail
 *         message: User recently changed password ! Please log in again.
 *     InvalidTokenExample:
 *       summary: The sent token is not valid
 *       value:
 *         status: fail
 *         message: Invalid token!
 *     tokenExpiredExample:
 *       summary: The token has expired and the user needs to reconnect
 *       value:
 *         status: fail
 *         message: Your token has expired. Please log in again!
 *     InternalServerExample:
 *       summary: Generic internal server error
 *       value:
 *         status: error
 *         message: Something went wrong. Try Again!
 */
/**
 * @swagger
 * components:
 *   schemas:
 *     ServerError:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: The status of the response
 *           example: error
 *         message:
 *           type: string
 *           description: The error message
 *           example: Something went wrong. Try Again!
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     SuccessLogin:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: The login status of the user
 *           example: success
 *         username:
 *           type: string
 *           description: The login success message
 *           example: Please confirm with the PIN code sent to your phone number.
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - User
 *     summary: Route used to get all the users (students and teachers) in the application
 *     responses:
 *       200:
 *         description: List of all users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     users:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/User'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/').get(getAllUsers);

/**
 * @swagger
 * /users/signup:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Route used to signup an user
 *     responses:
 *       201:
 *         description: The successful registration status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessLogin'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             examples:
 *               InternalServerExample:
 *                 $ref: '#/components/examples/InternalServerExample'
 *               pinSendingExample:
 *                 summary: Pin code sending error
 *                 value:
 *                   status: error
 *                   message: There was an error sending the pin code. Please retry or contact us at admin@parknshare.com.
 */
router.route('/signup').post(signup);

/**
 * @swagger
 * /users/signin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Route used to signin an user
 *     responses:
 *       200:
 *         description: The successful login status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessLogin'
 *       400:
 *         description: Missing fields
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Please provide email and password!
 *       401:
 *         description: Incorrect credentials
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Incorrect credentials.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             examples:
 *               InternalServerExample:
 *                 $ref: '#/components/examples/InternalServerExample'
 *               pinSendingExample:
 *                 summary: Pin code sending error
 *                 value:
 *                   status: error
 *                   message: There was an error sending the pin code. Please retry or contact us at admin@parknshare.com.
 */
router.route('/signin').post(signin);

/**
 * @swagger
 * /users/confirm-pin:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Route used to confirm the pin code sent to the user in the signin or signup process
 *     responses:
 *       200:
 *         description: The successful pin confirmation status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: The status of the response
 *                   example: success
 *                 token:
 *                   type: string
 *                   description: The login token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MmJmN2I3YWIzOTY2Njc5MmZlNWE2ZiIsImlhdCI6MTY4MDYwNDUxMCwiZXhwIjoxNjgwNjA4MTEwfQ.o7R-5d-mb7mmi3EychbcIl_AfHW6Cuq0SGOo0UG99V4
 *                 message:
 *                   type: string
 *                   description: The success PIN confirmation message
 *                   example: Welcome back!
 *       401:
 *         description: Invalid PIN code
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Invalid PIN Code.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/confirm-pin').post(confirmPin);

/**
 * @swagger
 * /users/send-confirmation-email:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Route used by a connected user to send an email confirmation link to his email address
 *     responses:
 *       200:
 *         description: The successful email confirmation link generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: The status of the response
 *                   example: success
 *                 message:
 *                   type: string
 *                   description: The success confirmation email generation
 *                   example: Confirmation email successfully sent to your address.
 *       401:
 *         description: User login problems
 *         content:
 *           application/json:
 *             examples:
 *               notLoggedInExample:
 *                 $ref: '#/components/examples/notLoggedInExample'
 *               accountNotFoundExample:
 *                 $ref: '#/components/examples/accountNotFoundExample'
 *               passwordChangedExample:
 *                 $ref: '#/components/examples/passwordChangedExample'
 *               InvalidTokenExample:
 *                 $ref: '#/components/examples/InvalidTokenExample'
 *               tokenExpiredExample:
 *                 $ref: '#/components/examples/tokenExpiredExample'
 *       403:
 *         description: Email already confirmed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Your email address was already confirmed.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             examples:
 *               InternalServerExample:
 *                 $ref: '#/components/examples/InternalServerExample'
 *               pinSendingExample:
 *                 summary: Pin code sending error
 *                 value:
 *                   status: error
 *                   message: There was an error sending the confirmation email. Please contact us at admin@parknshare.com!
 *     security:
 *       - bearerAuth: []
 */
router.route('/send-confirmation-email').get(protect, sendConfirmationEmail);

/**
 * @swagger
 * /users/confirm-email/{confToken}:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Route used to confirm the email address of a user.
 *     parameters:
 *       - name: confToken
 *         in: path
 *         description: 'The confirmation token used to validate the email confirmation of an user (accessible via a link sent to the user by e-mail)'
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Successful Email Confirmation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: The status of the response
 *                   example: success
 *                 message:
 *                   type: string
 *                   description: The successful email confirmation message
 *                   example: Email address successfully confirmed.
 *       404:
 *         description: Invalid confirmation token (confirmation time expired or inexistant token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Invalid link!
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/confirm-email/:confToken').patch(confirmEmail);

/**
 * @swagger
 * /users/change-password:
 *   patch:
 *     tags:
 *       - Authentication
 *     summary: Route used to change the password when the user is logged in.
 *     requestBody:
 *       description: The previous password and the new one to store.
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            properties:
 *              passwordCurrent:
 *                type: string
 *                description: The actual password of the user
 *                example: Test@1234
 *              description:
 *                type: string
 *                description: The new password of the user
 *                example: Test@12345
 *              passwordConfirm:
 *                type: string
 *                description: The confirmation of the new password
 *                example: Test@12345
 *     responses:
 *       200:
 *         description: The successful pin confirmation status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: The status of the response
 *                   example: success
 *                 token:
 *                   type: string
 *                   description: The login token
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MmJmN2I3YWIzOTY2Njc5MmZlNWE2ZiIsImlhdCI6MTY4MDYwNDUxMCwiZXhwIjoxNjgwNjA4MTEwfQ.o7R-5d-mb7mmi3EychbcIl_AfHW6Cuq0SGOo0UG99V4
 *                 message:
 *                   type: string
 *                   description: The success password update message
 *                   example: Password successfully updated.
 *       401:
 *         description: User login problems
 *         content:
 *           application/json:
 *             examples:
 *               notLoggedInExample:
 *                 $ref: '#/components/examples/notLoggedInExample'
 *               accountNotFoundExample:
 *                 $ref: '#/components/examples/accountNotFoundExample'
 *               passwordChangedExample:
 *                 $ref: '#/components/examples/passwordChangedExample'
 *               InvalidTokenExample:
 *                 $ref: '#/components/examples/InvalidTokenExample'
 *               tokenExpiredExample:
 *                 $ref: '#/components/examples/tokenExpiredExample'
 *               incorrectCredentialsExample:
 *                 summary: Wrong current password
 *                 value:
 *                   status: fail
 *                   message: Your current password is wrong.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/change-password').patch(protect, changePassword);


//TODO: create swagger documentation delete user
router.route('/:id').delete(protect, deleteUser);


//TODO: create swagger documentation
router.route('/set-role').patch(protect, restrictTo('admin'), setRole);


/**
 * @swagger
 * /users/forgot-password:
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Route used to send a forgot password request
 *     requestBody:
 *       description: The email of the user
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *            properties:
 *              email:
 *                type: string
 *                description: The user's email
 *                example: test@example.com
 *     responses:
 *       200:
 *         description: Successful change link sent to email
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 message:
 *                   type: string
 *                   example: Reset link sent to email!
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               emailSendingExample:
 *                 summary: E-mail sending error
 *                 value:
 *                   status: error
 *                   message: There was an error sending the email. Try Again !'
 *               internalServerErrorExample:
 *                 summary: Generic internal server error
 *                 value:
 *                   status: error
 *                   message: Something went wrong. Try Again !
 */
//TODO: change forgot-password and reset-password/:resetToken
router.route('/forgot-password').post(forgotPassword);

/**
 * @swagger
 * /users/reset-password/{resetToken}:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Route used to get the validity of a reset password token link
 *     parameters:
 *       - name: resetToken
 *         in: path
 *         description: 'The reset token used to reset the password of an user (accessible via a link sent to the user by e-mail)'
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The validity of the reset token link
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: object
 *                   properties:
 *                     valid:
 *                       type: boolean
 *                       example: false
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               emailSendingExample:
 *                 summary: E-mail sending error
 *                 value:
 *                   status: error
 *                   message: There was an error sending the confirmation email. Please contact us at admin-learn@home.com!
 *               internalServerErrorExample:
 *                 summary: Generic internal server error
 *                 value:
 *                   status: error
 *                   message: Something went wrong. Try Again !
 *   post:
 *     tags:
 *       - Authentication
 *     summary: Route used to reset a forgotten password
 *     parameters:
 *       - name: resetToken
 *         in: path
 *         description: 'The reset token used to reset the password of an user (accessible via a link sent to the user by e-mail)'
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The new password of the user
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *              - password
 *              - passwordConfirm
 *            properties:
 *              password:
 *                type: string
 *                description: The user's new password
 *                example: Test@1234
 *              passwordConfirm:
 *                type: string
 *                description: The user's new password confirmation
 *                example: Test@1234
 *     responses:
 *       200:
 *         description: Successful reset
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 token:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY0MmJmN2I3YWIzOTY2Njc5MmZlNWE2ZiIsImlhdCI6MTY4MDYwNDUxMCwiZXhwIjoxNjgwNjA4MTEwfQ.o7R-5d-mb7mmi3EychbcIl_AfHW6Cuq0SGOo0UG99V4
 *                 message:
 *                   type: string
 *                   example: Password successfully changed !
 *       400:
 *         description: Invalid reset token (confirmation time expired or inexistant token)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 message:
 *                   type: string
 *                   example: Token is invalid or has expired.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router
    .route('/reset-password/:resetToken')
    .get(isResetLinkValid)
    .post(resetPassword);

module.exports = router;
