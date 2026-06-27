import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getStates, getDistricts, normalizeDistrict } from '../data/locations';

const Search = () => {
  const { user, token, refreshUser } = useAuth();
  const location = useLocation();
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

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const radiusOptions = [5, 10, 20];
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
        state,
        district: normalizeDistrict(state, user.district || user.city || prev.district),
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
        district: normalizeDistrict(user?.state || prev.state, user?.district || user?.city || prev.district),
      }));
      setEmergencyRequestId(location.state.requestId);
      handleSearch(null, {
        bloodGroup: location.state.bloodGroup,
        state: user?.state || searchParams.state,
        district: normalizeDistrict(user?.state || searchParams.state, user?.district || user?.city || searchParams.district),
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
      const validRadii = [5, 10, 20];
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
          district: normalizeDistrict(state, result.user.district || result.user.city || prev.district),
        }));
        setSuccessMessage('Location Refreshed');
        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setError('Failed to refresh location. Please try again.');
      }
    } catch (err) {
      setError('Failed to refresh location. Please try again.');
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
      setError('Please select a blood group');
      setLoading(false);
      return;
    }

    if (searchMode === 'geographic') {
      if (!hasGps) {
        setError('Geographic search requires GPS location. Please set your location in profile settings.');
        setLoading(false);
        return;
      }
    } else {
      if (!params.state) {
        setError('Please select a state');
        setLoading(false);
        return;
      }

      if (!params.district) {
        setError('Please select a district');
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
      setError(err.response?.data?.message || 'Failed to search for donors');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow rounded-lg p-8 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-3xl font-bold text-gray-900">
              Find Blood Donors
            </h1>
            <button
              type="button"
              onClick={handleRefreshLocation}
              disabled={refreshingLocation}
              className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-5 h-5 ${refreshingLocation ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {refreshingLocation ? 'Updating...' : 'Refresh Location'}
            </button>
          </div>
          <p className="text-gray-600 mb-8">
            Search for blood donors using geographic location or manual location selection
          </p>

          {emergencyRequestId && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-700">
                Searching for donors to help with an emergency blood request.
              </p>
            </div>
          )}

          {successMessage && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
              {successMessage}
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Search Type
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="searchMode"
                    value="geographic"
                    checked={searchMode === 'geographic'}
                    onChange={(e) => setSearchMode(e.target.value)}
                    disabled={!hasGps}
                    className="mr-2 accent-red-600"
                  />
                  <span className={`text-sm ${!hasGps ? 'text-gray-400' : 'text-gray-700'}`}>
                    Search by Distance (Nearby Donors)
                  </span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="searchMode"
                    value="manual"
                    checked={searchMode === 'manual'}
                    onChange={(e) => setSearchMode(e.target.value)}
                    className="mr-2 accent-red-600"
                  />
                  <span className="text-sm text-gray-700">
                    Search by Manual Location (State/District)
                  </span>
                </label>
              </div>
              {!hasGps && searchMode === 'geographic' && (
                <p className="text-xs text-red-600 mt-2">
                  Geographic search requires GPS location. Please set your location in profile settings.
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-medium text-gray-700 mb-2">
                  Blood Group *
                </label>
                <select
                  id="bloodGroup"
                  name="bloodGroup"
                  value={searchParams.bloodGroup}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select blood group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>
                      {group}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Donor Name (optional)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={searchParams.name}
                  onChange={handleChange}
                  placeholder="Search by specific name"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>

              {searchMode === 'manual' && (
                <>
                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                      State *
                    </label>
                    <select
                      id="state"
                      name="state"
                      value={searchParams.state}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                      <option value="">Select state</option>
                      {states.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-2">
                      District *
                    </label>
                    <select
                      id="district"
                      name="district"
                      value={searchParams.district}
                      onChange={handleChange}
                      disabled={!searchParams.state}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                    >
                      <option value="">
                        {searchParams.state ? 'Select district' : 'Select state first'}
                      </option>
                      {districts.map((district) => (
                        <option key={district} value={district}>
                          {district}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}
            </div>

            {searchMode === 'geographic' && (
              <div>
                <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                  Search Radius *
                </label>
                <div className="relative">
                  <input
                    type="range"
                    id="radius"
                    name="radius"
                    min={5}
                    max={20}
                    step={5}
                    value={searchParams.radius}
                    onChange={handleChange}
                    className="w-full accent-red-600 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <div className="flex justify-between mt-2 text-xs text-gray-500">
                    {radiusOptions.map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setSearchParams({ ...searchParams, radius: r })}
                        className={`px-2 py-1 rounded ${
                          searchParams.radius === r
                            ? 'bg-red-100 text-red-700 font-medium'
                            : 'hover:bg-gray-100'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Search will find donors within the selected radius from your current GPS location.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search Donors'}
            </button>
          </form>
        </div>

        {results && (
          <div className="bg-white shadow rounded-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Search Results</h2>
              <span className="text-sm text-gray-600">
                Found {results.count} donor(s) in {results.district}, {results.state}
                {hasGps && ` within ${results.searchRadius} km`}
              </span>
            </div>

            {results.count === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-sm font-medium text-gray-900">No donors found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Try a different district, increase radius, or check back later
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {results.donors.map((donor, index) => (
                  <div
                    key={donor.id}
                    className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-lg font-medium text-gray-900">{donor.name}</h3>
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            {donor.bloodGroup}
                          </span>
                          <span
                            className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              donor.available
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {donor.available ? 'Available' : 'Not Available'}
                          </span>
                        </div>
                        <div className="space-y-1 text-sm text-gray-600">
                          <p>
                            <span className="font-medium">District:</span>{' '}
                            {donor.district || donor.city}
                          </p>
                          <p>
                            <span className="font-medium">Phone:</span> {donor.phone}
                          </p>
                          {donor.distance !== 'N/A' && (
                            <p>
                              <span className="font-medium">Distance:</span>{' '}
                              <span className="text-red-600 font-semibold">{donor.distance} km</span>
                            </p>
                          )}
                        </div>
                      </div>
                      <span className="inline-flex px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                        #{index + 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Search;
