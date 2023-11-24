/**
 * @fileoverview MQTT Handler Module
 * @module mqttHandler
 */

const mqtt = require('mqtt');

const { addFloatProperty, addIntegerProperty } = require('../utils/utils');

/**
 * MQTT Client for handling communication with an MQTT server.
 * @type {import('mqtt').Client}
 * @alias module:mqttHandler
 */
const mqttClient = mqtt.connect(process.env.MQTT_SERVER, {
  username: process.env.MQTT_USR,
  password: process.env.MQTT_PWD,
});

/**
 * Handles successful MQTT server connection.
 * @event module:mqttHandler#connect
 */
mqttClient.on('connect', () => {
  console.log('Connected to MQTT server.');
  mqttClient.subscribe('things/blue-1/shadow/update');
  mqttClient.subscribe('things/blue-2/shadow/update');
});

/**
 * Handles incoming MQTT messages.
 * @event module:mqttHandler#message
 * @param {string} topic - The topic on which the message was received.
 * @param {Buffer} message - The message payload.
 * @fires addFloatProperty
 * @fires addIntegerProperty
 */
mqttClient.on('message', async (topic, message) => {
  // Parse the MQTT message
  const data = JSON.parse(message);

  // Split the topic string by '/'
  const topicParts = topic.split('/');

  // Find the index of 'things' in the array
  const thingsIndex = topicParts.indexOf('things');

  // Check if 'things' is found and there is a subsequent part
  if (thingsIndex !== -1 && thingsIndex + 1 < topicParts.length) {
    // Retrieve the deviceId
    const deviceId = topicParts[thingsIndex + 1];

    if (
      ['TEMP', 'CO2_EQUIV', 'HUMID', 'AIR_PRESS', 'AIR_QUAL'].includes(
        data.appId,
      )
    ) {
      await addFloatProperty(deviceId, data);
      // console.log('Added: ', JSON.stringify(data, null, 2));
    } else if (data.appId == 'BUTTON') {
      await addIntegerProperty(deviceId, data);
    }
  } else {
    console.error('Invalid topic format:', topic);
  }
});

/**
 * Handles MQTT connection errors.
 * @event module:mqttHandler#error
 * @param {Error} error - The error object.
 */
mqttClient.on('error', error => {
  console.error('MQTT connection error:', error);
});

module.exports = mqttClient;
