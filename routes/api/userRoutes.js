/**
 * User resource router of the REST API.
 * @module clientRoutes
 */
const { Router } = require('express');
// const { getAllClients } = require('../../controllers/userController');

const {
    getAllUsers,
    createUser,
    updateUser,
    queryUser,
    getUser,
    deleteUser,
    createOne,
} = require('../../controllers/userController');

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
router.route
    .get("/users", getAllUsers)
    .get("/users/:id", getUser)
    .get("/users/query", queryUser)
    .post("/users/add", createUser)
    .post(createOne)
    .patch("/users/:id/update", updateUser)
    .del("/users/:id", deleteUser);

module.exports = router;
