import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { getTranslatedState } from '../data/locations';
import { useParams } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';

const markerHtml = (color, label) => `<div style="
  width: 36px; height: 36px; border-radius: 50%;
  background: ${color}; border: 3px solid white;
  box-shadow: 0 2px 8px rgba(0,0,0,0.3);
  display: flex; align-items: center; justify-content: center;
  color: white; font-weight: bold; font-size: 12px;
">${label}</div>`;

const requesterIcon = L.divIcon({ className: '', html: markerHtml('#ef4444', 'R'), iconSize: [36, 36], iconAnchor: [18, 18] });
const donorIcon = L.divIcon({ className: '', html: markerHtml('#22c55e', 'D'), iconSize: [36, 36], iconAnchor: [18, 18] });

const Recenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    if (center) map.setView(center, map.getZoom());
  }, [center, map]);
  return null;
};

const BloodRequestMap = () => {
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();
  const { id } = useParams();
  const navigate = useNavigate();
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [center, setCenter] = useState([20.5937, 78.9629]);

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/api/blood-requests/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setRequest(response.data.bloodRequest);
        const reqLoc = response.data.bloodRequest.requesterLocation?.coordinates;
        const donLoc = response.data.bloodRequest.donorLocation?.coordinates;
        if (reqLoc && reqLoc[0] !== 0 && reqLoc[1] !== 0) {
          setCenter([reqLoc[1], reqLoc[0]]);
        } else if (donLoc && donLoc[0] !== 0 && donLoc[1] !== 0) {
          setCenter([donLoc[1], donLoc[0]]);
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to load blood request'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
          <p className="mt-3 text-gray-500 font-medium">{t('Loading blood request map...')}</p>
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

  if (!request) return null;

  const reqLoc = request.requesterLocation?.coordinates;
  const donLoc = request.donorLocation?.coordinates;
  const isRequester = request.requester._id.toString() === user?.id;
  const isDonor = request.donor._id.toString() === user?.id;

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
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Blood Request Map')}</h1>
            <p className="text-gray-500 mt-1">
              {isRequester ? t('You are the requester') : isDonor ? t('You are the donor') : t('Viewing request details')}
            </p>
          </div>
        </div>

        <div className="card p-6 mb-6">
          <div className="flex flex-wrap items-center gap-4 mb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="text-sm font-medium text-gray-700">{t('Requester:')} <Link to={`/user/${request.requester._id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">{request.requester.name}</Link></span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500" />
              <span className="text-sm font-medium text-gray-700">{t('Donor:')} <Link to={`/user/${request.donor._id}`} target="_blank" rel="noopener noreferrer" className="text-green-600 hover:underline">{request.donor.name}</Link></span>
            </div>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
              request.status === 'accepted' ? 'bg-green-100 text-green-700' :
              request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
              request.status === 'completed' ? 'bg-blue-100 text-blue-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {request.status.toUpperCase()}
            </span>
            {request.status === 'accepted' && (isRequester || isDonor) && null}
          </div>
          <div className="text-sm text-gray-600">
            <p><span className="font-medium">{t('Blood Group:')}</span> {request.bloodGroup}</p>
            <p><span className="font-medium">{t('Hospital:')}</span> {request.hospital}</p>
            <p><span className="font-medium">{t('Contact:')}</span> {request.contactNumber}</p>
          </div>
        </div>

        <div className="card overflow-hidden" style={{ height: '600px' }}>
          <MapContainer center={center} zoom={5} className="h-full w-full" scrollWheelZoom={true}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Recenter center={center} />
            {reqLoc && reqLoc[0] !== 0 && reqLoc[1] !== 0 && (
              <Marker position={[reqLoc[1], reqLoc[0]]} icon={requesterIcon}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold text-red-700 mb-1">{t('Requester')}</p>
                    <Link to={`/user/${request.requester._id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-red-600 hover:underline">{request.requester.name}</Link>
                    <p className="text-sm font-bold text-red-600">{request.bloodGroup}</p>
                    <p className="text-xs text-gray-500">{request.requester.city && `${request.requester.city}, `}{getTranslatedState(request.requester.state, lang)}</p>
                  </div>
                </Popup>
              </Marker>
            )}
            {donLoc && donLoc[0] !== 0 && donLoc[1] !== 0 && (
              <Marker position={[donLoc[1], donLoc[0]]} icon={donorIcon}>
                <Popup>
                  <div className="min-w-[180px]">
                    <p className="font-bold text-green-700 mb-1">{t('Donor')}</p>
                    <Link to={`/user/${request.donor._id}`} target="_blank" rel="noopener noreferrer" className="text-sm text-green-600 hover:underline">{request.donor.name}</Link>
                    <p className="text-sm font-bold text-red-600">{request.bloodGroup}</p>
                    <p className="text-xs text-gray-500">{request.donor.city && `${request.donor.city}, `}{getTranslatedState(request.donor.state, lang)}</p>
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

export default BloodRequestMap;
