/**
 * Thingy resource router of the REST API.
 * @module thingyRoutes
 */
const { Router } = require('express');
const {
  getThingDescription,
  getProperty,
  getStatisticOfProperty,
  getButtonTimer,
  setBuzzer,
  setLEDColor,
  getRating,
} = require('../../controllers/thingyController');

/**
 * The Thingy resource router.
 * @typedef {Router}
 */
const router = Router();

router.route('/:thingyId').get(getThingDescription);

/**
 * @swagger
 * components:
 *   schemas:
 *     PropertyData:
 *       type: object
 *       properties:
 *         device:
 *           type: string
 *           description: The ID of the Thingy device.
 *           example: blue-2
 *         measurement:
 *           type: string
 *           description: The measurement type (e.g., 'thingy91').
 *           example: thingy91
 *         property:
 *           type: string
 *           description: The property being measured (e.g., 'TEMP', 'HUMID', 'CO2_EQUIV', etc.).
 *           example: TEMP
 *         value:
 *           type: number
 *           description: The value of the property.
 *           example: 26.1
 *         time:
 *           type: string
 *           description: The timestamp of the data.
 *           example: 2023-11-11T15:17:20.87Z
 */

/**
 * @swagger
 * /things/{thingyId}/properties/{property}:
 *   get:
 *     tags:
 *       - Thingy
 *     summary: Returns list of property records based on a given time interval
 *     description: ''
 *     operationId: getProperty
 *     parameters:
 *       - name: thingyId
 *         in: path
 *         description: ID of the thingy to query
 *         required: true
 *         schema:
 *           type: string
 *       - name: property
 *         in: path
 *         description: The property to retrieve (e.g., 'TEMP', 'HUMID', 'CO2_EQUIV', etc.).
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: successful operation
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
 *                     points:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/PropertyData'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               status: error
 *               message: An error occurred while fetching data ...
 */
router.route('/:thingyId/properties/:property').get(getProperty);

/**
 * @swagger
 * /things/{thingyId}/properties/BUTTON/timer:
 *   get:
 *     tags:
 *       - Thingy
 *     summary: Returns the timer based on Button clicks for a specific Thingy
 *     description: ''
 *     operationId: getButtonTimer
 *     parameters:
 *       - name: thingyId
 *         in: path
 *         description: ID of the Thingy to query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: successful operation
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
 *                     days:
 *                       type: integer
 *                       example: 0
 *                     hours:
 *                       type: integer
 *                       example: 5
 *                     minutes:
 *                       type: integer
 *                       example: 3
 *                     seconds:
 *                       type: string
 *                       example: "8"
 *       '400':
 *         description: Bad request. Invalid parameters provided or no timer started.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: fail
 *                 error:
 *                   type: object
 *                   properties:
 *                     statusCode:
 *                       type: integer
 *                       example: 400
 *                     status:
 *                       type: string
 *                       example: fail
 *                     isOperational:
 *                       type: boolean
 *                       example: true
 *                 message:
 *                   type: string
 *                   example: No timer has been started for the last 2d
 *                 stack:
 *                   type: string
 *                   example: No timer has been started for the last 2d ...
 */
router.route('/:thingyId/properties/BUTTON/timer').get(getButtonTimer);

/**
 * @swagger
 * /things/{thingyId}/properties/{property}/statistics/{statistic}:
 *   get:
 *     tags:
 *       - Thingy
 *     summary: Returns statistics for a specific property of a Thingy based on a given time interval
 *     description: ''
 *     operationId: getStatisticOfProperty
 *     parameters:
 *       - name: thingyId
 *         in: path
 *         description: ID of the Thingy to query
 *         required: true
 *         schema:
 *           type: string
 *       - name: property
 *         in: path
 *         description: The property to retrieve statistics for (e.g., 'TEMP', 'HUMID', 'CO2_EQUIV', etc.).
 *         required: true
 *         schema:
 *           type: string
 *       - name: statistic
 *         in: path
 *         description: The statistical function to apply (e.g., 'mean', 'stddev', 'min', 'max', etc.).
 *         required: true
 *         schema:
 *           type: string
 *       - name: interval
 *         in: query
 *         description: The time interval for the query.
 *         required: false
 *         schema:
 *           type: string
 *           example: '1h'
 *     responses:
 *       '200':
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: success
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       property:
 *                         type: string
 *                         example: TEMP
 *                       value:
 *                         type: number
 *                         example: 19.508333333333336
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               status: error
 *               message: An error occurred while fetching data ...
 */
router
  .route('/:thingyId/properties/:property/statistics/:statistic')
  .get(getStatisticOfProperty);

/**
 * @swagger
 * /things/{thingyId}/properties/BUZZER/{setting}:
 *   post:
 *     tags:
 *       - Thingy
 *     summary: Turns ON/OFF the Thingy's buzzer
 *     description: ''
 *     operationId: setBuzzer
 *     parameters:
 *       - name: thingyId
 *         in: path
 *         description: ID of the Thingy to control the buzzer
 *         required: true
 *         schema:
 *           type: string
 *       - name: setting
 *         in: path
 *         description: The setting to control the buzzer ('on' or 'off').
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['on', 'off']
 *     responses:
 *       '200':
 *         description: successful operation
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
 *                     message:
 *                       type: string
 *                       example: "{\"appId\":\"BUZZER\",\"data\":{\"frequency\":3000},\"messageType\":\"CFG_SET\"}"
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               status: error
 *               message: An error occurred while processing the request.
 */
router.route('/:thingyId/properties/BUZZER/:setting').post(setBuzzer);

/**
 * @swagger
 * /things/{thingyId}/properties/LED/setColor/{color}:
 *   post:
 *     tags:
 *       - Thingy
 *     summary: Sets the color of the Thingy's LED to the specified color
 *     description: ''
 *     operationId: setLEDColor
 *     parameters:
 *       - name: thingyId
 *         in: path
 *         description: ID of the Thingy to set the LED color
 *         required: true
 *         schema:
 *           type: string
 *       - name: color
 *         in: path
 *         description: The color to set the LED to (e.g., 'green', 'red', 'blue').
 *         required: true
 *         schema:
 *           type: string
 *           enum: ['green', 'red', 'blue']
 *     responses:
 *       '200':
 *         description: successful operation
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
 *                     message:
 *                       type: string
 *                       example: "{\"appId\":\"LED\",\"data\":{\"color\":\"00ff00\"},\"messageType\":\"CFG_SET\"}"
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             example:
 *               status: error
 *               message: An error occurred while processing the request.
 */
router.route('/:thingyId/properties/LED/setColor/:color').post(setLEDColor);

/**
 * @swagger
 * /things/{thingyId}/rating:
 *   get:
 *     tags:
 *       - Thingy
 *     summary: Get the overall rating for the specified Thingy based on environmental conditions
 *     description: Returns the overall rating and individual ratings for various environmental factors.
 *     operationId: getRating
 *     parameters:
 *       - name: thingyId
 *         in: path
 *         description: ID of the Thingy to get the rating
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful operation
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
 *                     TEMP:
 *                       type: string
 *                       example: "4.03"
 *                       description: The rating for temperature
 *                     HUMID:
 *                       type: string
 *                       example: "5.00"
 *                       description: The rating for humidity
 *                     AIR_QUAL:
 *                       type: string
 *                       example: "4.51"
 *                       description: The rating for air quality
 *                     CO2_EQUIV:
 *                       type: string
 *                       example: "4.61"
 *                       description: The rating for CO2 equivalent
 *                     AIR_PRESS:
 *                       type: string
 *                       example: "3.82"
 *                       description: The rating for air pressure
 *                     FinalRating:
 *                       type: number
 *                       format: float
 *                       example: 4.5
 *                       description: The overall final rating
 */
router.route('/:thingyId/rating').get(getRating);

module.exports = router;
