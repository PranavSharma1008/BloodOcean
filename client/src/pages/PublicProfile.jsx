import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedState, getTranslatedDistrict } from '../data/locations';

const PublicProfile = () => {
  const { id } = useParams();
  const { user: currentUser, token } = useAuth();
  const { t, lang } = useLanguage();
  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPublicProfile();
  }, [id]);

  const fetchPublicProfile = async () => {
    try {
      const response = await api.get(`/api/profile/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setProfileUser(response.data.user);
      }
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to load profile'));
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
          <p className="mt-3 text-gray-500 font-medium">{t('Loading profile...')}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-xl max-w-md mx-4">
          <p className="font-semibold">{error}</p>
          <Link to="/dashboard" className="text-red-600 underline mt-2 inline-block">{t('Go back')}</Link>
        </div>
      </div>
    );
  }

  if (!profileUser) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-2xl mx-auto relative">
        <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              {profileUser.avatar ? (
                <img src={profileUser.avatar} alt="" className="w-full h-full rounded-2xl object-cover" />
              ) : (
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">{profileUser.name}</h1>
              <p className="text-gray-500 mt-1">{t('Blood Donor Profile')}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('Name')}</span>
              <span className="text-sm font-semibold text-gray-900">{profileUser.name}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('Email')}</span>
              <span className="text-sm font-semibold text-gray-900">{profileUser.email}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('Phone')}</span>
              <span className="text-sm font-semibold text-gray-900">{profileUser.phone}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('Blood Group')}</span>
              <span className="badge-red text-sm">{profileUser.bloodGroup}</span>
            </div>
            {profileUser.age && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('Age')}</span>
                <span className="text-sm font-semibold text-gray-900">{profileUser.age}{t(' years')}</span>
              </div>
            )}
            {profileUser.gender && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('Gender')}</span>
                <span className="text-sm font-semibold text-gray-900 capitalize">{profileUser.gender}</span>
              </div>
            )}
            {profileUser.religion && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('Religion')}</span>
                <span className="text-sm font-semibold text-gray-900">{profileUser.religion}</span>
              </div>
            )}
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('Location')}</span>
              <span className="text-sm font-semibold text-gray-900">{profileUser.city || getTranslatedDistrict(profileUser.district, lang) || t('Not set')}</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-gray-100">
              <span className="text-sm text-gray-500">{t('Availability')}</span>
              <span className={`badge ${profileUser.available ? 'badge-green' : 'badge-gray'}`}>
                {profileUser.available ? t('Available') : t('Not Available')}
              </span>
            </div>
            {profileUser.unitsCanDonate && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('Units Can Donate')}</span>
                <span className="text-sm font-semibold text-gray-900">{profileUser.unitsCanDonate}{t(' unit(s)')}</span>
              </div>
            )}
            {profileUser.disease && profileUser.disease.trim() !== '' && (
              <div className="flex justify-between items-center py-2 border-b border-gray-100">
                <span className="text-sm text-gray-500">{t('Medical Condition')}</span>
                <span className="text-sm font-semibold text-red-600">{profileUser.disease}</span>
              </div>
            )}
          </div>

          <div className="flex gap-4 pt-6 mt-6 border-t border-gray-100">
            {currentUser?.id === profileUser.id ? (
              <Link to="/complete-profile" className="btn-primary flex-1 text-center">{t('Edit Profile')}</Link>
            ) : (
              <a href={`tel:${profileUser.phone}`} className="btn-primary flex-1 text-center block">{t('Call ')}{profileUser.phone}</a>
            )}
            <button onClick={() => window.close()} className="btn-secondary flex-1">{t('Close')}</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PublicProfile;
