/**
 * Parking resource router of the REST API.
 * @module parkingRoutes
 */

const { Router } = require('express');
const {
  handleParkingQuery,
  getAllParkings,
  uploadParkingImages,
  saveParkingImages,
  createParking,
  getParking,
  validateParking,
} = require('../../controllers/parkingController');
const {
  protect,
  restrictTo,
  checkConnected,
  checkProvider,
} = require('../../controllers/authController');

/**
 * The Parking resource router.
 * @type {Router}
 */
const router = Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Parking:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *           description: The id of the parking
 *           example: 642c38f3b7ed1dbd25858e9e
 *         name:
 *           type: string
 *           description: The name of the parking slot
 *           example: Beautiful parking slot
 *         description:
 *           type: string
 *           description: The description of the parking slot
 *           example: Lovely parking slot in the center.
 *         type:
 *           type: string
 *           description: The type of the parking slot (indoor or outdoor)
 *           example: "indoor"
 *         price:
 *           type: number
 *           description: The hourly price for the parking slot rental
 *           example: 3.50
 *         location:
 *           type: object
 *           properties:
 *             type:
 *               type: string
 *               example: Point
 *             coordinates:
 *               type: array
 *               example: [-80.185942, 25.774772]
 *               maxItems: 2
 *             street:
 *               type: string
 *               example: Boulevard de Pérolles
 *             housenumber:
 *               type: string
 *               example: 90
 *             postcode:
 *               type: string
 *               example: 1700
 *             city:
 *               type: string
 *               example: Fribourg
 *         owner:
 *           type: object
 *           properties:
 *             _id:
 *               type: string
 *               example: 642c38f3b7ed1dbd25858e9e
 *             username:
 *               type: string
 *               example: johndoe27
 *         photos:
 *           type: array
 *           items:
 *            type: string
 *            example: http://localhost:3001/public/img/parkings/default.jpeg
 *           description: The parking slot pictures.
 */

/**
 * @swagger
 * /parkings:
 *   get:
 *     tags:
 *       - Parking
 *     summary: Route used to get all existing parkings
 *     parameters:
 *       - name: isOccupied
 *         in: query
 *         description: 'The occupation state of the parking'
 *         schema:
 *           type: boolean
 *           example: true
 *       - name: minPrice
 *         in: query
 *         description: 'The minimal hourly price of the parking'
 *         schema:
 *           type: number
 *           example: 23.5
 *       - name: maxPrice
 *         in: query
 *         description: 'The maximal hourly price of the parking'
 *         schema:
 *           type: number
 *           example: 42.7
 *       - name: type
 *         in: query
 *         description: 'The type of the parking'
 *         schema:
 *           type: string
 *           enum: [indoor, outdoor]
 *           example: indoor
 *       - name: location
 *         in: query
 *         description: 'The name of the municipality (in Switzerland) from which we want to retrieve the parkings'
 *         schema:
 *           type: string
 *           example: Fribourg
 *       - name: lat
 *         in: query
 *         description: 'The latitude coordinate of the location from which we want to retrieve the parkings'
 *         schema:
 *           type: number
 *           example: 46.7446
 *       - name: lng
 *         in: query
 *         description: 'The longitude coordinate of the location from which we want to retrieve the parkings'
 *         schema:
 *           type: number
 *           example: 7.15453
 *       - name: distance
 *         in: query
 *         description: 'The distance perimeter of the searched municipality from which we want to retrieve the parkings (5km by default if not specified)'
 *         schema:
 *           type: number
 *           example: 5
 *     responses:
 *       200:
 *         description: List of all parkings
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
 *                     parkings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Parking'
 *       400:
 *         description: Query filter problems
 *         content:
 *           application/json:
 *             examples:
 *               isOccupiedExample:
 *                 summary: Occupation field is not a boolean
 *                 value:
 *                   status: fail
 *                   message: Please provide true or false for the occupation variable.
 *               minPriceExample:
 *                 summary: Minimum price field is not a number
 *                 value:
 *                   status: fail
 *                   message: Please provide a numerical value for the minimum price.
 *               maxPriceExample:
 *                 summary: Maximum price field is not a number
 *                 value:
 *                   status: fail
 *                   message: Please provide a numerical value for the maximum price.
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 *   post:
 *     tags:
 *       - Parking
 *     summary: Route used to create a new parking (accessible to clients and providers only)
 *     requestBody:
 *       description: The new parking we want to create
 *       content:
 *         application/json:
 *           schema:
 *            type: object
 *            required:
 *              - name
 *              - description
 *              - price
 *              - coordinates
 *            properties:
 *              name:
 *                type: string
 *                description: The name of the parking slot
 *                example: Beautiful parking
 *              description:
 *                type: string
 *                description: The description of the parking slot
 *                example: Beautiful parking slot situated in Fribourg.
 *              type:
 *                type: string
 *                description: The type of the parking slot (indoor/outdoor)
 *                example: indoor
 *              price:
 *                type: number
 *                description: The hourly price of the parking slot
 *                example: 2.5
 *              coordinates:
 *                type: array
 *                description: The coordinates of the parking slot (lat/long)
 *                example: [7.1455, 47.699]
 *                maxItems: 2
 *         multipart/form-data:
 *           schema:
 *            type: object
 *            required:
 *              - name
 *              - description
 *              - price
 *              - coordinates
 *            properties:
 *              name:
 *                type: string
 *                description: The name of the parking slot
 *                example: Beautiful parking
 *              description:
 *                type: string
 *                description: The description of the parking slot
 *                example: Beautiful parking slot situated in Fribourg.
 *              type:
 *                type: string
 *                description: The type of the parking slot (indoor/outdoor)
 *                example: indoor
 *              price:
 *                type: number
 *                description: The hourly price of the parking slot
 *                example: 2.5
 *              coordinates:
 *                type: array
 *                description: The coordinates of the parking (lat/long)
 *                example: [7.1455, 47.699]
 *                maxItems: 2
 *              photos:
 *                type: array
 *                items:
 *                  type: string
 *                  description: The photos of the parkings slot
 *                  format: binary
 *     responses:
 *       201:
 *         description: The new created parking
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
 *                   example: Your parking was submitted for validation.
 *                 data:
 *                   type: object
 *                   properties:
 *                     parking:
 *                       $ref: '#/components/schemas/Parking'
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
 *                   fields: [name: A parking slot name can't be longer than 30 characters.]
 *               parkingPicturesFormatExample:
 *                 summary: Parking pictures format error
 *                 value:
 *                   status: fail
 *                   message: Not an image! Please upload only images.
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
 *         description: Forbidden access due to role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolePermissionError'
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
  .route('/')
  .get(handleParkingQuery, checkConnected, getAllParkings)
  .post(
    protect,
    restrictTo('client', 'provider'),
    uploadParkingImages,
    saveParkingImages,
    createParking,
  );

/**
 * @swagger
 * /parkings/my-parkings:
 *   get:
 *     tags:
 *       - Parking
 *     summary: Route used to get all provided parkings (accessible to providers only)
 *     responses:
 *       200:
 *         description: List of all parkings provided by the user
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
 *                     parkings:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Parking'
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
 *         description: Forbidden access due to role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolePermissionError'
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
  .route('/my-parkings')
  .get(protect, restrictTo('provider'), checkProvider, getAllParkings);

/**
 * @swagger
 * /parkings/{id}:
 *   get:
 *     tags:
 *       - Parking
 *     summary: Route used to get a single parking
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The id of the parking we want to retrieve
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: The retrieved parking
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
 *                     parking:
 *                       $ref: '#/components/schemas/Parking'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ServerError'
 */
router.route('/:id').get(checkConnected, getParking);

// ToDo: add swagger
/**
 * @swagger
 * /parkings/{id}/validate:
 *   patch:
 *     tags:
 *       - Parking
 *     summary: Route used to validate a parking requested by an user (accessible to admins only)
 *     parameters:
 *       - name: id
 *         in: path
 *         description: The id of the parking we want to validate
 *         required: true
 *         type: string
 *     responses:
 *       200:
 *         description: The updated validated parking
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
 *                     parking:
 *                       $ref: '#/components/schemas/Parking'
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
 *         description: Forbidden access due to role
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RolePermissionError'
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
  .route('/:id/validate')
  .patch(protect, restrictTo('admin'), validateParking);

module.exports = router;
