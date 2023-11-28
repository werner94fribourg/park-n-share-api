const { Router } = require('express');
const { protect, restrictTo } = require('../../controllers/authController');
const { getOwnOccupations } = require('../../controllers/occupationController');

const router = Router();

/**
 * @swagger
 * /occupations/my-occupations:
 *   get:
 *     tags:
 *       - Occupation
 *     summary: Route used to get all own occupations (accessible to clients and providers only)
 *     responses:
 *       200:
 *         description: List of all occupations done by the user
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
 *                         $ref: '#/components/schemas/Occupation'
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
  .route('/my-occupations')
  .get(protect, restrictTo('client', 'provider'), getOwnOccupations);

module.exports = router;
