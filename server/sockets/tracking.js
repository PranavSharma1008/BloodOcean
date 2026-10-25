// server/sockets/tracking.js
// Socket.IO handlers for live donor tracking with authentication & validation

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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
  const { getAllowedOrigins } = require('../config/security');
  const defaultOrigins = getAllowedOrigins();
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
        return next(new Error('Authentication required'));
      }
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findById(decoded.id).select('_id role');
        if (!user) {
          return next(new Error('User not found'));
        }
        socket.user = { id: user._id.toString(), role: user.role };
        next();
      } catch (verifyErr) {
        return next(new Error('Invalid token'));
      }
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = String(socket.user.id);

    try {
      socket.join(`user:${userId}`);
    } catch (err) {
      // ignore
    }

    socket.on('join_tracking', ({ requestId }) => {
      try {
        if (!requestId || typeof requestId !== 'string') {
          return socket.emit('error', { message: 'Invalid request ID' });
        }

        if (!isTrackingActive(requestId)) {
          return socket.emit('error', { message: 'Tracking session not found' });
        }

        if (!authorizeTracking(requestId, userId)) {
          return socket.emit('error', { message: 'Not authorized for this tracking session' });
        }

        const room = `tracking:${requestId}`;
        socket.join(room);
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
        socket.emit('error', { message: 'Failed to join tracking session' });
      }
    });

    socket.on('donor_location_update', ({ requestId, latitude, longitude, accuracy }) => {
      try {
        if (!requestId || typeof requestId !== 'string') {
          return socket.emit('error', { message: 'Invalid request ID' });
        }

        if (!isTrackingActive(requestId)) {
          return socket.emit('error', { message: 'Tracking session not found' });
        }

        const session = getTrackingSession(requestId);
        if (session.donorId !== userId) {
          return socket.emit('error', { message: 'Only the donor can send location updates' });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const acc = Number(accuracy) || 0;

        if (Number.isNaN(lat) || Number.isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          return socket.emit('error', { message: 'Invalid coordinates' });
        }

        const location = {
          latitude: lat,
          longitude: lng,
          accuracy: Math.max(0, Math.min(acc, 5000)),
        };

        updateDonorLocation(requestId, userId, location);

        const room = `tracking:${requestId}`;
        io.to(room).emit('donor_location_update', {
          requestId,
          location,
          updatedAt: Date.now(),
        });
      } catch (err) {
        socket.emit('error', { message: 'Failed to update location' });
      }
    });

    socket.on('leave_tracking', ({ requestId }) => {
      try {
        if (!requestId || typeof requestId !== 'string') return;
        const room = `tracking:${requestId}`;
        socket.leave(room);
      } catch (err) {
        // ignore
      }
    });

    socket.on('disconnect', () => {
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
