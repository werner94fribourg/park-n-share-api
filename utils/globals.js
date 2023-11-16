/**
 * All global parameters contained in the application.
 * @module globals
 */

const Influx = require('../utils/classes/Influx');

/**
 * Base URL of the API.
 * @type {string}
 */
exports.API_ROUTE = '/api/v1';

/**
 * Filepath of the public static directory.
 * @type {string}
 */
exports.PUBLIC_FOLDER = 'public';

/**
 * Base URL of the frontend application.
 * @type {string}
 */
exports.FRONT_END_URL = 'http://localhost:3000/';

/**
 * List of url parameters that can happen multiple times.
 * @type {string[]}
 */
exports.PARAMETER_WHITELIST = [];

exports.INFLUX_ORG = 'pnsOrg';
exports.INFLUX_BUCKET = 'pnsBucket';

exports.INFLUX = new Influx(this.INFLUX_ORG, this.INFLUX_BUCKET);
