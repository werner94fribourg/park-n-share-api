/**
 * Functions related to calling the thingy resource in the API
 * @module thingyController
 */
const { Request, Response, NextFunction } = require('express');
const { catchAsync } = require('../utils/utils');

const thingDescription = {
  id: 'https://127.0.0.1/things/thingy91',
  title: 'Nordic Thingy:91',
  description: 'A WoT-connected Thingy:91 sensor',
  properties: {
    temperature: {
      title: 'Temperature',
      type: 'number',
      unit: 'degree celsius',
      readOnly: true,
      description: 'An ambient temperature sensor',
      links: [{ href: '/things/thingy91/properties/temperature' }],
    },
    humidity: {
      title: 'Humidity',
      type: 'number',
      unit: 'percent',
      readOnly: true,
      links: [{ href: '/things/thingy91/properties/humidity' }],
    },
    airPressure: {
      title: 'Air Pressure',
      type: 'number',
      unit: 'kPa',
      readOnly: true,
      links: [{ href: '/things/thingy91/properties/airPressure' }],
    },
  },
};

exports.getThingDescription = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: { thingDescription },
  });
});
