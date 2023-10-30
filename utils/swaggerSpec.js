/**
 * Swagger specification object generation.
 * @module swaggerSpec
 */
const { API_ROUTE } = require('./globals');
const fs = require('fs');
const swaggerJsDoc = require('swagger-jsdoc');
const { version } = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`));

const {
  env: { API_URL },
} = process;

/**
 * Base swagger documentation object.
 * @type {swaggerJsDoc.Options}
 */
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: "Park'N'Share API Docs",
      version,
      description: "The Park'N'Share API Documentation",
    },
    servers: [
      {
        url: `${API_URL}${API_ROUTE}`,
      },
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'All operations related to user authentication',
      },
      {
        name: 'User',
        description: 'All operations related to user management',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: [`${__dirname}/../routes/api/*.js`],
};

/**
 * The swagger specification object.
 * @type {import('swagger-ui-express').SwaggerUiOptions}
 */
const swaggerSpec = swaggerJsDoc(options);

module.exports = swaggerSpec;
