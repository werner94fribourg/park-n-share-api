/**
 * Main router of the REST API.
 * @module apiRoutes
 */
const { Router } = require('express');
const userRouter = require('./api/userRoutes');
const parkingRouter = require('./api/parkingRoutes');

/**
 * The main router of the application.
 * @type {Router}
 */
const router = Router();

router.use('/users', userRouter);

router.use('/parkings', parkingRouter);

module.exports = router;
