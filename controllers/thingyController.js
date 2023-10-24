/**
 * Functions related to calling the thingy resource in the API
 * @module thingyController
 */
const { Request, Response, NextFunction } = require('express');
const { catchAsync } = require('../utils/utils');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const influxClient = new InfluxDB({
  url: 'http://127.0.0.1:8086',
  token:
    '62YhERKnAWyPd59PYO3aS0rCnQlY4pdynwpM_Bl7-AJqjGcksfPZW8FjHjnePGiMlYTiWrePPl_Uqqg18d_WaQ==',
});

let influxQueryClient = influxClient.getQueryApi('pnsOrg');

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

const thingyProperties = { temperature: [] };

exports.getThingDescription = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: { thingDescription },
  });
});

exports.getTemperature10Mins = catchAsync(async (req, res, next) => {
  let fluxQuery = `from(bucket: "pnsBucket")
 |> range(start: -5m)`;

  const result = [];

  influxQueryClient.queryRows(fluxQuery, {
    next: (row, tableMeta) => {
      const tableObject = tableMeta.toObject(row);
      result.push(tableObject);
    },
    error: error => {
      console.error('\nError', error);
      res.status(500).json({
        status: 'error',
        message: 'An error occurred while fetching data',
      });
    },
    complete: () => {
      console.log('\nSuccess');
      res.status(200).json({
        status: 'success',
        data: result,
      });
    },
  });
});

exports.addPropertyTemp = catchAsync(async (req, res, next) => {
  const incomingTempData = req.body;

  const influxWriteClient = influxClient.getWriteApi(
    'pnsOrg',
    'pnsBucket',
    'ms',
  );

  let point = new Point('thingy91')
    .tag('location', 'switzerland')
    .floatField('temperature', incomingTempData.data)
    .timestamp(new Date().getTime());

  influxWriteClient.writePoint(point);

  thingyProperties.temperature.push({
    value: incomingTempData.data,
    timestamp: incomingTempData.ts,
  });
  res.status(200).json({
    status: 'success',
    data: thingyProperties,
  });
});
