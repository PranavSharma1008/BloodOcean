import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';
import { getTranslatedState, getTranslatedDistrict } from '../data/locations';
import 'leaflet/dist/leaflet.css';

const markerHtml = (color, label) => `<div style="
  width: 36px; height: 36px; border-radius: 50%;
  background: ${color}; border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 12px;
">${label}</div>`;

const campIcon = L.divIcon({ className: '', html: markerHtml('#3b82f6', 'C'), iconSize: [36, 36], iconAnchor: [18, 18] });
const userIcon = L.divIcon({
  className: '',
  html: '<div style="width:36px;height:36px;border-radius:50%;background:linear-gradient(135deg,#dc2626,#991b1b);border:3px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></div>',
  iconSize: [36, 36], iconAnchor: [18, 18],
});

const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

const CampLocationMap = () => {
  const { id } = useParams();
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();
  const [camp, setCamp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [distance, setDistance] = useState(null);
  const [center, setCenter] = useState([20.5937, 78.9629]);

  useEffect(() => {
    fetchCamp();
  }, [id]);

  const fetchCamp = async () => {
    try {
      const response = await api.get(`/api/camps/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data) {
        setCamp(response.data);
        const campLoc = response.data.location?.coordinates;
        const userLoc = user?.location?.coordinates;
        
        if (campLoc && campLoc[0] !== 0 && campLoc[1] !== 0) {
          setCenter([campLoc[1], campLoc[0]]);
          
          if (userLoc && userLoc[0] !== 0 && userLoc[1] !== 0) {
            const dist = calculateDistance(userLoc[1], userLoc[0], campLoc[1], campLoc[0]);
            setDistance(dist.toFixed(2));
          }
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to load camp location'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
          <p className="mt-3 text-gray-500 font-medium">{t('Loading camp location...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md mx-4">
          <p className="font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  if (!camp) return null;

  const campLoc = camp.location?.coordinates;
  const userLoc = user?.location?.coordinates;

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
            <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Camp Location')}</h1>
            <p className="text-gray-500 mt-1">{camp.campName} - {camp.city ? `${camp.city}, ` : ''}{getTranslatedDistrict(camp.district, lang)}, {getTranslatedState(camp.state, lang)}</p>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm font-medium text-gray-700">{t('Camp:')} {camp.campName}</span>
            </div>
            {userLoc && userLoc[0] !== 0 && userLoc[1] !== 0 && (
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium text-gray-700">{t('Your Location')}</span>
              </div>
            )}
            {distance !== null && (
              <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-700">
                {distance}{t(' km away')}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">{t('Address:')}</span> {camp.address || t('Not specified')}</p>
            <p><span className="font-medium">{t('Date:')}</span> {new Date(camp.startDate).toLocaleDateString()} - {new Date(camp.endDate).toLocaleDateString()}</p>
            <p><span className="font-medium">{t('Time:')}</span> {camp.startTime} - {camp.endTime}</p>
            <p><span className="font-medium">{t('Contact:')}</span> {camp.contactNumber}</p>
          </div>
        </div>

        <div className="card overflow-hidden" style={{ height: '600px' }}>
          <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter center={center} />
            {campLoc && campLoc[0] !== 0 && campLoc[1] !== 0 && (
              <Marker position={[campLoc[1], campLoc[0]]} icon={campIcon}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold text-blue-700 mb-1">{t('Camp')}</p>
                    <p className="text-sm font-semibold">{camp.campName}</p>
                    <p className="text-xs text-gray-500">{camp.city ? `${camp.city}, ` : ''}{getTranslatedDistrict(camp.district, lang)}, {getTranslatedState(camp.state, lang)}</p>
                    <p className="text-xs text-gray-500">{new Date(camp.startDate).toLocaleDateString()} - {new Date(camp.endDate).toLocaleDateString()}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            {userLoc && userLoc[0] !== 0 && userLoc[1] !== 0 && (
              <Marker position={[userLoc[1], userLoc[0]]} icon={userIcon}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold text-red-700 mb-1">{t('Your Location')}</p>
                    <Link to={`/user/${user._id}`} className="text-sm text-red-600 hover:underline">{user.name}</Link>
                    <p className="text-xs text-gray-500">{distance !== null ? `${distance}${t(' km from camp')}` : t('Location available')}</p>
                  </div>
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default CampLocationMap;
