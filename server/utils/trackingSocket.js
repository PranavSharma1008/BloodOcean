// NEW FILE: server/utils/trackingSocket.js
// Handles real-time live donor tracking via Socket.IO

const RequestTracker = new Map();

const getTrackingKey = (requestId) => `tracking:${requestId}`;

const startTracking = (requestId, requesterId, donorId) => {
  const key = getTrackingKey(requestId);
  RequestTracker.set(key, {
    requestId,
    requesterId: String(requesterId),
    donorId: String(donorId),
    donorOnline: false,
    requesterOnline: false,
    lastDonorUpdate: null,
    lastRequesterUpdate: null,
  });
  console.log(`[tracking] session started: requestId=${requestId} requester=${requesterId} donor=${donorId}`);
};

const endTracking = (requestId) => {
  RequestTracker.delete(getTrackingKey(requestId));
  console.log(`[tracking] session ended: requestId=${requestId}`);
};

const updateUserOnline = (requestId, userId) => {
  const key = getTrackingKey(requestId);
  const session = RequestTracker.get(key);
  if (!session) return null;

  if (session.donorId === String(userId)) {
    session.donorOnline = true;
  }
  if (session.requesterId === String(userId)) {
    session.requesterOnline = true;
  }
  return session;
};

const updateDonorLocation = (requestId, userId, location) => {
  const key = getTrackingKey(requestId);
  const session = RequestTracker.get(key);
  if (!session) return null;

  if (session.donorId !== String(userId)) return null;

  session.lastDonorUpdate = {
    ...location,
    updatedAt: Date.now(),
  };
  return session;
};

const isTrackingActive = (requestId) => {
  return RequestTracker.has(getTrackingKey(requestId));
};

const getTrackingSession = (requestId) => {
  return RequestTracker.get(getTrackingKey(requestId)) || null;
};

const authorizeTracking = (requestId, userId) => {
  const session = RequestTracker.get(getTrackingKey(requestId));
  if (!session) return false;
  return session.donorId === String(userId) || session.requesterId === String(userId);
};

module.exports = {
  startTracking,
  endTracking,
  updateUserOnline,
  updateDonorLocation,
  isTrackingActive,
  getTrackingSession,
  authorizeTracking,
  // For debugging: return a snapshot of active tracking sessions
  listTrackingSessions: () => {
    const result = {};
    RequestTracker.forEach((value, key) => {
      result[key] = {
        requestId: value.requestId,
        requesterId: value.requesterId,
        donorId: value.donorId,
        donorOnline: value.donorOnline,
        requesterOnline: value.requesterOnline,
        lastDonorUpdate: value.lastDonorUpdate,
      };
    });
    return result;
  },
};
