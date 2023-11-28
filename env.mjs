/** InfluxDB v2 URL */
const url = process.env['INFLUX_URL'] || 'http://localhost:8086';
/** InfluxDB authorization token */
const token =
  process.env['INFLUX_TOKEN'] ||
  '62YhERKnAWyPd59PYO3aS0rCnQlY4pdynwpM_Bl7-AJqjGcksfPZW8FjHjnePGiMlYTiWrePPl_Uqqg18d_WaQ==';
/** Organization within InfluxDB  */
const org = process.env['INFLUX_ORG'] || 'pnsOrg';
/**InfluxDB bucket used in examples  */
const bucket = 'pnsBucket';
// ONLY onboarding example
/**InfluxDB user  */
const username = 'aimen';
/**InfluxDB password  */
const password = '12345678 ';

export { url, token, org, bucket, username, password };
