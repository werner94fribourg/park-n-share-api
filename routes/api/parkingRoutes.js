/**
 * Park resource router of the REST API.
 * @module parkRoutes
 */

const { Router } = require('express');
const {
    handleParkingQuery,
    getAllParkings,
} = require('../../controllers/parkingController');

/**
 * The Park resource router.
 * @type {Router}
 */
const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Park:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The id of the parking
 *           example: 642c38f3b7ed1dbd25858e9e
 *         title:
 *           type: string
 *           description: The parking slot title
 *           example: Beautiful parking slot
 *         description:
 *           type: string
 *           description: The description of the parking slot
 *           example: Lovely parking slot in the center.
 *         parkType:
 *           type: string
 *           description: The parking place type
 *           example: "indoor"
*          isOccupied:
 *           type: boolean
 *           description: The current occupancy of the parking slot
 *           example: "true"
 *         isPending:
 *           type: boolean
 *           description: The current parking slot status.
 *           example: "true"
 *         price:
 *           type: number
 *           description: The price for the parking slot rental
 *           example: "3.50"
 *         location:
 *           type: string
 *           description: The location of the parking slot
 *           example: "°12.4734629, "95.3197769"
 *         photo:
 *           type: string
 *           description: The parking slot pictures displayed.
 *           example: http://localhost:3001/public/img/parkings/default.jpeg
 */

/**
 * @swagger
 * components:
 *   examples:
 *     QueryNotFound:
 *       summary: Query is empty
 *       value:
 *         status: fail
 *         message: The Query does not provide any result.
 *     QueryMismatch:
 *       summary: Wrong query
 *       value:
 *         status: fail
 *         message: The given query does not exist
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
 *     QueryError:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: The status of the response
 *           example: fail
 *         message:
 *           type: string
 *           description: The error message
 *           example: The given query does not exist.
 *     QueryNotFound:
 *       type: object
 *       properties:
 *         status:
 *           type: string
 *           description: The status of the response
 *           example: fail
 *         message:
 *           type: string
 *           description: The error message
 *           example: The given query does not provide any result.
 */

/**
 * @swagger
 * /parks:
 *   get:
 *     tags:
 *       - Parking
 *     summary: Route used to get all the parking places
 *     responses:
 *       200:
 *         description: Query of all parking places
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
 *                         $ref: '#/components/schemas/Parking'
 *      404:
 *         description: Query not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: "the query did not produce any result"
 *                 data:
 *                   type: object
 *                   properties:
 *                     parks:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Parking'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/parkings').get(handleParkingQuery, getAllParkings);