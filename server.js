/**
 * Server initialization file.
 * @module server
 */
const dotenv = require('dotenv');
dotenv.config({ path: './config.env' });
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const mqttHandler = require('./mqtt/mqttHandler');
const app = require('./app');
const { shutDownAll: shutDownWithoutBind } = require('./utils/utils');
const {
  FRONTEND_URL,
  socket_lock,
  SOCKET_CONNECTIONS,
} = require('./utils/globals');
const crypto = require('crypto');

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

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    methods: ['GET', 'POST'],
    'close timeout': 0,
    'heartbeat timeout': 0,
  },
});

io.on('connection', async socket => {
  await socket_lock.acquire();

  const sessionID = crypto.randomBytes(32).toString('hex');

  socket.emit('connexion_established', { sessionID });

  console.log(`Session started: ${sessionID}`);
  socket.join('park_n_share');

  const socketIndex = SOCKET_CONNECTIONS.findIndex(
    socket => socket.id === sessionID,
  );

  if (socketIndex === -1) SOCKET_CONNECTIONS.push({ id: sessionID, socket });
  else SOCKET_CONNECTIONS[socketIndex] = { id: sessionID, socket };
  socket_lock.release();

  socket.on('disconnect', async () => {
    await socket_lock.acquire();
    const socketIndex = SOCKET_CONNECTIONS.findIndex(
      socket => socket.id === sessionID,
    );

    if (socketIndex === -1) return;
    for (let i = socketIndex; i < SOCKET_CONNECTIONS.length - 1; i++)
      SOCKET_CONNECTIONS[i] = SOCKET_CONNECTIONS[i + 1];

    SOCKET_CONNECTIONS.pop();

    console.log('Socket Disconnected:', socket.id);
    socket_lock.release();
  });
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
