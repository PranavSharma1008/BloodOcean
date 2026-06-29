import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getStates, getDistricts } from '../data/locations';

const EmergencyRequests = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');
  const [filterRadius, setFilterRadius] = useState(20);
  const [searchMode, setSearchMode] = useState('geographic');
  const [filterState, setFilterState] = useState('');
  const [filterDistrict, setFilterDistrict] = useState('');
  const [filterCity, setFilterCity] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const radiusOptions = [5, 10, 20];
  const states = getStates();
  const districts = getDistricts(filterState);

  useEffect(() => {
    fetchEmergencyRequests();
  }, []);

  const fetchEmergencyRequests = async () => {
    try {
      const response = await api.get('/api/emergency', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(response.data.emergencyRequests);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch emergency requests');
      setLoading(false);
    }
  };

  const handleSearchDonors = (bloodGroup, requestId) => {
    navigate('/search', { state: { bloodGroup, requestId } });
  };

  const handleDeleteRequest = async (requestId) => {
    if (!window.confirm('Are you sure you want to delete this request?')) {
      return;
    }

    try {
      await api.delete(`/api/emergency/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRequests(requests.filter(req => req._id !== requestId));
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to delete request');
    }
  };

  const getRequestAge = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffInHours = (now - created) / (1000 * 60 * 60);

    if (diffInHours < 12) {
      return { label: 'Recent', category: 'recent' };
    } else if (diffInHours < 24) {
      return { label: 'Today', category: 'today' };
    } else if (diffInHours < 48) {
      return { label: '1 day ago', category: '1day' };
    } else if (diffInHours < 72) {
      return { label: '2 days ago', category: '2days' };
    } else if (diffInHours < 96) {
      return { label: '3 days ago', category: '3days' };
    } else if (diffInHours < 120) {
      return { label: '4 days ago', category: '4days' };
    } else if (diffInHours < 144) {
      return { label: '5 days ago', category: '5days' };
    } else if (diffInHours < 168) {
      return { label: '6 days ago', category: '6days' };
    } else {
      return { label: '7 days ago', category: '7days' };
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
      const requestCity = request.requester?.city;
      
      const matchesState = !filterState || requestState === filterState;
      const matchesDistrict = !filterDistrict || requestDistrict === filterDistrict;
      const matchesCity = !filterCity || (requestCity && requestCity.toLowerCase().includes(filterCity.toLowerCase().trim()));
      return matchesSearch && matchesBloodGroup && matchesState && matchesDistrict && matchesCity;
    }
  });

  const groupedRequests = groupRequestsByAge(filteredRequests);

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Emergency Blood Requests
            </h1>
            <p className="text-gray-600 mt-2">
              Active emergency blood donation requests in your area
            </p>
          </div>
          <button
            onClick={() => navigate('/create-emergency')}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Create Request
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {!loading && requests.length > 0 && (
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Mode
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="geographic"
                    checked={searchMode === 'geographic'}
                    onChange={(e) => setSearchMode(e.target.value)}
                    className="mr-2"
                  />
                  <span>Search by Distance (Nearby)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="manual"
                    checked={searchMode === 'manual'}
                    onChange={(e) => setSearchMode(e.target.value)}
                    className="mr-2"
                  />
                  <span>Search by Location (State/District/City)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
                  Search by name, hospital, or contact
                </label>
                <input
                  type="text"
                  id="searchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Ram, Hospital, 9317290976"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
              <div>
                <label htmlFor="filterBloodGroup" className="block text-sm font-medium text-gray-700 mb-2">
                  Filter by blood group
                </label>
                <select
                  id="filterBloodGroup"
                  value={filterBloodGroup}
                  onChange={(e) => setFilterBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">All blood groups</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>
              {searchMode === 'geographic' ? (
                <div>
                  <label htmlFor="filterRadius" className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by distance
                  </label>
                  <div className="relative">
                    <input
                      type="range"
                      id="filterRadius"
                      min={0}
                      max={2}
                      step={1}
                      value={radiusOptions.indexOf(filterRadius)}
                      onChange={(e) => {
                        const index = parseInt(e.target.value);
                        setFilterRadius(radiusOptions[index]);
                      }}
                      className="w-full accent-red-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, #dc2626 0%, #dc2626 ${(radiusOptions.indexOf(filterRadius) / 2) * 100}%, #e5e7eb ${(radiusOptions.indexOf(filterRadius) / 2) * 100}%, #e5e7eb 100%)`
                      }}
                    />
                    <div className="flex justify-between mt-2 text-xs text-gray-500">
                      {radiusOptions.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setFilterRadius(r)}
                          className={`px-2 py-1 rounded ${
                            filterRadius === r
                              ? 'bg-red-100 text-red-700 font-medium'
                              : 'hover:bg-gray-100'
                          }`}
                        >
                          {r} km
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  <div>
                    <label htmlFor="filterState" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by state
                    </label>
                    <select
                      id="filterState"
                      value={filterState}
                      onChange={(e) => {
                        setFilterState(e.target.value);
                        setFilterDistrict('');
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">All states</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filterDistrict" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by district
                    </label>
                    <select
                      id="filterDistrict"
                      value={filterDistrict}
                      onChange={(e) => setFilterDistrict(e.target.value)}
                      disabled={!filterState}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {filterState ? 'Select district' : 'Select state first'}
                      </option>
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor="filterCity" className="block text-sm font-medium text-gray-700 mb-2">
                      Filter by city / town
                    </label>
                    <input
                      type="text"
                      id="filterCity"
                      value={filterCity}
                      onChange={(e) => setFilterCity(e.target.value)}
                      disabled={!filterDistrict}
                      placeholder="Enter city or town"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p className="mt-2 text-gray-600">Loading emergency requests...</p>
          </div>
        ) : filteredRequests.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-12 text-center">
            <h3 className="text-sm font-medium text-gray-900">
              {requests.length === 0
                ? 'No active emergency requests'
                : 'No requests match your search'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {requests.length === 0
                ? 'Be the first to post an emergency blood donation request'
                : 'Try a different search term or blood group filter'}
            </p>
            {requests.length === 0 && (
              <button
                onClick={() => navigate('/create-emergency')}
                className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
              >
                Create Emergency Request
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedRequests).map(([category, categoryRequests]) => {
              if (categoryRequests.length === 0) return null;

              const categoryLabels = {
                recent: 'Recent Blood Requests (within 12 hours)',
                today: "Today's Requests",
                '1day': '1 Day Ago',
                '2days': '2 Days Ago',
                '3days': '3 Days Ago',
                '4days': '4 Days Ago',
                '5days': '5 Days Ago',
                '6days': '6 Days Ago',
                '7days': '7 Days Ago',
              };

              return (
                <div key={category}>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                      {categoryRequests.length}
                    </span>
                    {categoryLabels[category]}
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {categoryRequests.map((request) => (
                      <div key={request._id} className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                            {request.bloodGroup}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Active
                          </span>
                        </div>

                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {request.patientName}
                        </h3>

                        <div className="space-y-2 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">Hospital:</span> {request.hospital}
                          </p>
                          <p>
                            <span className="font-medium">Contact:</span> {request.contactNumber}
                          </p>
                          {request.notes && (
                            <p>
                              <span className="font-medium">Notes:</span> {request.notes}
                            </p>
                          )}
                          <p>
                            <span className="font-medium">Posted by:</span> {request.requester?.name || 'Anonymous'}
                          </p>
                          <p>
                            <span className="font-medium">Posted on:</span> {formatDate(request.createdAt)}
                          </p>
                        </div>

                        <button
                          onClick={() => handleSearchDonors(request.bloodGroup, request._id)}
                          className="mt-4 w-full bg-red-600 text-white py-2 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                        >
                          Find Nearby Donors
                        </button>

                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => navigate(`/update-emergency/${request._id}`)}
                            className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                          >
                            Update Request
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(request._id)}
                            className="flex-1 bg-red-100 text-red-800 py-2 px-4 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-500"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
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
