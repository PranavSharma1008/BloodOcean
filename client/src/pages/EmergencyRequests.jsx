import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const EmergencyRequests = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [requests, setRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterBloodGroup, setFilterBloodGroup] = useState('');

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
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

    return matchesSearch && matchesBloodGroup;
  });

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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="searchQuery" className="block text-sm font-medium text-gray-700 mb-2">
                  Search by name, hospital, or contact
                </label>
                <input
                  type="text"
                  id="searchQuery"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="e.g. Ram, neelam, 9317290976"
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRequests.map((request) => (
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

                {request.requester?._id === user?.id && (
                  <button
                    onClick={() => navigate(`/update-emergency/${request._id}`)}
                    className="mt-2 w-full bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  >
                    Update Request
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmergencyRequests;
