/**
 * Server initialization file.
 * @module server
 */
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });

const mongoose = require('mongoose');
const app = require('./app');
const { shutDownAll: shutDownWithoutBind } = require('./utils/utils');

const {
  env: { UNAME, PASSWORD, HOST, DATABASE, CONNECTION_STRING },
} = process;

const DB_CONNECTION = CONNECTION_STRING.replace('<UNAME>', UNAME)
  .replace('<PASSWORD>', PASSWORD)
  .replace('<HOST>', HOST)
  .replace('<DATABASE>', DATABASE);

const port = process.env.PORT || 3001;

// Set up the database connection
mongoose
  .connect(DB_CONNECTION, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log('DB connection successful.');
  });

// Instantiate the server
const server = app.listen(port, () => {
  console.log(`App running on port ${port}...`);
});

const shutDownAll = shutDownWithoutBind.bind(null, server, mongoose.connection);

// Shut down the server in the case an uncaught exception happened in the code base of the server
process.on('uncaughtException', err => {
  shutDownAll('UNCAUGHT EXCEPTION ! Shutting down...', err);
});

// Shut down the server in the case where an unhandled rejected promise happened in the code base of the server
process.on('unhandledRejection', err => {
  console.error(err);
  shutDownAll('UNHANDLED REJECTION ! Shutting down...', err);
});

// Shut down the server in the case where a SIGTERM signal was sent to the server
process.on('SIGTERM', () => {
  shutDownAll('SIGTERM RECEIVED. Shutting down gracefully...', err);
});
