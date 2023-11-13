/**
 * Park resource router of the REST API.
 * @module parkRoutes
 */

const { Router } = require('express');
const {
    getAllParkings,
} = require('../../controllers/parkController');

/**
 * The Park resource router.
 * @type {Router}
 */
const router = Router();

// ToDo: finish to adapt swagger to parking and its attributes
/**
 * @swagger
 * components:
 *   schemas:
 *     Park:
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
 *         message: Your token has expired. Please log in again!
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
 *         username:
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
 * /parks:
 *   get:
 *     tags:
 *       - Park
 *     summary: Route used to get all the parking places
 *     responses:
 *       200:
 *         description: List of all parking places
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
 *                     parks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Park'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/search').get(getAllParkings);