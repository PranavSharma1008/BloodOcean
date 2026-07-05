import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

const Location = () => {
  const { user, updateLocation } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [location, setLocation] = useState({
    latitude: '',
    longitude: '',
  });

  const getCurrentLocation = () => {
    setError('');
    setLoading(true);
    if (!navigator.geolocation) {
      setError(t('Geolocation is not supported by your browser'));
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
        setLoading(false);
      },
      () => {
        setError(t('Unable to retrieve your location. Please enable location services.'));
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const handleManualInput = (e) => {
    const { name, value } = e.target;
    setLocation({ ...location, [name]: value });
  };

  const handleSaveLocation = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    if (!location.latitude || !location.longitude) {
      setError(t('Please provide both latitude and longitude')); setLoading(false); return;
    }
    const lat = parseFloat(location.latitude);
    const lng = parseFloat(location.longitude);
    if (isNaN(lat) || isNaN(lng)) { setError(t('Latitude and longitude must be valid numbers')); setLoading(false); return; }
    if (lat < -90 || lat > 90) { setError(t('Latitude must be between -90 and 90')); setLoading(false); return; }
    if (lng < -180 || lng > 180) { setError(t('Longitude must be between -180 and 180')); setLoading(false); return; }
    const result = await updateLocation(lat, lng);
    setLoading(false);
    if (result.success) {
      setSuccess(t('Location saved successfully!'));
      setTimeout(() => navigate('/dashboard'), 1500);
    } else { setError(result.message); }
  };

  const hasLocation = user?.location?.coordinates && 
    user.location.coordinates[0] !== 0 && 
    user.location.coordinates[1] !== 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-2xl mx-auto relative animate-fade-in">
        <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Set Your Location')}</h1>
              <p className="text-gray-500 mt-1">{t('Your location helps others find nearby blood donors')}</p>
            </div>
          </div>

          {hasLocation && (
            <div className="bg-green-50 border-2 border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-200 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-green-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-800">{t('Current location saved')}</p>
                <p className="text-xs text-green-700">{t('Lat:')} {user.location.coordinates[1].toFixed(4)}, {t('Lng:')} {user.location.coordinates[0].toFixed(4)}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{success}</div>
          )}

          <div className="space-y-6">
            <button onClick={getCurrentLocation} disabled={loading}
              className="btn-primary w-full flex items-center justify-center gap-3">
              {loading ? (
                <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              )}
              {loading ? t('Detecting Location...') : t('Detect My Current Location')}
            </button>
            <p className="text-xs text-gray-400 text-center -mt-4">{t("Uses your browser's geolocation API")}</p>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">{t('Or enter manually')}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="latitude" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Latitude')}</label>
                <input type="number" id="latitude" name="latitude" step="any" value={location.latitude}
                  onChange={handleManualInput} placeholder={t('e.g., 40.7128')} className="input-field" />
              </div>
              <div>
                <label htmlFor="longitude" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Longitude')}</label>
                <input type="number" id="longitude" name="longitude" step="any" value={location.longitude}
                  onChange={handleManualInput} placeholder={t('e.g., -74.0060')} className="input-field" />
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={handleSaveLocation} disabled={loading} className="btn-primary flex-1">
                {loading ? t('Saving...') : t('Save Location')}
              </button>
              <button onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">{t('Cancel')}</button>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-blue-100/50 rounded-xl border border-blue-200">
            <p className="text-sm text-blue-800">
              <strong className="font-semibold">{t('Privacy Note:')}</strong> {t('Your location data is stored securely and will only be used to help others find nearby blood donors.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Location;
