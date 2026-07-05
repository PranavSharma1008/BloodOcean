// NEW FILE: server/sockets/tracking.js
// Socket.IO handlers for live donor tracking

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const {
  startTracking,
  endTracking,
  updateUserOnline,
  updateDonorLocation,
  isTrackingActive,
  getTrackingSession,
  authorizeTracking,
  RequestTracker,
} = require('../utils/trackingSocket');

let io = null;

const initializeSocket = (server) => {
  const defaultOrigins = (process.env.FRONTEND_URL && process.env.FRONTEND_URL.split(',')) || ['http://localhost:5173', 'http://localhost:3000'];
  io = new Server(server, {
    cors: {
      origin: defaultOrigins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      if (!token) {
        console.log('[socket] auth failed: no token from', socket.handshake.address || socket.handshake.headers.origin);
        return next(new Error('Authentication required'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        console.log(`[socket] auth success user=${socket.user.id} addr=${socket.handshake.address || socket.handshake.headers.origin}`);
        next();
      } catch (verifyErr) {
        console.log('[socket] auth error:', verifyErr.message);
        return next(new Error('Invalid token'));
      }
    } catch (err) {
      console.log('[socket] unexpected auth error:', err.message);
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user.id);
    console.log(`[socket] connected: socketId=${socket.id} user=${userId}`);

    try {
      socket.join(`user:${userId}`);
    } catch (err) {
      console.log('[socket] join user room error:', err.message);
    }

    socket.on('join_tracking', ({ requestId }) => {
      console.log(`[socket] join_tracking attempt: user=${userId} requestId=${requestId}`);
      try {
        if (!isTrackingActive(requestId)) {
          return socket.emit('error', { message: 'Tracking session not found' });
        }

        const session = getTrackingSession(requestId);
        if (!authorizeTracking(requestId, userId)) {
          console.log(`[socket] join_tracking unauthorized: user=${userId} requestId=${requestId}`);
          return socket.emit('error', { message: 'Not authorized for this tracking session' });
        }

        const room = `tracking:${requestId}`;
        socket.join(room);
        console.log(`[socket] joined room=${room} socket=${socket.id}`);
        updateUserOnline(requestId, userId);

        const updatedSession = getTrackingSession(requestId);
        io.to(room).emit('user_presence', {
          userId,
          donorOnline: updatedSession.donorOnline,
          requesterOnline: updatedSession.requesterOnline,
        });

        if (updatedSession.lastDonorUpdate) {
          socket.emit('donor_location_update', {
            requestId,
            location: updatedSession.lastDonorUpdate,
            updatedAt: updatedSession.lastDonorUpdate.updatedAt,
          });
        }
      } catch (err) {
        console.log('[socket] join_tracking error:', err.message);
        socket.emit('error', { message: 'Failed to join tracking session' });
      }
    });

    socket.on('donor_location_update', ({ requestId, latitude, longitude, accuracy }) => {
      console.log(`[socket] donor_location_update from user=${userId} requestId=${requestId}`);
      try {
        if (!isTrackingActive(requestId)) {
          return socket.emit('error', { message: 'Tracking session not found' });
        }

        const session = getTrackingSession(requestId);
        if (session.donorId !== userId) {
          return socket.emit('error', { message: 'Only the donor can send location updates' });
        }

        const location = {
          latitude,
          longitude,
          accuracy: accuracy || 0,
        };

        updateDonorLocation(requestId, userId, location);

        const room = `tracking:${requestId}`;
        io.to(room).emit('donor_location_update', {
          requestId,
          location,
          updatedAt: Date.now(),
        });
      } catch (err) {
        console.log('[socket] donor_location_update error:', err.message);
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    socket.on('leave_tracking', ({ requestId }) => {
      try {
        const room = `tracking:${requestId}`;
        socket.leave(room);
        console.log(`[socket] leave_tracking: user=${userId} room=${room}`);
      } catch (err) {
        // ignore
      }
    });

    socket.on('disconnect', () => {
      console.log(`[socket] disconnect: socket=${socket.id} user=${userId}`);
      try {
        RequestTracker.forEach((session, key) => {
          if (session.donorId === userId || session.requesterId === userId) {
            const room = key.replace('tracking:', '');
            io.to(room).emit('user_presence', {
              userId,
              donorOnline: session.donorId === userId ? false : session.donorOnline,
              requesterOnline: session.requesterId === userId ? false : session.requesterOnline,
            });
          }
        });
      } catch (err) {
        // ignore
      }
    });
  });

  return io;
};

const broadcastToTracking = (requestId, event, data) => {
  if (!io) return;
  const room = `tracking:${requestId}`;
  io.to(room).emit(event, data);
};

const cleanupTrackingRoom = (requestId) => {
  if (!io) return;
  const room = `tracking:${requestId}`;
  const clients = io.sockets.adapter.rooms.get(room);
  if (!clients) return;
  for (const socketId of clients) {
    const s = io.sockets.sockets.get(socketId);
    try {
      if (s) {
        s.leave(room);
        s.emit('leave_tracking', { requestId });
      }
    } catch (err) {
      // ignore
    }
  }
};

const getIO = () => io;

module.exports = {
  initializeSocket,
  getIO,
  broadcastToTracking,
  startTracking,
  endTracking,
  isTrackingActive,
  getTrackingSession,
  authorizeTracking,
  cleanupTrackingRoom,
};
