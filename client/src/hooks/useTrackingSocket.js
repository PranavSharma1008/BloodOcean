// NEW FILE: client/src/hooks/useTrackingSocket.js
// Client-side Socket.IO hook for live donor tracking

import { useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

export const useTrackingSocket = (requestId, token, user) => {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [donorLocation, setDonorLocation] = useState(null);
  const [userPresence, setUserPresence] = useState({ donorOnline: false, requesterOnline: false });
  const [error, setError] = useState('');
  const [requestCompleted, setRequestCompleted] = useState(false);
  const watchIdRef = useRef(null);

  useEffect(() => {
    if (!requestId || !token || !user) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      setError('');
      socket.emit('join_tracking', { requestId });
    });

    socket.on('disconnect', () => {
      setConnected(false);
    });

    socket.on('tracking_started', () => {
      socket.emit('join_tracking', { requestId });
    });

    socket.on('tracking_ended', () => {
      stopWatching();
      setDonorLocation(null);
    });

    // Server may instruct clients to leave the tracking room
    socket.on('leave_tracking', () => {
      stopWatching();
      setDonorLocation(null);
    });

    socket.on('donor_location_update', (data) => {
      if (data.location) {
        setDonorLocation({
          lat: data.location.latitude,
          lng: data.location.longitude,
          accuracy: data.location.accuracy,
          updatedAt: data.updatedAt || Date.now(),
        });
      }
    });

    socket.on('user_presence', (data) => {
      setUserPresence({
        donorOnline: data.donorOnline,
        requesterOnline: data.requesterOnline,
      });
    });

    socket.on('error', (data) => {
      setError(data.message || 'Tracking error');
    });

    socket.on('request_completed', (data) => {
      if (data.requestId === requestId) {
        setRequestCompleted(true);
      }
    });

    return () => {
      stopWatching();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [requestId, token, user, stopWatching]);

  const startWatching = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
    }

    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        if (socketRef.current && socketRef.current.connected) {
          socketRef.current.emit('donor_location_update', {
            requestId,
            latitude,
            longitude,
            accuracy,
          });
        }
      },
      (err) => {
        setError(`Location error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 2000,
      }
    );
  }, [requestId]);

  const stopWatching = useCallback(() => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  }, []);

  return {
    connected,
    donorLocation,
    userPresence,
    error,
    requestCompleted,
    startWatching,
    stopWatching,
  };
};
