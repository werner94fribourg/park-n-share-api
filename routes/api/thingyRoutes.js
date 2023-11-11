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
} = require('../../controllers/thingyController');

/**
 * The Thingy resource router.
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
 *     summary: Route used to get the Thingy's ThingDescription
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
router.route('/').get(getThingDescription);

/**
 * @swagger
 * /thingy/
 */
router.route('/properties/:property').get(getProperty);
router.route('/properties/BUTTON/timer').get(getButtonTimer);
router
  .route('/properties/:property/statistics/:statistic')
  .get(getStatisticOfProperty);
router.route('/properties/BUZZER/:setting').post(setBuzzer);
router.route('/properties/LED/setColor/:color').post(setLEDColor);

module.exports = router;
