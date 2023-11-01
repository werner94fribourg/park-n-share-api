/**
 * Functions related to calling the thingy resource in the API
 * @module thingyController
 */
const { Request, Response, NextFunction, query } = require('express');
const { catchAsync } = require('../utils/utils');
const { InfluxDB, Point } = require('@influxdata/influxdb-client');

const influxClient = new InfluxDB({
  url: 'http://127.0.0.1:8086',
  token:
    '62YhERKnAWyPd59PYO3aS0rCnQlY4pdynwpM_Bl7-AJqjGcksfPZW8FjHjnePGiMlYTiWrePPl_Uqqg18d_WaQ==',
});

// Define batch options
const batchOptions = {
  flushInterval: 1000, // Adjust this interval as needed (in milliseconds)
  batchSize: 10, // Adjust this batch size as needed
};

const influxQueryClient = influxClient.getQueryApi('pnsOrg');
const influxWriteClient = influxClient.getWriteApi(
  'pnsOrg',
  'pnsBucket',
  'ms',
  batchOptions,
);

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
      description: 'A measurement of ambient temperature',
      links: [{ href: '/things/thingy91/properties/temperature' }],
    },
    humidity: {
      title: 'Humidity',
      type: 'number',
      unit: 'percent',
      readOnly: true,
      description: 'A measurement of ambient humidity',
      links: [{ href: '/things/thingy91/properties/humidity' }],
    },
    airPressure: {
      title: 'Air Pressure',
      type: 'number',
      unit: 'kPa',
      readOnly: true,
      description: 'A measurement of ambient air pressure',
      links: [{ href: '/things/thingy91/properties/airPressure' }],
    },

    events: {
      flip: {
        title: 'Flip',
        type: 'string',
        readOnly: true,
        description: 'The Thingy has been flipped to a different side',
      },
      button: {
        title: 'Button',
        type: 'boolean',
        readOnly: true,
        description: 'The button has been pressed or released',
      },
    },
  },
};

function sendQueryResults(res, fluxQuery) {
  const result = [];

  influxQueryClient.queryRows(fluxQuery, {
    next: (row, tableMeta) => {
      const rowObject = tableMeta.toObject(row);
      result.push(rowObject);
    },
    error: error => {
      res.status(500).json({
        status: 'error',
        message: `An error occurred while fetching data: ${error}`,
      });
    },
    complete: () => {
      res.status(200).json({
        status: 'success',
        data: result,
      });
    },
  });
}

function constructBasicPropertyQuery(bucket, interval, measurement, field) {
  return `from(bucket: "${bucket}")
  |> range(start: -${interval})
  |> filter(fn: (r) => r._measurement == "${measurement}" and r._field == "${field}")`;
}

function constructStatisticalQueryOnProperty(
  bucket,
  interval,
  measurement,
  field,
  statistic,
) {
  return `from(bucket: "${bucket}")
  |> range(start: -${interval})
  |> filter(fn: (r) => r._measurement == "${measurement}" and r._field == "${field}")
  |> group(columns: ["_field"])
  |> ${statistic}()`;
}

exports.getThingDescription = catchAsync(async (req, res, next) => {
  res.status(200).json({
    status: 'success',
    data: { thingDescription },
  });
});

exports.getProperty = catchAsync(async (req, res, next) => {
  const interval = req.query.interval || '30m'; // Default interval is 30min
  const property = req.params.property;
  let fluxQuery = constructBasicPropertyQuery(
    'pnsBucket',
    interval,
    'thingy91',
    property,
  );
  sendQueryResults(res, fluxQuery);
});

exports.getStatisticOfProperty = catchAsync(async (req, res, next) => {
  const interval = req.query.interval || '1h'; // Default interval is 1h
  const property = req.params.property;
  const statistic = req.params.statistic;
  let fluxQuery = constructStatisticalQueryOnProperty(
    'pnsBucket',
    interval,
    'thingy91',
    property,
    statistic,
  );
  sendQueryResults(res, fluxQuery);
});

exports.addFloatProperty = async tempData => {
  let point = new Point('thingy91')
    .floatField(tempData.appId, tempData.data)
    .timestamp(new Date().getTime());

  influxWriteClient.writePoint(point);
};
