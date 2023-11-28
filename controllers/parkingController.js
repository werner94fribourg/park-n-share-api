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
  waitClickButton,
} = require('../utils/utils');
const Parking = require('../models/parkingModel');
const Occupation = require('../models/occupationModel');
const { uploadImage } = require('../utils/utils');
const {
  PARKINGS_FOLDER,
  GEOAPI_REVERSE_URL,
  GEOAPI_SEARCH_URL,
  SOCKET_CONNECTIONS,
  BACKEND_URL,
  API_ROUTE,
} = require('../utils/globals');
const AppError = require('../utils/classes/AppError');
const sharp = require('sharp');
const {
  env: { GEOAPIFY_API_KEY },
} = process;
const axios = require('axios');
const crypto = require('crypto');
const User = require('../models/userModel');
const Email = require('../utils/classes/Email');
const mongoose = require('mongoose');
const moment = require('moment-timezone');
const Thingy = require('../models/thingyModel');
const mqttClient = require('../mqtt/mqttHandler');

exports.handleParkingQuery = catchAsync(
  /**
   * Function used to handle query parameters related to getting the parking slots.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, _, next) => {
    const { query } = req;

    const queryObj = {};

    if (req?.user?.role === 'admin' && query.isValidated) {
      if (
        !checkBoolean(
          query.isValidated,
          'Please provide true or false for the validation variable.',
          next,
        )
      )
        return;
      queryObj.isValidated = setBoolean(query.isValidated);
    }

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
      if (query.minPrice) {
        if (
          !checkNumber(
            query.minPrice,
            'Please provide a numerical value for the minimum price.',
            next,
          )
        )
          return;
      }
      if (query.maxPrice) {
        if (
          !checkNumber(
            query.maxPrice,
            'Please provide a numerical value for the maximum price.',
            next,
          )
        )
          return;
      }
      queryObj.price = {};
      if (query.minPrice) queryObj.price.$gte = parseFloat(query.minPrice);
      if (query.maxPrice) queryObj.price.$lte = parseFloat(query.maxPrice);
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
    if (query.location && !(query.lat && query.lng)) {
      const {
        data: {
          features: [
            {
              geometry: {
                coordinates: [lng, lat],
              },
            },
          ],
        },
      } = await axios.get(
        `${GEOAPI_SEARCH_URL}?text=${query.location}%2C%20Switzerland&apiKey=${GEOAPIFY_API_KEY}`,
      );

      queryObj.location = {
        $geoWithin: { $centerSphere: [[lat, lng], distance] },
      };
    }

    if (query.lat && query.lng) {
      const { lat, lng } = query;
      queryObj.location = {
        $geoWithin: { $centerSphere: [[lat, lng], distance] },
      };
    }

    req.query = queryObj;

    next();
  },
);

exports.validateParking = catchAsync(
  /**
   * Function used to validate the parkings posted by providers from admin.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      params: { id },
    } = req;

    const [parking, [thingy]] = await Promise.all([
      queryById(Parking, id),
      Thingy.aggregate([{ $sample: { size: 1 } }]),
    ]);

    // Check if parking exists.
    if (!parking) {
      return next(new AppError("The requested parking doesn't exists.", 404));
    }

    // set isValidate to true
    const updatedParking = await Parking.findByIdAndUpdate(
      id,
      {
        isValidated: true,
        thingy: thingy._id,
      },
      { new: true },
    ).select('+isValidated');

    // Change the status of the owner to provider
    const owner = await User.findByIdAndUpdate(parking.owner, {
      role: 'provider',
    });

    // Send email to owner for validation
    try {
      await new Email(owner).sendValidatedParking();
    } catch (err) {
      next(
        new AppError(
          'There was an error sending the confirmation email. Please contact us at admin@parknshare.com!',
          500,
        ),
      );

      console.error(err);
      return;
    }
    parking.generateFileAbsolutePath();

    res
      .status(200)
      .json({ status: 'success', data: { parking: updatedParking } });
  },
);

exports.getAllParkings = catchAsync(
  /**
   * Function used to get all existing parkings in the application.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   */
  async (req, res) => {
    if (!req.own && req?.user?.role !== 'admin') {
      req.query.isValidated = true;
    }
    const parkings = await Parking.find({
      ...req.query,
    })
      .populate({
        path: 'owner',
        select: '_id username email',
      })
      .select(req.own ? '+isValidated' : '');

    parkings.forEach(parking => {
      parking.generateFileAbsolutePath();
    });

    res.status(200).json({ status: 'success', data: { parkings } });
  },
);

exports.getParking = catchAsync(
  /**
   * Function used to get a single parking in the application.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      params: { id },
    } = req;
    const queryObj = {};

    if (!req.user || req?.user?.role !== 'admin') queryObj.isValidated = true;

    const selectFields =
      req?.user?.role === 'admin' ? '+isValidated +thingy' : '+thingy';
    const parking = await queryById(
      Parking,
      id,
      queryObj,
      {
        path: 'owner',
        select: '_id username photo',
      },
      selectFields,
    );

    if (
      !parking ||
      (req.user &&
        req.user.role !== 'admin' &&
        parking.isValidated === false &&
        parking.owner._id.valueOf() !== req.user._id.valueOf())
    ) {
      next(new AppError("The requested parking doesn't exist.", 404));
      return;
    }

    parking.generateFileAbsolutePath();
    let returnedParking;

    if (parking.thingy) {
      const thingy = await Thingy.findById(parking.thingy.valueOf());
      const {
        data: {
          data: { FinalRating: rating },
        },
      } = await axios.get(
        `${BACKEND_URL}${API_ROUTE}/things/${thingy.name}/rating`,
      );

      returnedParking = {
        ...parking._doc,
        rating,
      };

      delete returnedParking.thingy;
    } else returnedParking = parking;

    res
      .status(200)
      .json({ status: 'success', data: { parking: returnedParking } });
  },
);

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

exports.startReservation = catchAsync(
  /**
   * Function used to create a new parking slot.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      user: { _id: userId, username, email },
      params: { id },
      // card: { _id: idCard, cardBalance },
    } = req;

    const sessionID = req?.headers?.sessionid;
    let socket;
    if (sessionID) {
      const socketObj = SOCKET_CONNECTIONS.find(
        socket => socket.id === sessionID,
      );
      if (socketObj) socket = socketObj?.socket;
    }

    const parking = await queryById(
      Parking,
      id,
      {
        isValidated: true,
      },
      [
        {
          path: 'owner',
          select: '_id username email',
        },
        { path: 'thingy', select: 'name' },
      ],
      '+thingy +isOccupied',
    );

    // Check if parking exists.
    if (!parking) {
      if (sessionID) socket.emit('unsuccessful_reservation', {});
      return next(new AppError("The requested parking doesn't exists.", 404));
    }

    // Check if the connected user is the owner of the parking
    if (parking.owner._id.valueOf() === userId.valueOf()) {
      if (sessionID) socket.emit('unsuccessful_reservation', {});
      return next(new AppError("You can't reserve your own parkings.", 400));
    }

    // Check if the parking is already occupied
    if (parking.isOccupied === true) {
      if (sessionID) socket.emit('unsuccessful_reservation', {});
      next(new AppError('The requested parking is already occupied.', 400));
      return;
    }

    // Wait that the user clicks on the associated thingy button
    /*const client = mqtt.connect(process.env.MQTT_SERVER, {
      username: process.env.MQTT_USR,
      password: process.env.MQTT_PWD,
    });*/

    const {
      thingy: { name: thingy },
    } = parking;

    const message = `Please confirm by pressing on the button of thingy ${thingy}.`;
    if (sessionID) {
      socket.emit('confirmation_message', {
        message,
      });
    } else console.log(message);

    const start = await waitClickButton(mqttClient, thingy);

    if (sessionID) socket.emit('successful_reservation', {});

    // Create an occupation for the parking
    // N.B. : a transaction is needed such that updating the occupation state of a parking and create a new occupation in the database will be done atomically
    //const session = await mongoose.startSession();

    try {
      //await session.startTransaction();

      const [[occupation]] = await Promise.all([
        Occupation.create(
          [
            {
              start,
              end: undefined,
              client: userId,
              parking: parking._id,
            },
          ],
          {
            /*session*/
          },
        ),
        Parking.updateOne(
          { _id: parking._id },
          { isOccupied: true },
          { /*session,*/ runValidators: false },
        ),
      ]);

      const returnedOccupation = {
        ...occupation._doc,
        client: {
          _id: userId,
          username,
          email,
        },
        parking: {
          _id: id,
          name: parking.name,
        },
      };

      try {
        await new Email(parking.owner).sendParkingReserved(username);
      } catch (err) {
        console.log(err);
      }

      res.status(200).json({
        status: 'success',
        message: 'You created a new parking reservation.',
        data: { occupation: returnedOccupation },
      });
      //await session.commitTransaction();
    } catch (err) {
      //await session.abortTransaction();
      if (sessionID) socket.emit('unsuccessful_reservation', {});
      next(err);
    } finally {
      //await session.endSession();
    }
  },
);

exports.endReservation = catchAsync(
  /**
   * Function used to create a new parking slot.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    const {
      user: { _id: userId, username, email },
      params: { id },
    } = req;

    const sessionID = req?.headers?.sessionid;
    let socket;
    if (sessionID) {
      const socketObj = SOCKET_CONNECTIONS.find(
        socket => socket.id === sessionID,
      );
      if (socketObj) socket = socketObj?.socket;
    }

    const [occupation, parking] = await Promise.all([
      Occupation.findOne({
        client: userId.valueOf(),
        parking: id,
        end: undefined,
      }),
      queryById(
        Parking,
        id,
        {
          isValidated: true,
        },
        [
          {
            path: 'owner',
            select: '_id username email',
          },
          { path: 'thingy', select: 'name' },
        ],
        '+thingy +isOccupied',
      ),
    ]);

    // Check if the parking exists
    if (!parking) {
      if (sessionID) socket.emit('unsuccessful_end', {});
      return next(new AppError("The requested parking doesn't exists.", 404));
    }

    // Check if the user has reserved the parking
    if (!occupation) {
      if (sessionID) socket.emit('unsuccessful_end', {});
      next(new AppError("You haven't reserved this parking.", 400));
      return;
    }

    const {
      thingy: { name: thingy },
    } = parking;

    const message = `Please confirm by pressing on the button of thingy ${thingy}.`;

    if (sessionID) {
      socket.emit('confirmation_message', {
        message,
      });
    } else console.log(message);

    const end = await waitClickButton(mqttClient, thingy);

    if (sessionID) socket.emit('successful_end', {});
    //const session = await mongoose.startSession();
    try {
      //await session.startTransaction();

      const bill = parseFloat(
        (
          (moment(end).diff(moment(occupation.start), 'seconds') *
            parking.price) /
          3600
        ).toFixed(2),
      );

      const [updatedOccupation] = await Promise.all([
        Occupation.findByIdAndUpdate(
          occupation._id,
          { end, bill },
          { /*session,*/ new: true },
        ),
        Parking.updateOne(
          { _id: parking._id },
          { isOccupied: false },
          { /*session,*/ runValidators: false, new: true },
        ),
      ]);

      const returnedOccupation = {
        ...updatedOccupation._doc,
        client: {
          _id: userId,
          username,
          email,
        },
        parking: {
          _id: id,
          name: parking.name,
        },
      };

      try {
        await new Email(parking.owner).sendParkingEndReservation(username);
      } catch (err) {
        console.log(err);
      }

      res.status(200).json({
        status: 'success',
        message: 'You successfully finished your reservation.',
        data: { occupation: returnedOccupation },
      });
      //await session.commitTransaction();
    } catch (err) {
      //await session.abortTransaction();
      if (sessionID) socket.emit('unsuccessful_end', {});
      next(err);
    } finally {
      //await session.endSession();
    }
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

    res.status(201).json({
      status: 'success',
      message: 'Your parking was submitted for validation.',
      data: { parking: newParking },
    });
  },
);
