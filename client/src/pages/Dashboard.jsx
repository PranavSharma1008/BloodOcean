import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedName } from '../utils/nameTranslator';
import { useNavigate, Link } from 'react-router-dom';
import TypingText from '../components/TypingText';
import TextScrollMarquee from '../components/TextScrollMarquee';
import BloodCompatibilityChecker from '../components/BloodCompatibilityChecker';
import api from '../api/axios';

const Dashboard = () => {
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [showCityWarning, setShowCityWarning] = useState(false);
  const [showProfileCheck, setShowProfileCheck] = useState(false);
  const [activeCampCount, setActiveCampCount] = useState(3);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchCampStats();
  }, []);

  const fetchCampStats = async () => {
    try {
      const res = await api.get('/api/camps', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data && res.data.length > 0) {
        setActiveCampCount(res.data.length);
      }
    } catch {
      setActiveCampCount(3);
    }
  };

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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-8 px-4 sm:px-6 lg:px-8 relative transition-colors">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />

      {/* MISSING CITY MODAL */}
      {showCityWarning && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md mx-4 shadow-2xl border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold text-xl">
                ⚠️
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('City/Town Missing')}</h3>
            </div>
            <p className="text-gray-600 dark:text-slate-300 text-sm mb-6 leading-relaxed">
              {t('Please add your city/town to your profile to help nearby emergency patients and blood donation camps locate you.')}
            </p>
            <div className="flex gap-3">
              <button onClick={() => navigate('/complete-profile')} className="btn-primary flex-1 text-xs sm:text-sm py-3">
                {t('Add City/Town')}
              </button>
              <button onClick={() => setShowCityWarning(false)} className="btn-secondary flex-1 text-xs sm:text-sm py-3">
                {t('Later')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PROFILE CHECK MODAL */}
      {showProfileCheck && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 animate-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-md mx-4 shadow-2xl border border-gray-100 dark:border-slate-700">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xl">
                📋
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('Profile Health Check')}</h3>
            </div>
            <p className="text-gray-600 dark:text-slate-300 text-sm mb-2">
              {t('Please review your profile to ensure your blood group, phone number, and location details are up-to-date.')}
            </p>
            <div className="flex gap-3 mt-6">
              <button onClick={() => { navigate('/complete-profile'); dismissProfileCheck(); }} className="btn-primary flex-1 text-xs sm:text-sm py-3">
                {t('Review Profile')}
              </button>
              <button onClick={dismissProfileCheck} className="btn-secondary flex-1 text-xs sm:text-sm py-3">
                {t('Got it')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MEDICAL ALERT BAR */}
      {user?.disease && user.disease.trim() !== '' && (
        <div className="max-w-7xl mx-auto mb-6">
          <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 rounded-2xl p-4 flex items-center gap-4 shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 flex items-center justify-center font-bold text-lg flex-shrink-0">
              🚫
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-rose-700 dark:text-rose-300">{t("Donor Medical Hold Notice")}</p>
              <p className="text-xs text-rose-600 dark:text-rose-400 mt-0.5">{t('Your profile has been flagged with a condition preventing active blood donation.')}</p>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* HERO HEADER */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-8 sm:p-12 text-white shadow-2xl shadow-red-600/30">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-red-100 text-xs font-semibold uppercase tracking-wide border border-white/20">
                <span className="w-2.5 h-2.5 rounded-full bg-yellow-300 animate-pulse" />
                {t('Blood Donor Portal Active')}
              </div>

              <TypingText
                as="h1"
                fontSize="text-3xl sm:text-4xl lg:text-5xl"
                fontWeight="font-black"
                color="text-white"
                letterSpacing="tracking-tight font-display"
                duration={1.2}
              >
                {t('Welcome back,')} {user?.name ? getTranslatedName(user.name.split(' ')[0], lang) : t('Hero')}!
              </TypingText>

              <TextScrollMarquee
                baseVelocity={22}
                delay={300}
                className="text-red-100 text-sm sm:text-base font-medium opacity-90"
              >
                {t('Your blood donation hub — manage profile, locate nearby camps, and save lives in emergency requests.')}
              </TextScrollMarquee>
            </div>
          </div>
        </div>

        {/* ALERTS FOR INCOMPLETE PROFILE OR LOCATION */}
        {!user?.profileCompleted && (
          <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 flex items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold text-lg">⚠️</div>
              <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">{t('Complete your donor profile to enable matching and notifications.')}</p>
            </div>
            <button onClick={() => navigate('/complete-profile')} className="btn-primary text-xs sm:text-sm py-2.5 px-4 whitespace-nowrap">{t('Complete Now')}</button>
          </div>
        )}

        {/* MAIN GRID CONTENT */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* PROFILE SUMMARY CARD */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/80">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xl">
                    👤
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white font-display">{t('My Profile Summary')}</h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">{t('Account status & info')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link to={`/user/${user?._id || user?.id}`} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-red-600 dark:text-red-400 hover:underline inline-flex items-center gap-1">
                    {t('View Profile')}
                    <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </Link>
                  <button onClick={() => navigate('/complete-profile')} className="text-xs font-bold text-gray-500 dark:text-slate-400 hover:underline">
                    {t('Edit')}
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700/50">
                  <span className="text-gray-500 dark:text-slate-400">{t('Name')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white">{getTranslatedName(user?.name, lang)}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700/50">
                  <span className="text-gray-500 dark:text-slate-400">{t('Email')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white truncate max-w-[180px]">{user?.email}</span>
                </div>
                {user?.profileCompleted && (
                  <>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700/50">
                      <span className="text-gray-500 dark:text-slate-400">{t('Phone')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{user?.phone}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700/50">
                      <span className="text-gray-500 dark:text-slate-400">{t('Blood Group')}</span>
                      <span className="font-bold text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-2.5 py-0.5 rounded-lg text-xs">{user?.bloodGroup}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-gray-100 dark:border-slate-700/50">
                      <span className="text-gray-500 dark:text-slate-400">{t('Location')}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{user?.city || t('Not set')}</span>
                    </div>
                  </>
                )}
                <div className="flex justify-between py-2">
                  <span className="text-gray-500 dark:text-slate-400">{t('Role')}</span>
                  <span className="font-semibold text-gray-900 dark:text-white uppercase text-xs">{user?.role ? t(user.role) : ''}</span>
                </div>
              </div>
            </div>

            {/* QUICK CAMPS PROMO CARD */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-3xl p-6 shadow-xl border border-slate-700 relative overflow-hidden">
              <div className="text-xs text-red-400 font-bold uppercase tracking-wider mb-1">{t('Blood Drives & Camps')}</div>
              <h3 className="text-xl font-bold font-display">{activeCampCount} {t('Active Camps Near You')}</h3>
              <p className="text-xs text-slate-300 mt-2 leading-relaxed">
                {t('Join voluntary blood donation drives in your city or post a camp to notify local donors.')}
              </p>
              <button 
                onClick={() => navigate('/camps')}
                className="mt-4 w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-lg transition-all"
              >
                {t('Explore Camps & Reserve Slot →')}
              </button>
            </div>
          </div>

          {/* QUICK ACTIONS & TOOLKIT */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700/80">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-6">{t('Donor Hub Actions')}</h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Search Donors */}
                <button 
                  onClick={() => navigate('/search')} 
                  className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/40 dark:from-red-950/40 dark:to-slate-800 border border-red-100 dark:border-red-900/50 hover:border-red-300 hover:shadow-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    🔍
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('Search Nearby Donors')}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{t('Locate available matching blood donors by radius.')}</p>
                </button>

                {/* Emergency Request */}
                <button 
                  onClick={() => navigate('/create-emergency')} 
                  className="p-5 rounded-2xl bg-gradient-to-br from-orange-50 to-amber-100/40 dark:from-amber-950/40 dark:to-slate-800 border border-amber-100 dark:border-amber-900/50 hover:border-amber-300 hover:shadow-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    🚨
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('Emergency Request')}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{t('Broadcast an urgent blood request to local donors.')}</p>
                </button>

                {/* Blood Camps */}
                <button 
                  onClick={() => navigate('/camps')} 
                  className="p-5 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-100/40 dark:from-rose-950/40 dark:to-slate-800 border border-rose-100 dark:border-rose-900/50 hover:border-rose-300 hover:shadow-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    ⛺
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('Blood Donation Camps')}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{t('Browse drives, reserve donor slots, or post a new camp.')}</p>
                </button>

                {/* View Active Requests */}
                <button 
                  onClick={() => navigate('/emergency-requests')} 
                  className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-indigo-100/40 dark:from-purple-950/40 dark:to-slate-800 border border-purple-100 dark:border-purple-900/50 hover:border-purple-300 hover:shadow-xl transition-all text-left group"
                >
                  <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    📋
                  </div>
                  <h3 className="font-bold text-gray-900 dark:text-white mb-1">{t('View All Requests')}</h3>
                  <p className="text-xs text-gray-600 dark:text-slate-400">{t('Respond to emergency calls or manage your postings.')}</p>
                </button>
              </div>
            </div>

            {/* BLOOD COMPATIBILITY CHECKER TOOL */}
            <BloodCompatibilityChecker />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
