/**
 * Main router of the REST API.
 * @module apiRoutes
 */
const { Router } = require('express');

const clientRouter = require('./api/userRoutes');
const providerRouter = require('./api/providerRoutes');
const adminRouter = require('./api/adminRoutes');

/**
 * The main router of the application.
 * @typedef {Router}
 */
const router = Router();

router.use('/clients', clientRouter);
router.use('/providers', providerRouter);
router.use('/admins', adminRouter);

module.exports = router;
