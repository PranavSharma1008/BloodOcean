import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getStates, getDistricts, normalizeDistrict, getTranslatedState, getTranslatedDistrict } from '../data/locations';
import { ExpandableSearchBar } from '@/components/lightswind/expandable-search-bar';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedName } from '../utils/nameTranslator';

const Search = () => {
  const { user, token, refreshUser } = useAuth();
  const { t, lang } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [refreshingLocation, setRefreshingLocation] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useState({
    bloodGroup: '',
    state: '',
    district: '',
    radius: 10,
    name: '',
  });
  const [searchMode, setSearchMode] = useState('manual'); // 'geographic' or 'manual'
  const [results, setResults] = useState(null);
  const [emergencyRequestId, setEmergencyRequestId] = useState(null);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedDonor, setSelectedDonor] = useState(null);
  const [requestForm, setRequestForm] = useState({
    hospital: '',
    contactNumber: '',
    notes: '',
  });
  const [requestLoading, setRequestLoading] = useState(false);
  const [modalError, setModalError] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const radiusOptions = [5, 10, 20, 100];
  const states = getStates();
  const districts = getDistricts(searchParams.state);

  const hasGps =
    user?.location?.coordinates &&
    user.location.coordinates[0] !== 0 &&
    user.location.coordinates[1] !== 0;

  useEffect(() => {
    if (user) {
      const state = user.state || 'Himachal Pradesh';
      setSearchParams((prev) => ({
        ...prev,
        bloodGroup: prev.bloodGroup || user.bloodGroup || '',
        state,
        district: normalizeDistrict(state, user.district || prev.district),
      }));
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.bloodGroup) {
      setSearchMode('manual');
      setSearchParams((prev) => ({
        ...prev,
        bloodGroup: location.state.bloodGroup,
        state: user?.state || prev.state,
        district: normalizeDistrict(user?.state || prev.state, user?.district || prev.district),
      }));
      setEmergencyRequestId(location.state.requestId);
      handleSearch(null, {
        bloodGroup: location.state.bloodGroup,
        state: user?.state || searchParams.state,
        district: normalizeDistrict(user?.state || searchParams.state, user?.district || searchParams.district),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.state]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setSearchParams({ ...searchParams, state: value, district: '' });
      return;
    }
    if (name === 'radius') {
      const radiusValue = parseInt(value);
      // Snap to nearest valid radius value
      const validRadii = [5, 10, 20, 100];
      const snappedValue = validRadii.reduce((prev, curr) => 
        Math.abs(curr - radiusValue) < Math.abs(prev - radiusValue) ? curr : prev
      );
      setSearchParams({ ...searchParams, radius: snappedValue });
      return;
    }
    setSearchParams({ ...searchParams, [name]: value });
  };

  const handleRefreshLocation = async () => {
    setRefreshingLocation(true);
    setError('');
    setSuccessMessage('');
    try {
      const result = await refreshUser();
      if (result.success && result.user) {
        // Update search params with new location
        const state = result.user.state || 'Himachal Pradesh';
        setSearchParams((prev) => ({
          ...prev,
          state,
          district: normalizeDistrict(state, result.user.district || prev.district),
        }));
        setSuccessMessage(t('Location Refreshed'));
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError(t('Failed to refresh location. Please try again.'));
      }
    } catch (err) {
      setError(t('Failed to refresh location. Please try again.'));
    } finally {
      setRefreshingLocation(false);
    }
  };

  const handleSearch = async (e, overrides = {}) => {
    if (e) e.preventDefault();
    setError('');
    setResults(null);
    setLoading(true);

    const params = { ...searchParams, ...overrides };
    const radius = parseInt(params.radius);

    if (!params.bloodGroup) {
      setError(t('Please select a blood group'));
      setLoading(false);
      return;
    }

    if (searchMode === 'geographic') {
      if (!hasGps) {
        setError(t('Geographic search requires GPS location. Please set your location in profile settings.'));
        setLoading(false);
        return;
      }
    } else {
      if (!params.state) {
        setError(t('Please select a state'));
        setLoading(false);
        return;
      }

      if (!params.district) {
        setError(t('Please select a district'));
        setLoading(false);
        return;
      }
    }

    try {
      const response = await api.get('/api/donors/nearby', {
        params: {
          bloodGroup: params.bloodGroup,
          ...(searchMode === 'manual' && {
            state: params.state,
            district: params.district,
            city: params.city,
          }),
          ...(searchMode === 'geographic' && {
            radius,
            useGps: true,
          }),
          ...(params.name.trim() && { name: params.name.trim() }),
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setResults(response.data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to search for donors'));
      setLoading(false);
    }
  };

  const openRequestModal = (donor) => {
    setSelectedDonor(donor);
    setModalError('');
    setRequestForm({ hospital: '', contactNumber: '', notes: '' });
    setShowRequestModal(true);
  };

  const handleSendBloodRequest = async (e) => {
    e.preventDefault();
    setModalError('');
    setError('');
    setRequestLoading(true);

    if (!requestForm.hospital.trim() || !requestForm.contactNumber.trim()) {
      setModalError(t('Please fill in hospital and contact number'));
      setRequestLoading(false);
      return;
    }

    const contactDigits = requestForm.contactNumber.replace(/\D/g, '');
    if (contactDigits.length !== 10) {
      setModalError(t('Contact number must be exactly 10 digits'));
      setRequestLoading(false);
      return;
    }

    const donorId = selectedDonor.id || selectedDonor._id;
    const currentUserId = String(user?.id || user?._id || '');

    if (String(donorId) === currentUserId) {
      setModalError(t('You cannot request blood from yourself'));
      setRequestLoading(false);
      return;
    }

    try {
      const result = await createBloodRequest(donorId, {
        bloodGroup: selectedDonor.bloodGroup,
        hospital: requestForm.hospital.trim(),
        contactNumber: contactDigits,
        notes: requestForm.notes.trim(),
      });

      if (result.success) {
        setSuccessMessage(t('Blood request sent successfully!'));
        setShowRequestModal(false);
        setSelectedDonor(null);
        setRequestForm({ hospital: '', contactNumber: '', notes: '' });
      } else {
        setModalError(result.message || t('Failed to send blood request'));
      }
    } catch (err) {
      setModalError(err.response?.data?.message || t('Failed to send blood request'));
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-4xl mx-auto relative">
        <div className="card p-8 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Find Blood Donors')}</h1>
                <p className="text-gray-500 mt-1">{t('Search using geographic or manual location')}</p>
              </div>
            </div>
            <button type="button" onClick={handleRefreshLocation} disabled={refreshingLocation}
              className="btn-secondary text-sm py-2.5 px-4 flex items-center gap-2 whitespace-nowrap">
              <svg className={`w-4 h-4 ${refreshingLocation ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              {refreshingLocation ? t('Updating...') : t('Refresh Location')}
            </button>
          </div>

          {emergencyRequestId && (
            <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6 text-sm font-medium text-yellow-800 flex items-center gap-2">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              {t('Searching for donors for an emergency blood request.')}
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{successMessage}</div>
          )}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
              <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {error}
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('Search Type')}</label>
              <div className="flex flex-wrap gap-4">
                {[
                  { value: 'geographic', label: t('Search by Distance (Nearby)'), disabled: !hasGps },
                  { value: 'manual', label: t('Search by Location (State/District)') },
                ].map((opt) => (
                  <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    searchMode === opt.value ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  } ${opt.disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input type="radio" name="searchMode" value={opt.value}
                      checked={searchMode === opt.value} onChange={(e) => setSearchMode(e.target.value)}
                      disabled={opt.disabled} className="accent-red-600" />
                    <span className={`text-sm font-medium ${opt.disabled ? 'text-gray-400' : 'text-gray-700'}`}>{opt.label}</span>
                  </label>
                ))}
              </div>
              {!hasGps && searchMode === 'geographic' && (
                <p className="text-xs text-red-600 mt-2">{t('Geographic search requires GPS. Set your location in profile settings.')}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Blood Group *')}</label>
                <select id="bloodGroup" name="bloodGroup" value={searchParams.bloodGroup} onChange={handleChange}
                  className="select-field">
                  <option value="">{t('Select blood group')}</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Donor Name (optional)')}</label>
                <ExpandableSearchBar id="name" name="name" value={searchParams.name}
                  onChange={handleChange} placeholder={t('Search by name')} expandedWidth="28rem" className="w-full" />
              </div>
              {searchMode === 'manual' && (
                <>
                  <div>
                    <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('State *')}</label>
                    <select id="state" name="state" value={searchParams.state} onChange={handleChange} className="select-field">
                      <option value="">{t('Select state')}</option>
                      {states.map((state) => (
                        <option key={state} value={state}>{getTranslatedState(state, lang)}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="district" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('District *')}</label>
                    <select id="district" name="district" value={searchParams.district} onChange={handleChange}
                      disabled={!searchParams.state} className="select-field disabled:bg-gray-100">
                      <option value="">{searchParams.state ? t('Select district') : t('Select state first')}</option>
                      {districts.map((district) => (
                        <option key={district} value={district}>{getTranslatedDistrict(district, lang)}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {searchMode === 'geographic' && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">{t('Search Radius *')}</label>
                <div className="flex gap-3">
                  {radiusOptions.map((r) => (
                    <button key={r} type="button" onClick={() => setSearchParams({ ...searchParams, radius: r })}
                      className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all ${
                        searchParams.radius === r
                          ? 'bg-red-600 text-white shadow-lg shadow-red-500/20'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}>
                      {r}{t(' km')}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">{t('Finds donors within the selected radius from your GPS location.')}</p>
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full">
              {loading ? t('Searching...') : t('Search Donors')}
            </button>
          </form>
        </div>

        {results && (
          <div className="card p-8 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-display">{t('Search Results')}</h2>
              <span className="badge-blue text-sm">
                {results.count} {t('donor(s) found')} {hasGps && `within ${results.searchRadius} km`}
              </span>
            </div>

            {results.count === 0 ? (
              <div className="text-center py-16">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <h3 className="text-lg font-semibold text-gray-900">{t('No donors found')}</h3>
                <p className="text-gray-500 mt-1">{t('Try a different district, increase radius, or check back later')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.donors.map((donor, index) => (
                  <div key={donor.id} className="group p-5 rounded-2xl border-2 border-gray-100 hover:border-red-200 hover:shadow-lg hover:shadow-red-500/5 transition-all duration-300">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                          <span className="text-lg font-bold text-red-700">{donor.bloodGroup}</span>
                        </div>
                        <div>
                          <Link to={`/user/${donor.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-gray-900 hover:text-red-600 transition-colors inline-flex items-center gap-1">
                            {getTranslatedName(donor.name, lang)}
                            <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </Link>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className={`badge text-xs ${donor.available ? 'badge-green' : 'badge-gray'}`}>
                              {donor.available ? t('Available') : t('Unavailable')}
                            </span>
                            <span className="text-xs text-gray-400">#{index + 1}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5 text-sm text-gray-600">
                      <p><span className="font-medium text-gray-700">{t('District:')}</span> {donor.district}</p>
                      {donor.city && <p><span className="font-medium text-gray-700">{t('City:')}</span> {donor.city}</p>}
                      <p><span className="font-medium text-gray-700">{t('Phone:')}</span> {donor.phone}</p>
                      {donor.distance !== 'N/A' && (
                        <p><span className="font-medium text-gray-700">{t('Distance:')}</span>{' '}
                          <span className="text-red-600 font-bold">{donor.distance} km</span>
                        </p>
                      )}
                    </div>
                    <div className="mt-3 flex items-center gap-2">
                      <a href={`/user/${donor.id}`} target="_blank" rel="noopener noreferrer"
                        className="flex-1 px-3 py-2 text-center rounded-xl bg-gray-100 text-gray-700 text-sm font-semibold hover:bg-gray-200 transition-all">
                        {t('View Profile')}
                      </a>
                      {donor.available && (
                        <button type="button" onClick={() => openRequestModal(donor)}
                          className="flex-1 px-3 py-2 rounded-xl bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-all">
                          {t('Request Blood')}
                        </button>
                      )}
                    </div>
                  </div>
                 ))}
               </div>
             )}
           </div>
         )}

         {showRequestModal && selectedDonor && (
           <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
             <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl shadow-red-900/20 animate-slide-up">
               <div className="flex items-center gap-3 mb-4">
                 <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                   <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                   </svg>
                 </div>
                  <h3 className="text-lg font-bold text-gray-900">{t('Request Blood from')} <Link to={`/user/${selectedDonor.id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">{selectedDonor.name}</Link></h3>
                </div>
                 <p className="text-gray-600 mb-4 text-sm">
                   {t('Send a blood request to')} <Link to={`/user/${selectedDonor.id}`} target="_blank" rel="noopener noreferrer" className="font-bold text-red-600 hover:underline">{selectedDonor.name}</Link> {t('for')} <span className="font-bold">{selectedDonor.bloodGroup}</span>.
                 </p>
                {modalError && (
                  <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-2.5 rounded-xl text-xs font-medium mb-4 flex items-center gap-2">
                    <svg className="w-4 h-4 flex-shrink-0 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                    <span>{modalError}</span>
                  </div>
                )}
               <div className="space-y-3 mb-6">
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Hospital Name *')}</label>
                    <input type="text" value={requestForm.hospital} onChange={(e) => setRequestForm({ ...requestForm, hospital: e.target.value })} className="input-field" placeholder={t('Enter hospital name')} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Contact Number *')}</label>
                    <input type="tel" value={requestForm.contactNumber} onChange={(e) => setRequestForm({ ...requestForm, contactNumber: e.target.value })} className="input-field" placeholder={t('Enter contact number')} />
                 </div>
                 <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Notes')}</label>
                    <textarea value={requestForm.notes} onChange={(e) => setRequestForm({ ...requestForm, notes: e.target.value })} rows={2} className="input-field" placeholder={t('Any additional information (optional)')} />
                 </div>
               </div>
               <div className="flex gap-3">
                 <button onClick={handleSendBloodRequest} disabled={requestLoading} className="btn-primary flex-1 text-sm py-3">
                    {requestLoading ? t('Sending...') : t('Send Request')}
                 </button>
                 <button onClick={() => { setShowRequestModal(false); setSelectedDonor(null); setRequestForm({ hospital: '', contactNumber: '', notes: '' }); }} className="btn-secondary flex-1 text-sm py-3">
                    {t('Cancel')}
                 </button>
               </div>
             </div>
           </div>
         )}
       </div>
     </div>
   );
 };

export default Search;
