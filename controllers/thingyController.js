/**
 * Functions related to calling the thingy resource in the API
 * @module thingyController
 */
const {
  catchAsync,
  publishToMQTT,
  sendQueryResults,
  getQueryRows,
  constructBasicPropertyQuery,
  constructStatisticalQueryOnProperty,
  getLinearRating,
  getSCurveRating,
} = require('../utils/utils');
const AppError = require('../utils/classes/AppError');
const thingDescription = require('../utils/thingDescription');
const mqttClient = require('../mqtt/mqttHandler');
const { INFLUX } = require('../utils/globals');

exports.getButtonTimer = catchAsync(
  /**
   * Function used to compute a timer that starts when the Thingy's button is clicked and ends when it is clicked a second time. The timer will indicate the difference in time between the two clicks.
   * @param {import('express').Request} req The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   * @returns {Promise<Object|null>} A promise that resolves to the timer object or null if an error occurs. If you are using async/await, you can directly await this function to get the result.
   */
  async (req, res, next) => {
    const deviceId = req.params.thingyId;
    const getLastTwoRowsQuery = `from(bucket: "pnsBucket")
  |> range(start: -1d)
  |> filter(fn: (r) => r._measurement == "thingy91" and r._field == "BUTTON" and r.device == "${deviceId}")
  |> sort(columns: ["_time"], desc: true)
  |> limit(n: 2)`;

    const getCountQuery = `from(bucket: "pnsBucket")
  |> range(start: -1d)
  |> filter(fn: (r) => r._measurement == "thingy91" and r._field == "BUTTON" and r.device == "${deviceId}")
  |> group(columns: ["_field"])
  |> count()`;

    let rows = [];
    let countResult = [];

    try {
      rows = await getQueryRows(getLastTwoRowsQuery);
    } catch (error) {
      next(
        new AppError(
          `Oops, something went wrong with the following query: ${getLastTwoRowsQuery}. Error: ${error}`,
          500,
        ),
      );
      return null;
    }

    try {
      countResult = await getQueryRows(getCountQuery);
    } catch (error) {
      next(
        new AppError(
          `Oops, something went wrong with the following query: ${getCountQuery}. Error: ${error}`,
          500,
        ),
      );
      return null;
    }

    let count = 0;
    if (countResult[0] !== undefined) {
      count = countResult[0]._value;
    }

    if (count === 0) {
      const retentionPolicy = await INFLUX.getRetentionPolicy();
      next(
        new AppError(
          `No timer has been starter for the last ${retentionPolicy.value}${retentionPolicy.unit}`,
          400,
        ),
      );
      return null;
    } else if (count % 2 !== 0) {
      if (rows.length == 2) {
        rows = [rows[0]];
      }
    }

    if (!rows) {
      next(
        new AppError(
          `No timer has been starter for the last ${retentionPolicy.value}${retentionPolicy.unit}`,
          400,
        ),
      );
      return null;
    } else if (rows.length >= 1) {
      let time1 = new Date(rows[0]._time);
      let time2 = new Date();
      if (rows.length == 2) {
        time2 = new Date(rows[0]._time);
        time1 = new Date(rows[1]._time);
      }

      const timeDifference = time2 - time1;

      const days = Math.floor(timeDifference / 86400000); // 1 day = 24 hours * 60 minutes * 60 seconds * 1000 milliseconds
      const remainingTime = timeDifference % 86400000; // Remaining time in milliseconds

      const hours = Math.floor(remainingTime / 3600000); // 1 hour = 60 minutes * 60 seconds * 1000 milliseconds
      const minutes = Math.floor((remainingTime % 3600000) / 60000); // 1 minute = 60 seconds * 1000 milliseconds
      const seconds = ((remainingTime % 3600000) % 60000) / 1000;

      const timerObject = {
        days: days,
        hours: hours,
        minutes: minutes,
        seconds: seconds.toFixed(0),
      };

      res.status(200).json({
        status: 'success',
        data: timerObject,
      });

      return timerObject;
    } else {
      next(
        new AppError(
          'Oops, something went wrong while computing timer data',
          500,
        ),
      );
      return null;
    }
  },
);

exports.getThingDescription = catchAsync(
  /**
   * Retrieves the description of the Thing.
   * @param {import('express').Request} req - The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res - The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} next - The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, next) => {
    try {
      res.status(200).json({
        status: 'success',
        data: { thingDescription },
      });
    } catch (error) {
      next(
        new AppError(
          "Oops, something went wrong while retrieving the Thing's description",
          500,
        ),
      );
    }
  },
);

exports.getProperty = catchAsync(
  /**
   * Handles GET requests on property data (such as TEMP, HUMID, AIR_QUAL,...). Sends back a list of records for the given property and the given time interval.
   * @param {import('express').Request} req - The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res - The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} _ - The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, _) => {
    const interval = req.query.interval || '30m'; // Default interval is 30min
    const property = req.params.property;
    const deviceId = req.params.thingyId;
    let fluxQuery = constructBasicPropertyQuery(
      'pnsBucket',
      interval,
      'thingy91',
      deviceId,
      property,
    );
    sendQueryResults(res, fluxQuery);
  },
);

exports.getStatisticOfProperty = catchAsync(
  /**
   * Handles GET requests for statistics (such as MEAN, STDDEV, MIN, MAX,...) on property data (such as TEMP, HUMID, AIR_QUAL,...).
   * @param {import('express').Request} req - The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res - The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} _ - The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, _) => {
    const interval = req.query.interval || '1h'; // Default interval is 1h
    const property = req.params.property;
    const statistic = req.params.statistic;
    const deviceId = req.params.thingyId;
    let fluxQuery = constructStatisticalQueryOnProperty(
      'pnsBucket',
      interval,
      'thingy91',
      deviceId,
      property,
      statistic,
    );
    sendQueryResults(res, fluxQuery);
  },
);

exports.setBuzzer = catchAsync(
  /**
   * Handles POST requests to turn ON/OFF the Thingy's buzzer.
   * @param {import('express').Request} req - The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res - The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} _ - The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, _) => {
    let freq = +req.query.freq || 1000;
    const setting = req.params.setting;
    const deviceId = req.params.thingyId;
    const topic = `things/${deviceId}/shadow/update/accepted`;

    if (setting == 'off') {
      freq = 0;
    }

    const message = JSON.stringify({
      appId: 'BUZZER',
      data: { frequency: freq },
      messageType: 'CFG_SET',
    });

    publishToMQTT(mqttClient, topic, message, res);
  },
);

exports.setLEDColor = catchAsync(
  /**
   * Handles POST requests to set the Thingy's LED to one of three possible colors namely, green, red and blue.
   * @param {import('express').Request} req - The request object of the Express framework, used to handle the request sent by the client.
   * @param {import('express').Response} res - The response object of the Express framework, used to handle the response we will give back to the end user.
   * @param {import('express').NextFunction} _ - The next function of the Express framework, used to handle the next middleware function passed to the express pipeline.
   */
  async (req, res, _) => {
    let colorToBeSet = req.params.color || 'red';
    const deviceId = req.params.thingyId;
    const topic = `things/${deviceId}/shadow/update/accepted`;

    if (colorToBeSet == 'blue') {
      colorToBeSet = '0000ff';
    } else if (colorToBeSet == 'green') {
      colorToBeSet = '00ff00';
    } else {
      colorToBeSet = 'ff0000';
    }

    const message = JSON.stringify({
      appId: 'LED',
      data: { color: colorToBeSet },
      messageType: 'CFG_SET',
    });

    publishToMQTT(mqttClient, topic, message, res);
  },
);

exports.getRating = catchAsync(
  /**
   * Handles GET requests to fetch for property ratings, and returns a final rating.
   * @param {object} req - Express request object.
   * @param {object} res - Express response object.
   * @param {function} next - Express next middleware function.
   */
  async (req, res, next) => {
    const deviceId = req.params.thingyId;
    const properties = ['TEMP', 'HUMID', 'CO2_EQUIV', 'AIR_QUAL', 'AIR_PRESS'];
    const means = {};

    try {
      for (const property of properties) {
        const getMeanQuery = constructStatisticalQueryOnProperty(
          'pnsBucket',
          '1y',
          'thingy91',
          deviceId,
          property,
          'mean',
        );
        const result = await getQueryRows(getMeanQuery);
        means[property] = result[0]._value;
      }
    } catch (error) {
      next(
        new AppError(
          `Oops, something went wrong while fetching means of properties. Error: ${error}`,
          500,
        ),
      );
      return null;
    }

    // Configurations for S-Curved Ratings
    const tempConfig = {
      optimalRange: [20, 25],
      slopeAboveOptimal: 0.15,
      slopeBelowOptimal: 0.025,
    };

    // Configuration for Linear Ratings
    const humidConfig = {
      optimalRange: [40, 60],
      fullRange: [0, 100],
    };

    const airQualConfig = {
      optimalRange: [0, 50],
      fullRange: [0, 500],
    };

    const co2Config = {
      optimalRange: [0, 1000],
      fullRange: [0, 5000],
    };

    const airPressConfig = {
      optimalRange: [97, 103],
      fullRange: [87, 103],
    };

    const ratings = {
      TEMP: getSCurveRating(means['TEMP'], tempConfig),
      HUMID: getLinearRating(means['HUMID'], humidConfig),
      AIR_QUAL: getLinearRating(means['AIR_QUAL'], airQualConfig),
      CO2_EQUIV: getLinearRating(means['CO2_EQUIV'], co2Config),
      AIR_PRESS: getLinearRating(means['AIR_PRESS'], airPressConfig),
    };

    const finalRating =
      (ratings['TEMP'] +
        ratings['HUMID'] +
        ratings['AIR_QUAL'] +
        ratings['CO2_EQUIV'] +
        ratings['AIR_PRESS']) /
      5;

    res.status(200).json({
      status: 'success',
      data: {
        TEMP: ratings['TEMP'].toFixed(2),
        HUMID: ratings['HUMID'].toFixed(2),
        AIR_QUAL: ratings['AIR_QUAL'].toFixed(2),
        CO2_EQUIV: ratings['CO2_EQUIV'].toFixed(2),
        AIR_PRESS: ratings['AIR_PRESS'].toFixed(2),
        FinalRating: Math.round(finalRating * 2) / 2,
      },
    });
  },
);
