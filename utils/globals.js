/**
 * All global parameters contained in the application.
 * @module globals
 */

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

exports.INFLUX_URL = 'http://127.0.0.1:8086';
exports.INFLUX_TOKEN =
  '62YhERKnAWyPd59PYO3aS0rCnQlY4pdynwpM_Bl7-AJqjGcksfPZW8FjHjnePGiMlYTiWrePPl_Uqqg18d_WaQ==';
exports.INFLUX_ORG = 'pnsOrg';
exports.INFLUX_BUCKET = 'pnsBucket';
