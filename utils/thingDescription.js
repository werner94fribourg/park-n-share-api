const thingDescription = {
  id: 'https://127.0.0.1/things/thingy91',
  title: 'Nordic Thingy:91',
  description: 'A WoT-connected Thingy:91 sensor',
  properties: {
    TEMP: {
      title: 'Temperature',
      type: 'number',
      unit: 'degree celsius',
      readOnly: true,
      description: 'A measurement of ambient temperature',
      links: [{ href: '/things/thingy91/properties/TEMP' }],
    },
    HUMID: {
      title: 'Humidity',
      type: 'number',
      unit: 'percent',
      readOnly: true,
      description: 'A measurement of ambient humidity',
      links: [{ href: '/things/thingy91/properties/HUMID' }],
    },
    AIR_PRESS: {
      title: 'Air Pressure',
      type: 'number',
      unit: 'kPa',
      readOnly: true,
      description: 'A measurement of ambient air pressure',
      links: [{ href: '/things/thingy91/properties/AIR_PRESS' }],
    },
    AIR_QUAL: {
      title: 'Air Quality',
      type: 'number',
      unit: 'AQI',
      readOnly: true,
      description: 'A measurement of ambient air quality',
      links: [{ href: '/things/thingy91/properties/AIR_QUAL' }],
    },
    CO2_EQUIV: {
      title: 'CO2 Equivalent',
      type: 'number',
      unit: 'MMTCDE',
      readOnly: true,
      description: 'A measurement of ambient CO2 equivalent',
      links: [{ href: '/things/thingy91/properties/CO2_EQUIV' }],
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

module.exports = thingDescription;
