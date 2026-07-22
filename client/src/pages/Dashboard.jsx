import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate, Link } from 'react-router-dom';
import TypingText from '../components/TypingText';
import TextScrollMarquee from '../components/TextScrollMarquee';
import MagicLoader from '../components/MagicLoader';

const Dashboard = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showCityWarning, setShowCityWarning] = useState(false);
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const intervalRef = useRef(null);

  const showProfileCheckNotification = () => {
    const lastDismissed = localStorage.getItem('profileCheckLastDismissed');
    const fifteenMins = 15 * 60 * 1000;
    if (!lastDismissed || Date.now() - parseInt(lastDismissed) > fifteenMins) {
      setShowProfileCheck(true);
    }
  };

  useEffect(() => {
    if (user?.profileCompleted && !user?.city) {
      setShowCityWarning(true);
    }
    showProfileCheckNotification();

    intervalRef.current = setInterval(() => {
      showProfileCheckNotification();
    }, 60000);

    return () => clearInterval(intervalRef.current);
  }, [user]);

  const dismissProfileCheck = () => {
    setShowProfileCheck(false);
    localStorage.setItem('profileCheckLastDismissed', Date.now().toString());
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />

      {showCityWarning && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl shadow-red-900/20 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('City/Town Missing')}</h3>
            </div>
            <p className="text-gray-600 mb-6">{t('Please add your city/town to your profile to help donors find you more easily.')}</p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/complete-profile')} className="btn-primary flex-1 text-sm py-3">{t('Add City/Town')}</button>
              <button onClick={() => setShowCityWarning(false)} className="btn-secondary flex-1 text-sm py-3">{t('Later')}</button>
            </div>
          </div>
        </div>
      )}

      {showProfileCheck && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl shadow-red-900/20 animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <svg className="h-6 w-6 text-blue-600" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-gray-900">{t('Profile Check')}</h3>
            </div>
            <p className="text-gray-600 mb-2">{t('Please review your profile to ensure all information is correct — blood group, location, and contact details.')}</p>
            <p className="text-sm text-gray-500 mb-6">{t('Keeping your profile up to date helps donors and requesters reach you in emergencies.')}</p>
            <div className="flex gap-3">
              <button onClick={() => { navigate('/complete-profile'); dismissProfileCheck(); }} className="btn-primary flex-1 text-sm py-3">{t('Review Profile')}</button>
              <button onClick={dismissProfileCheck} className="btn-secondary flex-1 text-sm py-3">{t('Got it')}</button>
            </div>
          </div>
        </div>
      )}

      {user?.disease && user.disease.trim() !== '' && (
        <div className="max-w-7xl mx-auto px-4 pt-6 sm:px-6 lg:px-8 relative">
          <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-4 flex items-center gap-4 animate-slide-up">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-700">{t("Sorry, we don't accept the disease blood for donation.")}</p>
              <p className="text-xs text-red-600 mt-0.5">{t('Your profile has been marked with a medical condition.')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8 relative">
        {/* Hero Section */}
        <div className="relative overflow-hidden mb-8 rounded-3xl bg-gradient-to-br from-red-600 via-red-700 to-red-900 p-8 sm:p-12">
          <div className="absolute inset-0 bg-grid opacity-10" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-red-400/10 rounded-full blur-3xl -translate-x-1/3 translate-y-1/3" />
          <div className="relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center animate-pulse overflow-hidden">
                <img src="/welcome.png" alt="Welcome" className="w-full h-full object-cover" />
              </div>
              <TypingText
                as="h1"
                fontSize="text-3xl sm:text-4xl lg:text-5xl"
                fontWeight="font-extrabold"
                color="text-white"
                letterSpacing="tracking-normal font-display"
                duration={1.5}
              >
                {t('Welcome,')} {user?.name ? user.name.split(' ')[0] : 'Hero'}!
              </TypingText>
            </div>
            <div className="animate-fade-in" style={{animationDelay: '0.6s'}}>
              <TextScrollMarquee
                baseVelocity={15}
                delay={1.5}
                className="text-red-100/80 text-lg font-medium"
              >
                {t('Your blood donation hub — manage your profile, find nearby donors, and respond to urgent requests.')}
              </TextScrollMarquee>
            </div>
          </div>
        </div>

        {/* Alerts */}
        {!user?.profileCompleted && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-yellow-50 to-yellow-100/50 border-2 border-yellow-200 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-yellow-200 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-yellow-800">{t('Please complete your donor profile to help others find you.')}</p>
              </div>
              <button onClick={() => navigate('/complete-profile')} className="btn-primary text-sm py-2 px-4 whitespace-nowrap">{t('Complete Profile')}</button>
            </div>
          </div>
        )}

        {user?.profileCompleted && !(user?.location?.coordinates && user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0) && (
          <div className="mb-6 p-4 rounded-2xl bg-gradient-to-r from-blue-50 to-blue-100/50 border-2 border-blue-200 animate-slide-up">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-200 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-blue-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-blue-800">{t('Set your location to help others find nearby blood donors.')}</p>
              </div>
              <button onClick={() => navigate('/location')} className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 transition-all text-sm font-semibold whitespace-nowrap">{t('Set Location')}</button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="card p-6 h-full">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('My Profile')}</h2>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">{t('Name')}</span>
                  <Link to={`/user/${user._id}`} className="text-sm font-semibold text-gray-900 hover:underline">{user?.name}</Link>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-gray-100">
                  <span className="text-sm text-gray-500">{t('Email')}</span>
                  <span className="text-sm font-semibold text-gray-900">{user?.email}</span>
                </div>
                {user?.profileCompleted && (
                  <>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{t('Phone')}</span>
                      <span className="text-sm font-semibold text-gray-900">{user?.phone}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{t('Blood Group')}</span>
                      <span className="badge-red text-sm">{user?.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{t('Location')}</span>
                      <span className="text-sm font-semibold text-gray-900">{user?.city || 'Not set'}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{t('Availability')}</span>
                      <span className={`badge ${user?.available ? 'badge-green' : 'badge-gray'}`}>
                        {user?.available ? t('Available') : t('Not Available')}
                      </span>
                    </div>
                    {user?.age && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('Age')}</span>
                        <span className="text-sm font-semibold text-gray-900">{user.age}{t(' years')}</span>
                      </div>
                    )}
                    {user?.gender && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('Gender')}</span>
                        <span className="text-sm font-semibold text-gray-900 capitalize">{user.gender}</span>
                      </div>
                    )}
                    {user?.religion && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('Religion')}</span>
                        <span className="text-sm font-semibold text-gray-900">{user.religion}</span>
                      </div>
                    )}
                    {user?.unitsCanDonate && (
                      <div className="flex justify-between items-center py-2 border-b border-gray-100">
                        <span className="text-sm text-gray-500">{t('Units Can Donate')}</span>
                        <span className="text-sm font-semibold text-gray-900">{user.unitsCanDonate}{t(' unit(s)')}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center py-2 border-b border-gray-100">
                      <span className="text-sm text-gray-500">{t('Blood Charges')}</span>
                      <span className={`badge ${user?.bloodCharges ? 'badge-yellow' : 'badge-green'}`}>
                        {user?.bloodCharges ? `${user.bloodCharges} ${t('per unit')}` : t('Free')}
                      </span>
                    </div>
                  </>
                )}
                <div className="flex justify-between items-center py-2">
                  <span className="text-sm text-gray-500">{t('Role')}</span>
                  <span className="text-sm font-semibold text-gray-900 capitalize">{user?.role === 'user' ? t('user') : user?.role}</span>
                </div>
              </div>

              {user?.profileCompleted && (
                <button onClick={() => navigate('/complete-profile')} className="btn-secondary w-full mt-6 text-sm">{t('Edit Profile')}</button>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="card p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('Quick Actions')}</h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button onClick={() => navigate('/search')} className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-100 hover:border-red-300 hover:shadow-lg hover:shadow-red-500/10 transition-all duration-300 text-left">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-red-200/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{t('Search Donors')}</h3>
                    <p className="text-sm text-gray-600">{t('Find nearby blood donors based on your location.')}</p>
                  </div>
                </button>

                <button onClick={() => navigate('/create-emergency')} className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-orange-100/50 border-2 border-orange-100 hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/10 transition-all duration-300 text-left">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-orange-200/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{t('Emergency Request')}</h3>
                    <p className="text-sm text-gray-600">{t('Post an urgent blood donation request.')}</p>
                  </div>
                </button>

                <button onClick={() => navigate('/emergency-requests')} className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-100 hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/10 transition-all duration-300 text-left">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-purple-200/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{t('View Requests')}</h3>
                    <p className="text-sm text-gray-600">{t('Manage your emergency blood requests.')}</p>
                  </div>
                </button>

                <button onClick={() => navigate('/location')} className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 text-left">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-blue-200/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                    <h3 className="font-bold text-gray-900 mb-1">{t('Update Location')}</h3>
                    <p className="text-sm text-gray-600">{t('Update your GPS coordinates for matching.')}</p>
                  </div>
                </button>

                {user?.role === 'admin' && (
                  <button onClick={() => navigate('/admin')} className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-100 hover:border-green-300 hover:shadow-lg hover:shadow-green-500/10 transition-all duration-300 text-left sm:col-span-2">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-xl bg-green-200/50 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                        <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                      </div>
                      <h3 className="font-bold text-gray-900 mb-1">{t('Admin Dashboard')}</h3>
                      <p className="text-sm text-gray-600">{t('Manage users, emergency requests, and view statistics.')}</p>
                    </div>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
