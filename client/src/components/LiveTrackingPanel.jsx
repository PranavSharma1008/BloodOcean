import { useEffect, useState, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';

const formatDistance = (meters, t) => {
  if (meters < 1000) return `${Math.round(meters)}${t(' m')}`;
  return `${(meters / 1000).toFixed(1)}${t(' km')}`;
};

const formatDuration = (seconds, t) => {
  if (seconds < 60) return `${Math.round(seconds)}${t(' sec')}`;
  if (seconds < 3600) return `${Math.round(seconds / 60)}${t(' min')}`;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.round((seconds % 3600) / 60);
  return `${hours}${t('h ')}${mins}${t('m')}`;
};

const formatTime = (timestamp, t) => {
  if (!timestamp) return t('N/A');
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
};

const calculateHaversineDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;
  const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const LiveTrackingPanel = ({
  requesterLocation,
  donorLocation,
  routeData,
  userRole,
  userName,
  onStartTracking,
  onStopTracking,
  onArrived,
  trackingActive,
}) => {
  const { t } = useLanguage();
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [arrived, setArrived] = useState(false);
  const arrivedRef = useRef(false);

  useEffect(() => {
    if (!requesterLocation || !donorLocation) return;

    const reqLat = requesterLocation[1];
    const reqLng = requesterLocation[0];
    const donLat = donorLocation.lat;
    const donLng = donorLocation.lng;

    const dist = calculateHaversineDistance(donLat, donLng, reqLat, reqLng);
    setDistance(dist);

    if (routeData && routeData.duration && routeData.distance) {
      const speedFactor = dist / routeData.distance;
      const estimatedTime = routeData.duration * speedFactor;
      setEta(estimatedTime);
    } else if (dist > 0) {
      const avgSpeed = 5;
      setEta((dist / 1000) / avgSpeed * 3600);
    }

    if (dist < 10 && !arrivedRef.current) {
      arrivedRef.current = true;
      setArrived(true);
      if (onArrived) {
        onArrived();
      }
      if (onStopTracking) {
        onStopTracking();
      }
    }
  }, [requesterLocation, donorLocation, routeData, onStopTracking, onArrived]);

  return (
    <div className="card p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 font-display">{t('Live Tracking')}</h3>
        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
          arrived ? 'bg-green-100 text-green-700' : trackingActive ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600'
        }`}>
          {arrived ? t('Arrived') : trackingActive ? t('Live') : t('Inactive')}
        </span>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${trackingActive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-sm font-medium text-gray-700">{t('Donor Status')}</span>
          </div>
          <span className="text-sm font-bold text-gray-900">
            {arrived ? t('Arrived at location') : trackingActive ? t('On the way') : t('Waiting')}
          </span>
        </div>

        {userRole === 'donor' && trackingActive && !arrived && (
          <div className="p-3 rounded-xl bg-blue-50 border-2 border-blue-100">
            <p className="text-sm text-blue-700 font-medium">{t('Share your live location with the requester')}</p>
            <p className="text-xs text-blue-500 mt-1">{t('Keep this page open while traveling')}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-red-50">
            <p className="text-xs text-gray-500 mb-1">{t('Distance Remaining')}</p>
            <p className="text-lg font-extrabold text-gray-900">
              {distance !== null ? formatDistance(distance, t) : t('N/A')}
            </p>
          </div>
          <div className="p-3 rounded-xl bg-blue-50">
            <p className="text-xs text-gray-500 mb-1">{t('Est. Arrival')}</p>
            <p className="text-lg font-extrabold text-gray-900">
              {eta !== null ? formatDuration(eta, t) : t('N/A')}
            </p>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-gray-50">
          <p className="text-xs text-gray-500 mb-1">{t('Last Updated')}</p>
          <p className="text-sm font-semibold text-gray-900">
            {donorLocation?.updatedAt ? formatTime(donorLocation.updatedAt, t) : t('Waiting for location...')}
          </p>
        </div>

        {arrived && (
          <div className="p-3 rounded-xl bg-green-50 border-2 border-green-200 animate-pulse">
            <p className="text-sm font-bold text-green-700">{t('Donor has arrived at the location!')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiveTrackingPanel;
