/**
 * Functions related to calling the parking resource in the API
 * @module parkingController
 */
const {
  catchAsync,
  checkBoolean,
  checkNumber,
  setBoolean,
  checkLocation,
} = require('../utils/utils');
const Parking = require('../models/parkingModel');
const { uploadImage } = require('../utils/utils');
const { PARKINGS_FOLDER } = require('../utils/globals');
const AppError = require('../utils/classes/AppError');
const sharp = require('sharp');

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
      queryObj.isOccupied = setBoolean(query.isOccupied);
    }

    // TODO: get coordinates from a list of places in switzerland that contain their location (external database) => geoapify
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
    const parkings = await Parking.find({
      ...req.query,
      isValidated: true,
    }).populate({
      path: 'owner',
      select: '_id username',
    });

    parkings.forEach(parking => {
      parking.generateFileAbsolutePath();
    });

    res.status(200).json({ status: 'success', data: { parkings } });
  },
);

exports.uploadParkingImages = uploadImage.array('photos', 10);

exports.saveParkingImages = catchAsync(async (req, res, next) => {
  const {
    files: photos,
    user: { _id: id },
  } = req;

  if (!photos) {
    next();
    return;
  }

  const newPhotos = await Promise.all(
    photos.map(async (photo, index) => {
      const filename = `parking-${id}-${index}-${Date.now()}.jpeg`;

      await sharp(photo.buffer)
        .toFormat('jpeg')
        .jpeg({ quality: 100 })
        .toFile(`${PARKINGS_FOLDER}/${filename}`);

      photo.filename = filename;

      return filename;
    }),
  );

  req.body.photos = newPhotos;

  next();
});

exports.createParking = catchAsync(async (req, res, next) => {
  const {
    body: { name, description, type, price, coordinates, photos },
    user: { _id: id },
  } = req;

  if (!checkLocation(coordinates)) {
    next(
      new AppError(
        'Please provide valid coordinates values for your location.',
        400,
      ),
    );
    return;
  }

  //TODO: populate address and city fields from geoapify data
  const location = { type: 'Point', coordinates };

  const newParking = await Parking.create({
    name,
    description,
    type,
    price,
    location,
    photos,
    creationDate: Date.now(),
    owner: id,
  });

  res.status(201).json({
    status: 'success',
    message: 'Your parking was submitted for validation.',
    data: { parking: newParking },
  });
});
