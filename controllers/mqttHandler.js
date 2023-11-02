const mqtt = require('mqtt');
const axios = require('axios');

const { addFloatProperty, addIntegerProperty } = require('./thingyController');

// MQTT credentials
const mqttOptions = {
  username: 'blue',
  password: 'Rcgb5veTPJ',
};

const mqttServer = 'mqtt://163.172.151.151:1885'; // MQTT server URL

const mqttClient = mqtt.connect(mqttServer, mqttOptions);

mqttClient.on('connect', () => {
  console.log('Connected to MQTT server.'); // Add this line
  mqttClient.subscribe('things/blue-1/shadow/update');
});

mqttClient.on('message', async (topic, message) => {
  // Parse the MQTT message
  const data = JSON.parse(message);

  if (
    ['TEMP', 'CO2_EQUIV', 'HUMID', 'AIR_PRESS', 'AIR_QUAL'].includes(data.appId)
  ) {
    await addFloatProperty(data); // Wait for data to be stored
    data.ts = new Date().getTime();
    console.log('Added: ', JSON.stringify(data, null, 2));
  } else if (data.appId == 'BUTTON') {
    await addIntegerProperty(data);
    data.ts = new Date().getTime();
    console.log('Added: ', JSON.stringify(data, null, 2));
  }
});

// Handle MQTT errors
mqttClient.on('error', error => {
  console.error('MQTT connection error:', error);
});
