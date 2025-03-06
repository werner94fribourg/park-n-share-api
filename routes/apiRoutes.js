/**
 * Main router of the REST API.
 * @module apiRoutes
 */
const { Router } = require('express');

const userRouter = require('./api/userRoutes');
const parkingRouter = require('./api/parkingRoutes');
const occupationRouter = require('./api/occupationRoutes');

/**
 * The main router of the application.
 * @type {Router}
 */
const router = Router();

router.use('/users', userRouter);

router.use('/parkings', parkingRouter);

router.use('/occupations', occupationRouter);

module.exports = router;
