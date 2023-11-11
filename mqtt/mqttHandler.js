const mqtt = require('mqtt');

const { addFloatProperty, addIntegerProperty } = require('../utils/utils');

const mqttClient = mqtt.connect(process.env.MQTT_SERVER, {
  username: process.env.MQTT_USR,
  password: process.env.MQTT_PWD,
});

mqttClient.on('connect', () => {
  console.log('Connected to MQTT server.');
  mqttClient.subscribe('things/blue-1/shadow/update');
});

mqttClient.on('message', async (_, message) => {
  // Parse the MQTT message
  const data = JSON.parse(message);

  if (
    ['TEMP', 'CO2_EQUIV', 'HUMID', 'AIR_PRESS', 'AIR_QUAL'].includes(data.appId)
  ) {
    await addFloatProperty(data); // Wait for data to be stored
    //console.log('Added: ', JSON.stringify(data, null, 2));
  } else if (data.appId == 'BUTTON') {
    await addIntegerProperty(data); // Wait for data to be stored
  }
});

// Handle MQTT errors
mqttClient.on('error', error => {
  console.error('MQTT connection error:', error);
});

module.exports = mqttClient;
