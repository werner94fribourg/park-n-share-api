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
  queryById,
} = require('../utils/utils');
const Parking = require('../models/parkingModel');
const { uploadImage } = require('../utils/utils');
const {
  PARKINGS_FOLDER,
  GEOAPI_REVERSE_URL,
  GEOAPI_SEARCH_URL,
} = require('../utils/globals');
const AppError = require('../utils/classes/AppError');
const sharp = require('sharp');
const {
  env: { GEOAPIFY_API_KEY },
} = process;
const axios = require('axios');
const crypto = require('crypto');

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

    if (query.distance) {
      if (
        !checkNumber(
          query.distance,
          'Please provide a numerical value for the distance.',
          next,
        )
      )
        return;
    }

    const distance = (query.distance ? Number(query.distance) : 5) / 6378.1;
    if (query.location) {
      const {
        data: {
          features: [
            {
              geometry: { coordinates },
            },
          ],
        },
      } = await axios.get(
        `${GEOAPI_SEARCH_URL}?text=${query.location}%2C%20Switzerland&apiKey=${GEOAPIFY_API_KEY}`,
      );

      queryObj.location = {
        $geoWithin: { $centerSphere: [coordinates, distance] },
      };
    }

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
      /*isValidated: true,*/
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

exports.getParking = catchAsync(async (req, res, next) => {
  const {
    params: { id },
  } = req;

  const parking = await queryById(
    Parking,
    id,
    {
      /*isValidated: true*/
    },
    {
      path: 'owner',
      select: '_id username photo',
    },
  );

  if (!parking) {
    next(
      new AppError("The requested parking doesn't exist or was deleted.", 404),
    );
    return;
  }

  parking.generateFileAbsolutePath();

  res.status(200).json({ status: 'success', data: { parking } });
});

/**
 * Multer middle function that takes care of processing the photos field images associated with the form sent to the server (max 10 pictures).
 * @returns {import('express').RequestHandler} The request handler function that takes care of processing the sent images.
 */
exports.uploadParkingImages = uploadImage.array('photos', 10);

exports.saveParkingImages = catchAsync(
  /**
   * Function that takes care of storing the images associated with a parking and update their filename.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    const {
      files: photos,
      user: { _id: id },
    } = req;

    if (!photos) {
      next();
      return;
    }

    const newPhotos = await Promise.all(
      photos.map(async photo => {
        const filename = `parking-${id}-${crypto
          .randomBytes(4)
          .toString('hex')}-${Date.now()}.jpeg`;

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
  },
);

exports.createParking = catchAsync(
  /**
   * Function used to create a new parking slot.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
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

    const [lat, lng] = coordinates;

    const {
      data: {
        features: [
          {
            properties: { postcode, street, housenumber, city },
          },
        ],
      },
    } = await axios.get(
      `${GEOAPI_REVERSE_URL}?lat=${lat}&lon=${lng}&apiKey=${GEOAPIFY_API_KEY}`,
    );

    const location = {
      type: 'Point',
      coordinates,
      street,
      housenumber,
      postcode,
      city,
    };

    const { _id } = await Parking.create({
      name,
      description,
      type,
      price,
      location,
      photos,
      creationDate: Date.now(),
      owner: id,
    });

    const newParking = await Parking.findById(_id).select('-owner');

    newParking.generateFileAbsolutePath();

    res.status(201).json({
      status: 'success',
      message: 'Your parking was submitted for validation.',
      data: { parking: newParking },
    });
  },
);
