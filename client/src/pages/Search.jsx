import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getStates, getDistricts, normalizeDistrict } from '../data/locations';

const Search = () => {
  const { user, token } = useAuth();
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searchParams, setSearchParams] = useState({
    bloodGroup: '',
    state: '',
    district: '',
    radius: 10,
    name: '',
  });
  const [results, setResults] = useState(null);
  const [emergencyRequestId, setEmergencyRequestId] = useState(null);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const radiusOptions = [5, 10, 20, 50];
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
      setSearchParams((prev) => ({
        ...prev,
        bloodGroup: location.state.bloodGroup,
        radius: 10,
      }));
      setEmergencyRequestId(location.state.requestId);
      handleSearch(null, {
        bloodGroup: location.state.bloodGroup,
        radius: 10,
        state: user?.state || searchParams.state,
        district: user?.district || user?.city || searchParams.district,
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
    setSearchParams({ ...searchParams, [name]: value });
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

    try {
      const response = await api.get('/api/donors/nearby', {
        params: {
          bloodGroup: params.bloodGroup,
          state: params.state,
          district: params.district,
          radius,
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Find Blood Donors
          </h1>
          <p className="text-gray-600 mb-8">
            Search by state, district, blood group, and optional name
          </p>

          {emergencyRequestId && (
            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-sm text-yellow-700">
                Searching for donors to help with an emergency blood request.
              </p>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
              {error}
            </div>
          )}

          <form onSubmit={handleSearch} className="space-y-6">
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
            </div>

            <div>
              <label htmlFor="radius" className="block text-sm font-medium text-gray-700 mb-2">
                Search Radius {hasGps ? '*' : '(requires GPS location)'}
              </label>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="radius"
                  name="radius"
                  min={5}
                  max={50}
                  step={5}
                  value={searchParams.radius}
                  onChange={handleChange}
                  disabled={!hasGps}
                  className="flex-1 accent-red-600 disabled:opacity-50"
                />
                <span className="text-sm font-semibold text-gray-900 w-16 text-right">
                  {searchParams.radius} km
                </span>
              </div>
              <div className="flex justify-between mt-1 text-xs text-gray-500">
                {radiusOptions.map((r) => (
                  <button
                    key={r}
                    type="button"
                    disabled={!hasGps}
                    onClick={() => setSearchParams({ ...searchParams, radius: r })}
                    className={`px-2 py-1 rounded ${
                      searchParams.radius === r
                        ? 'bg-red-100 text-red-700 font-medium'
                        : 'hover:bg-gray-100'
                    } disabled:opacity-50`}
                  >
                    {r} km
                  </button>
                ))}
              </div>
              {!hasGps && (
                <p className="text-xs text-gray-500 mt-2">
                  Set your GPS location to filter by distance. Without GPS, search shows all donors in the selected district.
                </p>
              )}
            </div>

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
