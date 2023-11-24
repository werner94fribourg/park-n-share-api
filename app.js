/**
 * Main express backend application.
 * @module app
 */
const express = require('express');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const cookieParser = require('cookie-parser');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const compression = require('compression');
const swaggerUI = require('swagger-ui-express');
const bodyParser = require('body-parser');

const swaggerSpec = require('./utils/swaggerSpec');
const apiRouter = require('./routes/apiRoutes');

const {
  PARAMETER_WHITELIST,
  API_ROUTE,
  PUBLIC_FOLDER,
  FRONTEND_URL,
} = require('./utils/globals');
const AppError = require('./utils/classes/AppError');
const errorHandler = require('./controllers/errorController');

const app = express();
const {
  env: { NODE_ENV },
} = process;

// Enable proxies (when the app is deployed on the web)
// app.enable('trust proxy');

// Set static directory
app.use('/public', express.static(path.join(__dirname, PUBLIC_FOLDER)));

// Set view template engine (used for emails)
app.set('view engine', 'ejs');

// Dev logging
if (NODE_ENV === 'development') app.use(require('morgan')('dev'));

// Set secure script policies
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: 'cross-origin' }));

// Set cross origin resource sharing
app.use(cors({ credentials: true, origin: FRONTEND_URL })); // GET and POST
app.options('*', cors({ credentials: true, origin: FRONTEND_URL })); // OPTIONS CHECK BEFORE PATCH, PUT AND DELETE

// Limit nb requests possible to API (protect from DOS attacks)
const limiter = rateLimit({
  max: 10000,
  windowMs: 60 * 60 * 1000,
  message: (_, res) =>
    res.json({
      status: 'fail',
      message: 'Too many requests from this IP, please try again in an hour!',
    }),
});

app.use('/', limiter);

// JSON body content reading and limitation of size to max 10kb
app.use(express.json({ limit: '10kb' }));

// body parser for content sent as multipart/form-data
app.use(bodyParser.json());

// Encoded url content reading and limitation of size to max 10kb
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// User cookie reading
app.use(cookieParser());

// Mongodb data sanitization => NoSQL injection protection
app.use(mongoSanitize());

// Clean malicious html content containing js script sent => XSS attacks protection
app.use(xss());

// Parameter pollution prevention (i.e. repeating fields)
app.use(
  hpp({
    whitelist: PARAMETER_WHITELIST,
  }),
);

// zip compression
app.use(compression());

// Request time middleware
app.use((req, _, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// Swagger documentation
app.route('/docs.json').get((_, res) => {
  res.status(200).json(swaggerSpec);
});

app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerSpec));

/*
TODO: fix redirection to non existing routes in the api
app.use('/api/docs/*', (req, _, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});
*/
// API router
app.use(API_ROUTE, apiRouter);

// Non existing route middleware
app.all('*', (req, _, next) => {
  next(new AppError(`Cannot find ${req.originalUrl} on this server!`, 404));
});

app.use(errorHandler);

module.exports = app;
