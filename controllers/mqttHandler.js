const mqtt = require('mqtt');
const Influx = require('influx');

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

  // Store the data in InfluxDB
  data.state ? console.log('Ignored') : console.log(data);
});

// Handle MQTT errors
mqttClient.on('error', error => {
  console.error('MQTT connection error:', error);
});
