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
  getPinExpiration,
  getGoogleClient,
  validate,
} = require('../../controllers/authController');
const { Router } = require('express');
const {
  getAllUsers,
  deleteUser,
  setRole,
  queryMe,
  getUser,
  uploadUserPhoto,
  resizeUserPhoto,
  updateUser,
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
 *           example: "+41888888888"
 *         photo:
 *           type: string
 *           description: The profile picture of the user
 *           example: http://localhost:3001/public/img/users/default.jpeg
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
 *         message: User recently changed password! Please log in again.
 *     InvalidTokenExample:
 *       summary: The sent token is not valid
 *       value:
 *         status: fail
 *         message: Invalid token!
 *     tokenExpiredExample:
 *       summary: The token has expired and the user needs to reconnect
 *       value:
 *         status: fail
 *         message: your session has expired. Please log in again!
 *     InternalServerExample:
 *       summary: Generic internal server error
 *       value:
 *         status: error
 *         message: Something went wrong. Try Again!
 *     RolePermissionExample:
 *         summary: Forbidden access due to role
 *         value:
 *           status: fail
 *           message: You don't have permission to perform this action.
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
 *     RolePermissionError:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: The status of the response
 *           example: fail
 *         message:
 *           type: string
 *           description: The error message
 *           example: You don't have permission to perform this action.
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
 *         message:
 *           type: string
 *           description: The login success message
 *           example: Please confirm with the PIN code sent to your phone number.
 *         pinCodeExpires:
 *           type: string
 *           description: the expiration date of the pin code validity.
 *           example: 2023-11-02T15:10:49.110Z
 */

/**
 * @swagger
 * /users:
 *   get:
 *     tags:
 *       - User
 *     summary: Route used to get all the users
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
 *     requestBody:
 *       description: The datas of the user that wants to register
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *              - username
 *              - email
 *              - phone
 *              - password
 *              - passwordConfirm
 *            properties:
 *              username:
 *                type: string
 *                description: The username of the user
 *                example: johndoe25
 *              email:
 *                type: string
 *                description: The email of the user
 *                example: johndoe@example.com
 *              phone:
 *                type: string
 *                description: The phone number of the user
 *                example: +41735671389
 *              password:
 *                type: string
 *                description: The password of the user
 *                example: Test@1234
 *              passwordConfirm:
 *                type: string
 *                description: The password confimation
 *                example: Test@1234
 *     responses:
 *       201:
 *         description: The successful registration status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessLogin'
 *       400:
 *         description: Incorrect field validation
 *         content:
 *           application/json:
 *             examples:
 *               invalidInputExample:
 *                 summary: Invalid field
 *                 value:
 *                   status: fail
 *                   message: Invalid input data.
 *                   fields: [email: Please provide a valid email address.]
 *               duplicateFieldExample:
 *                 summary: Duplicate field value (email or username)
 *                 value:
 *                   status: fail
 *                   message: "Duplicate field value: \"werner97@hotmail.com\". Please use another value!"
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
 *     requestBody:
 *       description: The credentials of the user that wants to connect
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - password
 *            properties:
 *              email:
 *                type: string
 *                description: The email of the user
 *                example: johndoe@example.com
 *              password:
 *                type: string
 *                description: The password of the user
 *                example: Test@1234
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
 *     requestBody:
 *       description: The email and the pin code received of the user
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *              - email
 *              - pinCode
 *            properties:
 *              email:
 *                type: string
 *                description: The email of the user
 *                example: johndoe@example.com
 *              pinCode:
 *                type: number
 *                description: The pin code received by the user
 *                example: 146797
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
 * /users/pin-expiration:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Route used to get the pin expiration of an user
 *     parameters:
 *       - name: email
 *         in: path
 *         description: 'The email of the user for whom we want to retrieve the confirmation delay'
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: The pin expiration date of an user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   description: The status of the response
 *                   example: success
 *                 pinCodeExpires:
 *                   type: string
 *                   description: the expiration date of the pin code validity.
 *                   example: 2023-11-02T15:10:49.110Z
 *       404:
 *         description: Non existing PIN code
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
 *                   example: No PIN code generated by this user.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/:email/pin-expiration').get(getPinExpiration);

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
 *            required:
 *              - passwordCurrent
 *              - password
 *              - passwordConfirm
 *            properties:
 *              passwordCurrent:
 *                type: string
 *                description: The actual password of the user
 *                example: Test@1234
 *              password:
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
 *       400:
 *         description: Incorrect field validation
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
 *                   example: Invalid input data.
 *                 fields:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       password:
 *                         type: string
 *                         example: Please provide a valid password.
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
 *     security:
 *       - bearerAuth: []
 */
router.route('/change-password').patch(protect, changePassword);

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
 *                   example: Reset password link sent to your email!
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             examples:
 *               emailSendingExample:
 *                 summary: E-mail sending error
 *                 value:
 *                   status: error
 *                   message: There was an error sending the email. Try Again!'
 *               internalServerErrorExample:
 *                 summary: Generic internal server error
 *                 value:
 *                   status: error
 *                   message: Something went wrong. Try Again!
 */
router.route('/forgot-password').post(forgotPassword);

/**
 * @swagger
 * /users/reset-password/{resetToken}:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Route used to check the validity of a reset password link
 *     parameters:
 *       - name: resetToken
 *         in: path
 *         description: 'The reset token used to reset the password of an user (accessible via a link sent to the user by e-mail)'
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       description: The new password to store.
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
 *                description: The new password of the user
 *                example: Test@12345
 *              passwordConfirm:
 *                type: string
 *                description: The confirmation of the new password
 *                example: Test@12345
 *     responses:
 *       200:
 *         description: The validity of the reset link
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
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 *   patch:
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
 *         description: Successful password reset
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
 *                   example: Password successfully changed!
 *       400:
 *         description: Incorrect link or field validation
 *         content:
 *           application/json:
 *             examples:
 *               invalidInputExample:
 *                 summary: Incorrect field validation
 *                 value:
 *                   status: fail
 *                   message: Invalid input data.
 *                   fields: [password: Please provide a valid password.]
 *               invalidResetLinkExample:
 *                 summary: Invalid reset link (confirmation time expired or inexistant token)
 *                 value:
 *                   status: fail
 *                   message: The link is invalid or has expired.
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
  .patch(resetPassword);

router.use(protect);
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     tags:
 *       - User
 *     summary: Route used to delete an user from the platform
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The id of the user we want to delete
 *         required: true
 *         type: string
 *     responses:
 *       204:
 *         description: Successful deletion
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
 *         description: Role related errors
 *         content:
 *           application/json:
 *             examples:
 *               RolePermissionExample:
 *                 summary: Forbidden access due to role
 *                 $ref: '#/components/examples/RolePermissionExample'
 *               AdminDeletionExample:
 *                 summary: Admin user deletion attempt
 *                 value:
 *                   status: fail
 *                   message: You can't delete an admin user.
 *       404:
 *         description: Non existing user deletion attempt
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
 *                   example: The requested user doesn't exist or was deleted.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 *     security:
 *       - bearerAuth: []
 */
router.route('/:id').delete(restrictTo('admin'), deleteUser);

/**
 * @swagger
 * /users/me:
 *   get:
 *     tags:
 *       - User
 *     summary: Route used to get the personal informations of the connected user
 *     responses:
 *       200:
 *         description: The logged user
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
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
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 *     security:
 *       - bearerAuth: []
 *   patch:
 *     tags:
 *       - User
 *     summary: Route used to modify the personal informations of the connected user
 *     requestBody:
 *       description: The new user values (only the profile picture is modifiable at the moment)
 *       content:
 *         multipart/form-data:
 *           schema:
 *            type: object
 *            properties:
 *              photo:
 *                type: string
 *                description: The user's photo
 *                format: binary
 *     responses:
 *       200:
 *         description: The updated informations of the connected user
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *       400:
 *         description: Profile picture format error
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
 *                   example: Not an image! Please upload only images.
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
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 *     security:
 *       - bearerAuth: []
 */
router
  .route('/me')
  .get(queryMe, getUser)
  .patch(queryMe, uploadUserPhoto, resizeUserPhoto, updateUser);

/**
 * @swagger
 * /users/{id}/role:
 *   patch:
 *     tags:
 *       - User
 *     summary: Route used to change the role of an existing user (accessible to admins only)
 *     requestBody:
 *       description: The new role of the user.
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *              - role
 *            properties:
 *              role:
 *                type: string
 *                description: The new role of the user
 *                example: provider
 *     responses:
 *       200:
 *         description: Successful user role change
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
 *                     user:
 *                       $ref: '#/components/schemas/User'
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
 *         description: Role related errors
 *         content:
 *           application/json:
 *             examples:
 *               RolePermissionExample:
 *                 summary: Forbidden access due to role
 *                 $ref: '#/components/examples/RolePermissionExample'
 *               AdminDeletionExample:
 *                 summary: Admin user role changing attempt
 *                 value:
 *                   status: fail
 *                   message: You can't update the role of an admin user.
 *       404:
 *         description: Non existing user
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
 *                   example: The requested user doesn't exist or was deleted.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 *     security:
 *       - bearerAuth: []
 */
router.route('/:id/role').patch(restrictTo('admin'), setRole);

/**
 * @swagger
 * /users/validate:
 *   get:
 *     tags:
 *       - Authentication
 *     summary: Route used to validate the authentication token of the user and return the connected one
 *     responses:
 *       200:
 *         description: The logged user
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
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                           example: 642c38f3b7ed1dbd25858e9e
 *                         email:
 *                           type: string
 *                           example: johndoe@example.com
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
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 *     security:
 *       - bearerAuth: []
 */
router.route('/validate').get(protect, validate);

module.exports = router;
