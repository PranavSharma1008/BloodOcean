import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getTranslatedState, getTranslatedDistrict } from '../data/locations';
import { useTrackingSocket } from '../hooks/useTrackingSocket';
import 'leaflet/dist/leaflet.css';

const markerHtml = (color, label) => `<div style="
  width: 36px; height: 36px; border-radius: 50%;
  background: ${color}; border: 3px solid white;
  box-shadow: 0 4px 12px rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 13px;
">${label}</div>`;

const DonorMarker = ({ position }) => {
  const { t } = useLanguage();
  const markerRef = useRef(null);
  const prevPosRef = useRef(null);

  useEffect(() => {
    if (markerRef.current && position) {
      const newLatLng = new L.LatLng(position.lat, position.lng);
      if (prevPosRef.current) {
        const distance = prevPosRef.current.distanceTo(newLatLng);
        if (distance > 0.5) {
          markerRef.current.setLatLng(newLatLng);
          prevPosRef.current = newLatLng;
        }
      } else {
        markerRef.current.setLatLng(newLatLng);
        prevPosRef.current = newLatLng;
      }
    }
  }, [position]);

  const icon = L.divIcon({ className: '', html: markerHtml('#dc2626', 'D'), iconSize: [36, 36], iconAnchor: [18, 18] });

  return (
    <Marker ref={markerRef} position={position || [0, 0]} icon={icon}>
      <Popup><p className="font-bold text-red-700 text-sm">{t('Donor')}</p></Popup>
    </Marker>
  );
};

const RequesterMarker = ({ position }) => {
  const { t } = useLanguage();
  const icon = L.divIcon({ className: '', html: markerHtml('#2563eb', 'R'), iconSize: [36, 36], iconAnchor: [18, 18] });
  return (
    <Marker position={position || [0, 0]} icon={icon}>
      <Popup><p className="font-bold text-blue-700 text-sm">{t('Requester')}</p></Popup>
    </Marker>
  );
};

const UserMarker = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const icon = L.divIcon({
    className: '',
    html: '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#991b1b);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
    iconSize: [36, 36], iconAnchor: [18, 18],
  });
  const coords = user?.location?.coordinates;
  if (!coords || !Array.isArray(coords) || coords.length < 2 || coords[0] === 0) return null;
  return (
    <Marker position={[coords[1], coords[0]]} icon={icon}>
      <Popup><div className="text-center font-semibold text-sm">{t('You')}</div></Popup>
    </Marker>
  );
};

const donorIcon = L.divIcon({ className: '', html: markerHtml('#22c55e', ''), iconSize: [28, 28], iconAnchor: [14, 14] });
const campIcon = L.divIcon({ className: '', html: markerHtml('#3b82f6', ''), iconSize: [28, 28], iconAnchor: [14, 14] });
const emergencyIcon = L.divIcon({ className: '', html: markerHtml('#ef4444', ''), iconSize: [28, 28], iconAnchor: [14, 14] });

const RouteFetcher = ({ from, to, onRouteLoaded }) => {
  const map = useMap();

  useEffect(() => {
    if (!from || !to || from[0] === 0 || to[0] === 0) return;

    const fetchRoute = async () => {
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${from[0]},${from[1]};${to[0]},${to[1]}?overview=full&geometries=geojson`;
        const response = await fetch(url);
        const data = await response.json();
        if (data.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coordinates = route.geometry.coordinates.map(([lng, lat]) => [lat, lng]);
          onRouteLoaded({ coordinates, distance: route.distance, duration: route.duration });
          const bounds = L.latLngBounds(coordinates);
          map.fitBounds(bounds, { padding: [50, 50] });
        }
      } catch (err) {
        console.error('Failed to fetch route:', err);
      }
    };
    fetchRoute();
  }, [from, to, map, onRouteLoaded]);

  return null;
};

const MAP_TABS = (t) => [
  { id: 'all', label: t('All') },
  { id: 'donors', label: t('Donors') },
  { id: 'camps', label: t('Camps') },
  { id: 'emergencies', label: t('Requests') },
];

const MapPage = () => {
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const trackingId = searchParams.get('tracking');

  const [activeTab, setActiveTab] = useState(trackingId ? 'tracking' : 'all');
  const [camps, setCamps] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [center, setCenter] = useState([20.5937, 78.9629]);

  const [trackingData, setTrackingData] = useState(null);
  const [trackingError, setTrackingError] = useState('');
  const [routeCoords, setRouteCoords] = useState(null);
  const [trackingRequestType, setTrackingRequestType] = useState(null);

  const completedRef = useRef(false);

  const {
    connected,
    donorLocation,
    error: socketError,
    startWatching,
    stopWatching,
    requestCompleted,
  } = useTrackingSocket(trackingId, token, user);

  const authHeaders = { headers: { Authorization: `Bearer ${token}` } };

  const normalizeCoordinates = (location) => {
    if (!location) return [0, 0];
    if (Array.isArray(location)) return location.length === 2 ? location : [0, 0];
    if (location?.coordinates && Array.isArray(location.coordinates) && location.coordinates.length >= 2) return location.coordinates;
    return [0, 0];
  };

  useEffect(() => {
    if (user?.location?.coordinates) {
      const [lng, lat] = user.location.coordinates;
      setCenter([lat, lng]);
    }
    if (!trackingId) {
      fetchAll();
    }
  }, [user]);

  useEffect(() => {
    if (trackingId) {
      setActiveTab('tracking');
      fetchTrackingData();
    }
  }, [trackingId, token]);

  useEffect(() => {
    if (socketError) setTrackingError(socketError);
  }, [socketError]);

  useEffect(() => {
    if (requestCompleted) {
      completedRef.current = true;
      if (trackingRequestType === 'blood') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/emergency-requests', { replace: true });
      }
    }
  }, [requestCompleted, trackingRequestType, navigate]);

  useEffect(() => {
    if (trackingData && !completedRef.current) {
      const isDonor = (user?.id || user?._id) === trackingData.donor?.id;
      if (isDonor && trackingData.status === 'accepted') {
        startWatching();
      }
    }
  }, [trackingData, user]);

  useEffect(() => {
    if (!trackingData || completedRef.current || !donorLocation) return;
    if (!donorLocation.lat || !donorLocation.lng) return;
    const requesterCoords = trackingData.requester?.location?.coordinates || [0, 0];
    if (!requesterCoords[0] || !requesterCoords[1]) return;
    const R = 6371e3;
    const lat1 = donorLocation.lat * Math.PI / 180;
    const lat2 = requesterCoords[1] * Math.PI / 180;
    const dLat = (requesterCoords[1] - donorLocation.lat) * Math.PI / 180;
    const dLon = (requesterCoords[0] - donorLocation.lng) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
    const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    if (!isFinite(dist)) return;
    if (dist < 10) {
      handleArrived();
    }
  }, [donorLocation, trackingData]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [campsRes, emergRes, donRes] = await Promise.all([
        api.get('/api/camps', authHeaders),
        api.get('/api/emergency', authHeaders),
        api.get('/api/donors/nearby', { ...authHeaders, params: { useGps: false, state: '', district: '', radius: 1000 } }),
      ]);
      setCamps(Array.isArray(campsRes.data) ? campsRes.data : campsRes.data.camps || []);
      setEmergencies(emergRes.data.emergencyRequests || []);
      setDonors(donRes.data.donors || []);
    } catch (err) {
      console.error('Failed to fetch map data:', err);
    }
    setLoading(false);
  };

  const fetchTrackingData = async () => {
    setLoading(true);
    try {
      let response;
      let type = 'emergency';
      try {
        response = await api.get(`/api/emergency/${trackingId}/tracking`, authHeaders);
      } catch (emergencyErr) {
        if (emergencyErr.response?.status === 404) {
          response = await api.get(`/api/blood-requests/${trackingId}/tracking`, authHeaders);
          type = 'blood';
        } else {
          throw emergencyErr;
        }
      }
      if (response.data.success) {
        const tracking = response.data.tracking;
        tracking.requester.location = { coordinates: normalizeCoordinates(tracking.requester.location) };
        tracking.donor.location = { coordinates: normalizeCoordinates(tracking.donor.location) };
        setTrackingData(tracking);
        setTrackingRequestType(type);
      } else {
        setTrackingError(response.data.message || 'Tracking data not available');
      }
    } catch (err) {
      setTrackingError(err.response?.data?.message || 'Failed to load tracking');
    }
    setLoading(false);
  };

  const handleArrived = async () => {
    if (completedRef.current) return;
    completedRef.current = true;
    try {
      if (trackingRequestType === 'blood') {
        await api.put(`/api/blood-requests/${trackingId}/complete`, {}, authHeaders);
        navigate('/dashboard', { replace: true });
      } else {
        await api.put(`/api/emergency/${trackingId}/complete`, {}, authHeaders);
        navigate('/emergency-requests', { replace: true });
      }
    } catch (err) {
      if (trackingRequestType === 'blood') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/emergency-requests', { replace: true });
      }
    }
  };

  const handleRouteLoaded = (route) => {
    setRouteCoords(route.coordinates);
  };

  const markers = [];
  if (!trackingId && (activeTab === 'all' || activeTab === 'donors')) {
    donors.forEach((d) => {
      const coords = d.location?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2 && coords[0] !== 0) {
        markers.push({ type: 'donor', data: d, lat: coords[1], lng: coords[0] });
      }
    });
  }
  if (!trackingId && (activeTab === 'all' || activeTab === 'camps')) {
    camps.forEach((c) => {
      const coords = c.location?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2 && coords[0] !== 0) {
        markers.push({ type: 'camp', data: c, lat: coords[1], lng: coords[0] });
      }
    });
  }
  if (!trackingId && (activeTab === 'all' || activeTab === 'emergencies')) {
    emergencies.forEach((e) => {
      const coords = e.requesterLocation?.coordinates;
      if (Array.isArray(coords) && coords.length >= 2 && coords[0] !== 0) {
        markers.push({ type: 'emergency', data: e, lat: coords[1], lng: coords[0] });
      }
    });
  }

  const renderTrackingMap = () => {
    if (!trackingData) return null;
    const donor = trackingData.donor || {};
    const requester = trackingData.requester || {};

    const requesterCoords = requester.location?.coordinates || [0, 0];
    const requesterPos = requesterCoords[0] !== 0 ? [requesterCoords[1], requesterCoords[0]] : null;
    const donorInitialCoords = donor.location?.coordinates || null;
    const donorInitial = donorInitialCoords && donorInitialCoords[0] !== 0
      ? { lat: donorInitialCoords[1], lng: donorInitialCoords[0] }
      : null;
    const donorPos = donorLocation || donorInitial;

    const routeFrom = donorPos ? [donorPos.lng, donorPos.lat] : null;
    const routeTo = requesterPos ? [requesterPos[1], requesterPos[0]] : null;

    const mapCenter = donorPos ? [donorPos.lat, donorPos.lng] : requesterPos || center;
    const showWaiting = !donorPos && !requesterPos;

    return (
      <>
        {showWaiting ? (
          <div className="h-full flex items-center justify-center bg-gray-50">
            <div className="text-center p-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 font-display mb-2">{t('Waiting for location')}</h3>
              <p className="text-gray-500 max-w-sm mx-auto">
                {t('Donor location will appear here once they start sharing. Make sure both users have location enabled.')}
              </p>
            </div>
          </div>
        ) : (
          <MapContainer center={mapCenter} zoom={13} className="h-full w-full" scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {requesterPos && <RequesterMarker position={requesterPos} />}
            {donorPos && <DonorMarker position={donorPos} />}
            {routeFrom && routeTo && (
              <RouteFetcher from={routeFrom} to={routeTo} onRouteLoaded={handleRouteLoaded} />
            )}
            {routeCoords && (
              <Polyline positions={routeCoords} color="#ef4444" weight={4} opacity={0.7} />
            )}
          </MapContainer>
        )}

        <div className="absolute bottom-4 left-4 right-4 z-[1000]">
          <div className="bg-white/95 backdrop-blur rounded-2xl shadow-xl border border-gray-100 p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${donorPos ? 'bg-red-500' : 'bg-gray-300'} inline-block`} />
                  <span className="text-sm font-medium text-gray-700">{t('Donor: ')}{donor.name || t('Unknown')}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${requesterPos ? 'bg-blue-500' : 'bg-gray-300'} inline-block`} />
                  <span className="text-sm font-medium text-gray-700">{t('Requester: ')}{requester.name || t('Unknown')}</span>
                </div>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full ${connected ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {connected ? t('Live') : t('Connecting...')}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span>{trackingData.bloodGroup} • {trackingData.hospital}</span>
              </div>
              <button
                onClick={handleArrived}
                className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition-all"
              >
                {t('Mark Complete')}
              </button>
            </div>
          </div>
        </div>
      </>
    );
  };

  const renderNormalMap = () => (
    <>
      <div className="flex flex-wrap gap-2 mb-4">
        {MAP_TABS(t).map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === tab.id
                ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border-2 border-gray-100'
            }`}>
            {tab.label}
          </button>
        ))}
        <button onClick={fetchAll} className="ml-auto p-2.5 rounded-xl bg-white border-2 border-gray-100 text-gray-500 hover:text-red-600 hover:border-red-200 transition-all">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        </button>
      </div>

      <div className="flex flex-wrap gap-4 mb-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" /> {t('Donors')} ({donors.length})</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-blue-500" /> {t('Camps')} ({camps.length})</span>
        <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-500" /> {t('Emergencies')} ({emergencies.length})</span>
      </div>

      <div className="card overflow-hidden" style={{ height: trackingId ? '100%' : '600px' }}>
        <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom={true}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <UserMarker />
          {markers.map((m, i) => (
            <Marker key={`${m.type}-${m.data._id || i}`} position={[m.lat, m.lng]} icon={m.type === 'donor' ? donorIcon : m.type === 'camp' ? campIcon : emergencyIcon}>
              <Popup>
                <div className="min-w-[180px]">
                  {m.type === 'donor' && (
                    <>
                      <p className="font-bold text-green-700 mb-1">{t('Donor')}</p>
                      <Link to={`/user/${m.data._id}`} className="text-sm text-green-600 hover:underline">{m.data.name}</Link>
                      <p className="text-sm font-bold text-red-600">{m.data.bloodGroup}</p>
                      <p className="text-xs text-gray-500">{m.data.city && `${m.data.city}, `}{getTranslatedState(m.data.state, lang)}</p>
                    </>
                  )}
                  {m.type === 'camp' && (
                    <>
                      <p className="font-bold text-blue-700 mb-1">{t('Camp')}</p>
                      <p className="text-sm font-semibold">{m.data.campName}</p>
                      <p className="text-xs text-gray-500">{m.data.city ? `${m.data.city}, ` : ''}{getTranslatedDistrict(m.data.district, lang)}, {getTranslatedState(m.data.state, lang)}</p>
                      <p className="text-xs text-gray-500">{m.data.contactNumber}</p>
                    </>
                  )}
                  {m.type === 'emergency' && (
                    <>
                      <p className="font-bold text-red-700 mb-1">{t('Emergency')}</p>
                      <p className="text-sm">{m.data.patientName}</p>
                      <p className="text-sm font-bold text-red-600">{m.data.bloodGroup}</p>
                      <p className="text-xs text-gray-500">{m.data.hospital}</p>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </>
  );

  if (!trackingData && !loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md mx-4">
          <p className="font-semibold">{trackingError || t('Tracking session not found')}</p>
          <Link to="/emergency-requests" className="text-red-600 underline mt-2 inline-block">{t('Go back')}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 font-display">
              {trackingId ? t('Live Tracking') : t('Interactive Map')}
            </h1>
            <p className="text-gray-500 mt-1">
              {trackingId
                ? trackingData
                  ? `${trackingData.bloodGroup} ${t('request')} • ${trackingData.hospital}`
                  : t('Loading tracking session...')
                : t('Explore donors, camps, and emergency requests')}
            </p>
          </div>
          {trackingId && (
            <Link to="/map" className="btn-secondary text-sm py-2 px-4">{t('Exit Tracking')}</Link>
          )}
        </div>

        <div className="card overflow-hidden relative" style={{ height: trackingId ? 'calc(100vh - 220px)' : '600px' }}>
          {loading ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <div className="inline-block w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
                <p className="mt-3 text-gray-500 font-medium">{t('Loading...')}</p>
              </div>
            </div>
          ) : trackingId ? (
            renderTrackingMap()
          ) : (
            renderNormalMap()
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPage;