import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getStates, getDistricts, getTranslatedState, getTranslatedDistrict } from '../data/locations';
import { ExpandableSearchBar } from '@/components/lightswind/expandable-search-bar';
import { io } from 'socket.io-client';
import { useLanguage } from '../context/LanguageContext';

const SOCKET_URL = import.meta.env.VITE_API_URL || '';

const EmergencyRequests = () => {
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState(user?.bloodGroup || '');
  const [filterRadius, setFilterRadius] = useState(100);
  const [searchMode, setSearchMode] = useState('geographic');
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const radiusOptions = [5, 10, 20, 100];
  const states = getStates();
  const districts = getDistricts(filterState);
  const socketRef = useRef(null);

  useEffect(() => {
    if (user?.bloodGroup && !filterBloodGroup) {
      setFilterBloodGroup(user.bloodGroup);
    }
  }, [user]);

  useEffect(() => {
    fetchEmergencyRequests();
  }, [filterBloodGroup]);

  useEffect(() => {
    if (!token || !user) return;
    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'],
    });
    socketRef.current = socket;

    socket.on('responder_status_changed', (data) => {
      setRequests((prev) =>
        prev.map((req) =>
          req._id === data.requestId
            ? { ...req, userResponse: data.status }
            : req
        )
      );
    });

    socket.on('request_completed', (data) => {
      setRequests((prev) => prev.filter((req) => req._id !== data.requestId));
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [token, user]);

  const fetchEmergencyRequests = async () => {
    try {
      const params = {};
      if (filterBloodGroup) params.bloodGroup = filterBloodGroup;
      const response = await api.get('/api/emergency', {
        params,
        headers: { Authorization: `Bearer ${token}` },
      });
      const currentUserId = user?.id || user?._id;
      const requests = (response.data.emergencyRequests || []).map((req) => {
        const myResponse = (req.responders || []).find(
          (r) => String(r.donor?._id || r.donor) === String(currentUserId)
        );
        return { ...req, userResponse: myResponse?.status || undefined };
      });
      setRequests(requests);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch emergency requests'));
      setLoading(false);
    }
  };

  const handleSearchDonors = (bloodGroup, requestId) => {
    navigate('/search', { state: { bloodGroup, requestId } });
  };

  const [responding, setResponding] = useState({});

  const handleRespond = async (requestId, status) => {
    try {
      setResponding((prev) => ({ ...prev, [requestId]: status }));
      await api.post(`/api/emergency/${requestId}/respond`, { status }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (status === 'declined') {
        setRequests((prev) => prev.filter((req) => req._id !== requestId));
      } else {
        const userStatus = status === 'accepted' ? 'pending' : status;
        setRequests((prev) =>
          prev.map((req) =>
            req._id === requestId
              ? { ...req, userResponse: userStatus }
              : req
          )
        );
      }
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to respond'));
      setResponding((prev) => ({ ...prev, [requestId]: undefined }));
    }
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm(t('Are you sure you want to delete this request?'))) {
      return;
    }

    try {
      await api.delete(`/api/emergency/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(requests.filter(req => req._id !== requestId));
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete request'));
    }
  };

  const getRequestAge = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = (now - created) / (1000 * 60 * 60);

    if (diffInHours < 12) {
      return { label: t('Recent'), category: 'recent' };
    } else if (diffInHours < 24) {
      return { label: t('Today'), category: 'today' };
    } else if (diffInHours < 48) {
      return { label: t('1 day ago'), category: '1day' };
    } else if (diffInHours < 72) {
      return { label: t('2 days ago'), category: '2days' };
    } else if (diffInHours < 96) {
      return { label: t('3 days ago'), category: '3days' };
    } else if (diffInHours < 120) {
      return { label: t('4 days ago'), category: '4days' };
    } else if (diffInHours < 144) {
      return { label: t('5 days ago'), category: '5days' };
    } else if (diffInHours < 168) {
      return { label: t('6 days ago'), category: '6days' };
    } else {
      return { label: t('7 days ago'), category: '7days' };
    }
  };

  const groupRequestsByAge = (reqs) => {
    const groups = {
      recent: [],
      today: [],
      '1day': [],
      '2days': [],
      '3days': [],
      '4days': [],
      '5days': [],
      '6days': [],
      '7days': [],
    };

    reqs.forEach((req) => {
      const age = getRequestAge(req.createdAt);
      groups[age.category].push({ ...req, ageLabel: age.label });
    });

    return groups;
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getTimeRemaining = (expiresAt) => {
    if (!expiresAt) return null;
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry - now;
    if (diff <= 0) return { label: t('Expired'), urgent: false, expired: true };
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (hours > 0) return { label: `${hours}h ${minutes}m ${t('left')}`, urgent: hours < 6, expired: false };
    return { label: `${minutes}m ${t('left')}`, urgent: true, expired: false };
  };

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredRequests = requests.filter((request) => {
    const currentUserId = user?.id || user?._id;
    const isRequester = String(request.requester?._id || request.requester) === String(currentUserId);
    const matchesUserBloodGroup = !user?.bloodGroup || request.bloodGroup === user?.bloodGroup;

    // Emergency requests should only be shown to members of the same blood group or the requester
    if (!matchesUserBloodGroup && !isRequester) {
      return false;
    }

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      request.patientName?.toLowerCase().includes(query) ||
      request.hospital?.toLowerCase().includes(query) ||
      request.requester?.name?.toLowerCase().includes(query) ||
      request.contactNumber?.includes(query);

    const matchesBloodGroup =
      !filterBloodGroup || request.bloodGroup === filterBloodGroup;

    if (searchMode === 'geographic') {
      // Filter by distance if user has location and request has location
      let matchesRadius = true;
      if (user?.location?.coordinates && user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0 && 
          request.requesterLocation?.coordinates && request.requesterLocation.coordinates[0] !== 0 && request.requesterLocation.coordinates[1] !== 0) {
        const userLat = user.location.coordinates[1];
        const userLng = user.location.coordinates[0];
        const reqLat = request.requesterLocation.coordinates[1];
        const reqLng = request.requesterLocation.coordinates[0];
        
        const distance = calculateDistance(userLat, userLng, reqLat, reqLng);
        matchesRadius = distance <= filterRadius;
      }
      return matchesSearch && matchesBloodGroup && matchesRadius;
    } else {
      // Manual mode - filter by state and district
      const requestState = request.requester?.state;
      const requestDistrict = request.requester?.district;
      
      const matchesState = !filterState || requestState === filterState;
      const matchesDistrict = !filterDistrict || requestDistrict === filterDistrict;
      return matchesSearch && matchesBloodGroup && matchesState && matchesDistrict;
    }
  });

  const groupedRequests = groupRequestsByAge(filteredRequests);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-8 sm:py-12 px-4 sm:px-8 lg:px-12 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 font-display">{t('Emergency Requests')}</h1>
                <p className="text-gray-500 mt-1">{t('Active emergency blood donation requests')}</p>
            </div>
          </div>
          <button onClick={() => navigate('/create-emergency')}
            className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('Create Emergency Request')}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">{error}</div>
        )}

        {!loading && requests.length > 0 && (
          <div className="card p-6 mb-8">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 mb-3">{t('Filter Mode')}</label>
              <div className="flex flex-wrap gap-3">
                {['geographic', 'manual'].map((mode) => (
                  <label key={mode} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    searchMode === mode ? 'border-red-500 bg-red-50' : 'border-gray-200 hover:border-gray-300'
                  }`}>
                    <input type="radio" value={mode} checked={searchMode === mode}
                      onChange={(e) => setSearchMode(e.target.value)} className="accent-red-600" />
                    <span className="text-sm font-medium text-gray-700">
                      {mode === 'geographic' ? t('Nearby (Distance)') : t('By Location (State/District)')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div>
                <label htmlFor="searchQuery" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Search')}</label>
                <ExpandableSearchBar id="searchQuery" name="searchQuery" value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)} placeholder={t('Name, hospital, or contact')}
                  expandedWidth="28rem" className="w-full" />
              </div>
              <div>
                <label htmlFor="filterBloodGroup" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Blood Group')}</label>
                <select id="filterBloodGroup" value={filterBloodGroup} onChange={(e) => setFilterBloodGroup(e.target.value)}
                  className="select-field">
                  <option value="">{t('All blood groups')}</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              {searchMode === 'geographic' ? (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">{t('Distance')}</label>
                  <div className="flex gap-2">
                    {radiusOptions.map((r) => (
                      <button key={r} type="button" onClick={() => setFilterRadius(r)}
                        className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all ${
                          filterRadius === r ? 'bg-red-600 text-white shadow-md' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}>{r} {t('km')}</button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="filterState" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('State')}</label>
                    <select id="filterState" value={filterState} onChange={(e) => { setFilterState(e.target.value); setFilterDistrict(''); }}
                      className="select-field">
                       <option value="">{t('All states')}</option>
                      {states.map((state) => (<option key={state} value={state}>{getTranslatedState(state, lang)}</option>))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filterDistrict" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('District')}</label>
                    <select id="filterDistrict" value={filterDistrict} onChange={(e) => setFilterDistrict(e.target.value)}
                      disabled={!filterState} className="select-field disabled:bg-gray-100">
                      <option value="">{filterState ? t('Select district') : t('Select state first')}</option>
                      {districts.map((district) => (<option key={district} value={district}>{getTranslatedDistrict(district, lang)}</option>))}
                    </select>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
            <p className="mt-4 text-gray-500 font-medium">{t('Loading emergency requests...')}</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="card p-16 text-center">
            <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-gray-900">
              {requests.length === 0 ? t('No active emergency requests') : t('No requests match your search')}
            </h3>
            <p className="text-gray-500 mt-1">
              {requests.length === 0 ? t('Be the first to post an emergency request') : t('Try different filters')}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRequests).map(([category, categoryRequests]) => {
              if (categoryRequests.length === 0) return null;
              const categoryLabels = {
                recent: t('Recent (within 12 hours)'), today: t("Today's"), '1day': t('1 Day Ago'), '2days': t('2 Days Ago'),
                '3days': t('3 Days Ago'), '4days': t('4 Days Ago'), '5days': t('5 Days Ago'), '6days': t('6 Days Ago'), '7days': t('7 Days Ago'),
              };
              return (
                <div key={category} className="animate-fade-in">
                  <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="badge-red">{categoryRequests.length}</span>
                    {categoryLabels[category]}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {categoryRequests.map((request) => (
                      <article key={request._id} className="card p-6 hover:shadow-xl transition-all duration-300">
                        <div className="flex items-start justify-between mb-4">
                          <span className="badge-red text-base font-bold px-4 py-1.5">{request.bloodGroup}</span>
                          <span className="badge-green text-xs"><span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block mr-1 animate-pulse" />{t('Active')}</span>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-3">{request.patientName}</h3>
                        <div className="space-y-2 text-sm text-gray-600 mb-5">
                          <p className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                            <span className="font-medium text-gray-700">{t('Hospital:')}</span> {request.hospital}</p>
                          <p className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                            <span className="font-medium text-gray-700">{t('Contact:')}</span> {request.contactNumber}</p>
                          {request.unitsNeeded && (
                            <p className="flex items-center gap-2">
                              <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                              <span className="font-medium text-gray-700">{t('Units:')}</span>
                              {request.unitsFulfilled || 0}/{request.unitsNeeded} {t('needed')}
                            </p>
                          )}
                          {request.notes && <p className="italic text-gray-500">"{request.notes}"</p>}
                          <p className="text-xs text-gray-400">{t('Posted by')} {request.requester?._id ? (
                            <Link to={`/user/${request.requester._id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline font-medium inline-flex items-center gap-0.5">
                              {request.requester.name}
                              <svg className="w-3 h-3 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                              </svg>
                            </Link>
                          ) : (
                            <span>{request.requester?.name || t('Anonymous')}</span>
                          )} on {formatDate(request.createdAt)}</p>
                          {(() => {
                            const remaining = getTimeRemaining(request.expiresAt);
                            if (!remaining) return null;
                            return (
                              <p className={`text-xs font-semibold mt-1 ${remaining.expired ? 'text-red-500' : remaining.urgent ? 'text-orange-500' : 'text-gray-400'}`}>
                                {remaining.expired ? `⏰ ${remaining.label}` : remaining.urgent ? `⏰ ${remaining.label}` : remaining.label}
                              </p>
                            );
                          })()}
                        </div>
                        {request.requester?._id === user?.id || request.requester === user?.id ? (
                          <>
                            <button onClick={() => handleSearchDonors(request.bloodGroup, request._id)}
                              className="btn-primary w-full text-sm mb-3">{t('Find Nearby Donors')}</button>
                            <div className="flex gap-2">
                              {request.responders?.some(r => r.status === 'accepted') ? (
                                null
                              ) : (
                                <button onClick={() => navigate(`/update-emergency/${request._id}`)}
                                  className="btn-secondary flex-1 text-sm py-2.5">{t('Update')}</button>
                              )}
                              <button onClick={() => handleDeleteRequest(request._id)}
                                className="btn-secondary flex-1 text-sm py-2.5 text-red-600 border-red-200 hover:bg-red-50">{t('Delete')}</button>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col gap-2">
                            {(() => {
                              const remaining = (request.unitsNeeded || 1) - (request.unitsFulfilled || 0);
                              const myUnits = user?.unitsCanDonate || 1;
                              const lowUnits = myUnits < remaining;
                              return (
                                <>
                                  <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                                    <span>{t('Your units:')} {myUnits}</span>
                                    <span>{t('Need:')} {remaining}</span>
                                    {user?.bloodCharges > 0 ? (
                                      <span className="text-amber-600 font-semibold">₹{user.bloodCharges}/{t('unit')}</span>
                                    ) : (
                                      <span className="text-green-600 font-semibold">{t('Free')}</span>
                                    )}
                                  </div>
                                  {lowUnits && (
                                    <p className="text-xs text-amber-600 font-medium text-center">
                                      {t('You have only')} {myUnits} {t('unit(s). The request needs')} {remaining}.
                                    </p>
                                  )}
                                </>
                              );
                            })()}
                            {request.userResponse === 'accepted' ? (
                              <span className="flex-1 text-center py-2.5 rounded-xl bg-green-100 text-green-700 text-sm font-bold">{t('Accepted ✓')}</span>
                            ) : request.userResponse === 'pending' ? (
                              <span className="flex-1 text-center py-2.5 rounded-xl bg-yellow-100 text-yellow-700 text-sm font-bold">{t('Pending Approval')}</span>
                            ) : request.userResponse === 'declined' ? (
                              <span className="flex-1 text-center py-2.5 rounded-xl bg-gray-100 text-gray-600 text-sm font-bold">{t('Declined')}</span>
                            ) : user?.bloodGroup && user.bloodGroup !== request.bloodGroup ? (
                              <div className="p-3 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 text-xs font-semibold text-center">
                                {t('Blood group mismatch. Only')} {request.bloodGroup} {t('donors can respond.')}
                              </div>
                            ) : (
                              <div className="flex gap-2">
                                <button onClick={() => handleRespond(request._id, 'accepted')}
                                  disabled={responding[request._id]}
                                  className="btn-primary flex-1 text-sm py-2.5 disabled:opacity-50">
                                  {responding[request._id] === 'accepted' ? t('Responding...') : t('I Can Help')}
                                </button>
                                <button onClick={() => handleRespond(request._id, 'declined')}
                                  disabled={responding[request._id]}
                                  className="btn-secondary flex-1 text-sm py-2.5 disabled:opacity-50">
                                  {responding[request._id] === 'declined' ? t('Hiding...') : t("I Can't Help")}
                                </button>
                              </div>
                            )}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyRequests;
