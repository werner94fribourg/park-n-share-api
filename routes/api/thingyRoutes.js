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

router.route('/:thingyId').get(getThingDescription);
router.route('/:thingyId/properties/:property').get(getProperty);
router.route('/:thingyId/properties/BUTTON/timer').get(getButtonTimer);
router
  .route('/:thingyId/properties/:property/statistics/:statistic')
  .get(getStatisticOfProperty);
router.route('/:thingyId/properties/BUZZER/:setting').post(setBuzzer);
router.route('/:thingyId/properties/LED/setColor/:color').post(setLEDColor);

module.exports = router;
