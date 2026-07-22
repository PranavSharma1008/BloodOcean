import { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';

const THROTTLE_MS = 30000;

const useLocationTracker = () => {
  const { user, token, updateLocation } = useAuth();
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    if (!user || !token) return;
    if (!navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      async (position) => {
        const now = Date.now();
        if (now - lastUpdateRef.current < THROTTLE_MS) return;
        lastUpdateRef.current = now;

        const { latitude, longitude } = position.coords;
        await updateLocation(latitude, longitude);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [user, token, updateLocation]);
};

export default useLocationTracker;
