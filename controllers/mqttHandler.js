const mqtt = require('mqtt');
const axios = require('axios');

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

mqttClient.on('message', (topic, message) => {
  // Parse the MQTT message
  const data = JSON.parse(message);

  if (data.appId == 'TEMP') {
    axios
      .post(
        'http://127.0.0.1:3001/api/v1/things/thingy91/properties/temp',
        data,
      )
      .then(response => {
        console.log(
          'Response from server:',
          JSON.stringify(response.data, null, 2),
        );
      })
      .catch(error => {
        console.error('Error sending data:', error);
      });
  }
  // Store the data in InfluxDB
  //data.state ? console.log('Ignored') : console.log(data);
});

// Handle MQTT errors
mqttClient.on('error', error => {
  console.error('MQTT connection error:', error);
});
