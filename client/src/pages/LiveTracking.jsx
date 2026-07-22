import { useState, useEffect, useRef } from 'react';
import { useParams, Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTrackingSocket } from '../hooks/useTrackingSocket';
import api from '../api/axios';
import LiveTrackingMap from '../components/LiveTrackingMap';
import LiveTrackingPanel from '../components/LiveTrackingPanel';

const LiveTracking = () => {
  const { requestId: id } = useParams();
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingActive, setTrackingActive] = useState(false);
  const [routeData, setRouteData] = useState(null);
  const [requestType, setRequestType] = useState(null);
  const navigate = useNavigate();
  const completedRef = useRef(false);

  const {
    connected,
    donorLocation,
    userPresence,
    error: socketError,
    requestCompleted,
    startWatching,
    stopWatching,
  } = useTrackingSocket(id, token, user);

  useEffect(() => {
    fetchTrackingData();
  }, [id, token]);

  useEffect(() => {
    if (socketError) {
      setError(socketError);
    }
  }, [socketError]);

  useEffect(() => {
    if (requestCompleted) {
      completedRef.current = true;
      if (requestType === 'blood') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/emergency-requests', { replace: true });
      }
    }
  }, [requestCompleted, requestType, navigate]);

  useEffect(() => {
    if (request && !completedRef.current) {
      const isDonor = user?.id === request.donor?.id;
      if (isDonor && !trackingActive) {
        handleStartTracking();
      }
    }
  }, [request, user]);

  const normalizeCoordinates = (location) => {
    if (!location) return [0, 0];
    if (Array.isArray(location)) return location.length === 2 ? location : [0, 0];
    if (location.coordinates && Array.isArray(location.coordinates)) return location.coordinates;
    return [0, 0];
  };

  const fetchTrackingData = async () => {
    try {
      let response;
      let type = 'emergency';
      try {
        response = await api.get(`/api/emergency/${id}/tracking`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (emergencyErr) {
        if (emergencyErr.response?.status === 404) {
          response = await api.get(`/api/blood-requests/${id}/tracking`, {
            headers: { Authorization: `Bearer ${token}` },
          });
          type = 'blood';
        } else {
          throw emergencyErr;
        }
      }

      if (response.data.success) {
        const tracking = response.data.tracking;
        tracking.requester.location = { coordinates: normalizeCoordinates(tracking.requester.location) };
        tracking.donor.location = { coordinates: normalizeCoordinates(tracking.donor.location) };
        setRequest(tracking);
        setRequestType(type);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to load tracking data'));
    } finally {
      setLoading(false);
    }
  };

  const handleRouteLoaded = (route) => {
    setRouteData(route);
  };

  const handleStartTracking = () => {
    setTrackingActive(true);
    startWatching();
  };

  const handleStopTracking = () => {
    setTrackingActive(false);
    stopWatching();
  };

  const handleArrived = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (requestType === 'blood') {
        await api.put(`/api/blood-requests/${id}/complete`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate('/dashboard', { replace: true });
      } else {
        await api.put(`/api/emergency/${id}/complete`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate('/emergency-requests', { replace: true });
      }
    } catch (err) {
      if (requestType === 'blood') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/emergency-requests', { replace: true });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
          <p className="mt-3 text-gray-500 font-medium">{t('Loading tracking session...')}</p>
        </div>
      </div>
    );
  }

  if (error && !request) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md mx-4">
          <p className="font-semibold">{error}</p>
          <Link to="/dashboard" className="text-red-600 underline mt-2 inline-block">{t('Go back')}</Link>
        </div>
      </div>
    );
  }

  if (!request || request.status !== 'accepted') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-yellow-50 border-2 border-yellow-200 text-yellow-800 px-6 py-4 rounded-xl max-w-md mx-4">
          <p className="font-semibold">{t('Tracking is only available for accepted requests')}</p>
          <Link to="/dashboard" className="text-yellow-700 underline mt-2 inline-block">{t('Go back')}</Link>
        </div>
      </div>
    );
  }

  const donor = request.donor || {};
  const requester = request.requester || {};

  const isDonor = (user?.id || user?._id) === donor.id;
  const isRequester = (user?.id || user?._id) === requester.id;
  const shouldShowTracking = isDonor || isRequester;

  if (!shouldShowTracking) {
    return <Navigate to="/dashboard" replace />;
  }

  const requesterCoords = requester.location?.coordinates || [0, 0];
  const requesterLocation = requesterCoords[0] !== 0 || requesterCoords[1] !== 0 ? requesterCoords : null;
  const donorInitialCoords = donor.location?.coordinates || null;
  const donorInitial = donorInitialCoords && (donorInitialCoords[0] !== 0 || donorInitialCoords[1] !== 0)
    ? { lat: donorInitialCoords[1], lng: donorInitialCoords[0] }
    : null;
  const donorLocationForMap = donorLocation || donorInitial;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Live Tracking')}</h1>
            <p className="text-gray-500 mt-1">
              {t('Blood request for')} {request.bloodGroup} • {isDonor ? t('Donor View') : t('Requester View')}
            </p>
          </div>
        </div>

        {!connected && (
          <div className="mb-4 p-3 rounded-xl bg-yellow-50 border-2 border-yellow-200 text-sm text-yellow-800">
            {t('Connecting to tracking server...')}
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 border-2 border-red-200 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <LiveTrackingMap
              requesterLocation={requesterLocation}
              donorLocation={donorLocationForMap}
              onRouteLoaded={handleRouteLoaded}
              routeCoords={routeData?.coordinates}
            />

            <div className="mt-4 card p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {t('Donor: ')}{donor.name || t('Unknown')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-blue-500" />
                    <span className="text-sm font-medium text-gray-700">
                      {t('Requester: ')}{requester.name || t('Unknown')}
                    </span>
                  </div>
                </div>
                <div className="flex gap-2">
                  {isDonor && !trackingActive && (
                    <button onClick={handleStartTracking} className="btn-primary text-sm py-2 px-4">
                      {t('Start Sharing Location')}
                    </button>
                  )}
                  {isDonor && trackingActive && (
                    <button onClick={handleStopTracking} className="btn-secondary text-sm py-2 px-4">
                      {t('Stop Sharing')}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <LiveTrackingPanel
              requesterLocation={requesterCoords}
              donorLocation={donorLocationForMap}
              routeData={routeData}
              userRole={isDonor ? 'donor' : 'requester'}
              userName={user?.name}
              onStartTracking={handleStartTracking}
              onStopTracking={handleStopTracking}
              onArrived={handleArrived}
              trackingActive={trackingActive}
            />

            <div className="card p-4">
              <h4 className="text-sm font-bold text-gray-900 mb-3">{t('Request Details')}</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p><span className="font-medium">{t('Blood Group:')}</span> {request.bloodGroup}</p>
                <p><span className="font-medium">{t('Hospital:')}</span> {request.hospital}</p>
                <p><span className="font-medium">{t('Contact:')}</span> {requester.phone || t('N/A')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveTracking;
