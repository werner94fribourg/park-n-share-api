/**
 * User resource router of the REST API.
 * @module userRoutes
 */
const { signin, signup } = require('../../controllers/authController');
const { Router } = require('express');
const { getAllUsers } = require('../../controllers/userController');

/**
 * The User resource router.
 * @typedef {Router}
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
 */
router.route('/').get(getAllUsers);

router.route('/signup').get(signup);

router.route('/signin').post(signin);

module.exports = router;
