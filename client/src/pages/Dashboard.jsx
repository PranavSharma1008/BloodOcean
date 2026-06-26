import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">
          Welcome to Blood Donation Finder
        </h1>

        {!user?.profileCompleted && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-yellow-700">
                  Please complete your donor profile to help others find you.
                  <button
                    onClick={() => navigate('/complete-profile')}
                    className="font-medium underline hover:text-yellow-800 ml-2"
                  >
                    Complete Profile
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        {user?.profileCompleted && !(user?.location?.coordinates && user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0) && (
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  Set your location to help others find nearby blood donors.
                  <button
                    onClick={() => navigate('/location')}
                    className="font-medium underline hover:text-blue-800 ml-2"
                  >
                    Set Location
                  </button>
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            User Profile
          </h2>
          <div className="space-y-2">
            <p className="text-gray-700">
              <span className="font-medium">Name:</span> {user?.name}
            </p>
            <p className="text-gray-700">
              <span className="font-medium">Email:</span> {user?.email}
            </p>
            {user?.profileCompleted && (
              <>
                <p className="text-gray-700">
                  <span className="font-medium">Phone:</span> {user?.phone}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Blood Group:</span> {user?.bloodGroup}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">State:</span> {user?.state || 'Not set'}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">District:</span> {user?.district || user?.city || 'Not set'}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Availability:</span>{' '}
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    user?.available
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {user?.available ? 'Available' : 'Not Available'}
                  </span>
                </p>
                {user?.location?.coordinates && user.location.coordinates[0] !== 0 && user.location.coordinates[1] !== 0 && (
                  <p className="text-gray-700">
                    <span className="font-medium">Location:</span> Lat: {user.location.coordinates[1].toFixed(4)}, Lng: {user.location.coordinates[0].toFixed(4)}
                  </p>
                )}
              </>
            )}
            <p className="text-gray-700">
              <span className="font-medium">Role:</span> {user?.role}
            </p>
          </div>
          {user?.profileCompleted && (
            <button
              onClick={() => navigate('/complete-profile')}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
            >
              Edit Profile
            </button>
          )}
        </div>

        {user?.profileCompleted && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/search')}
                className="border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 hover:border-red-200 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">Search Donors</h3>
                <p className="text-gray-600 text-sm">
                  Find nearby blood donors based on your location.
                </p>
              </button>
              <button
                onClick={() => navigate('/create-emergency')}
                className="border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 hover:border-red-200 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">Create Emergency Request</h3>
                <p className="text-gray-600 text-sm">
                  Post an urgent blood donation request for nearby donors.
                </p>
              </button>
              <button
                onClick={() => navigate('/emergency-requests')}
                className="border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 hover:border-red-200 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">Emergency Requests</h3>
                <p className="text-gray-600 text-sm">
                  View and manage your emergency blood requests.
                </p>
              </button>
              <button
                onClick={() => navigate('/location')}
                className="border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 hover:border-red-200 transition-colors"
              >
                <h3 className="font-medium text-gray-900 mb-2">Update Location</h3>
                <p className="text-gray-600 text-sm">
                  Update your GPS coordinates for donor search and matching.
                </p>
              </button>
              {user?.role === 'admin' && (
                <button
                  onClick={() => navigate('/admin')}
                  className="border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 hover:border-red-200 transition-colors"
                >
                  <h3 className="font-medium text-gray-900 mb-2">Admin Dashboard</h3>
                  <p className="text-gray-600 text-sm">
                    Manage users, emergency requests, and view statistics.
                  </p>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
