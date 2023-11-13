/**
 * Functions related to calling the parking resource in the API
 * @module parkingController
 */
const { catchAsync, checkBoolean, checkNumber } = require('../utils/utils');
const Parking = require('../models/parkingModel');

exports.handleParkingQuery = catchAsync(
  /**
   * Function used to handle query parameters related to getting the parking slots.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    const { query } = req;

    const queryObj = {};

    if (query.isOccupied) {
      if (
        !checkBoolean(
          query.isOccupied,
          'Please provide true or false for the occupation variable.',
          next,
        )
      )
        return;
      queryObj.isOccupied = Boolean(query.isOccupied);
    }

    // TODO: get coordinates from a list of places in switzerland that contain their location (external database)
    //if (query.location) queryObj.location = req.query.location;

    if (query.minPrice || query.maxPrice) {
      if (
        !checkNumber(
          query.minPrice,
          'Please provide a numerical value for the minimum price.',
          next,
        )
      )
        return;
      if (
        !checkNumber(
          query.maxPrice,
          'Please provide a numerical value for the maximum price.',
          next,
        )
      )
        return;

      queryObj.price = { $and: [] };
      if (query.minPrice)
        queryObj['$and'].push({ $gte: parseFloat(query.minPrice) });
      if (query.maxPrice)
        queryObj['$and'].push({ $lte: parseFloat(query.maxPrice) });
    }

    if (query.type) queryObj.type = req.query.type;

    req.query = queryObj;

    next();
  },
);

exports.getAllParkings = catchAsync(
  /**
   * Function used to get all existing parkings in the application.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   */
  async (req, res) => {
    const parkings = await Parking.find(req.query).populate({
      path: 'owner',
      fields: '_id username',
    });

    parkings.forEach(parking => {
      parking.generateFileAbsolutePath();
    });

    res.status(200).json({ status: 'success', data: { parkings } });
  },
);
