/**
 * Main router of the REST API.
 * @module apiRoutes
 */
const { Router } = require('express');
const userRouter = require('./api/userRoutes');

/**
 * The main router of the application.
 * @typedef {Router}
 */
const router = Router();

router.use('/users', userRouter);

module.exports = router;
