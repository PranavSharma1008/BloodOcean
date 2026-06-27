import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import NotificationPanel from './NotificationPanel';

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="bg-red-600 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-white font-bold text-xl">
              Blood Donation Finder
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user ? (
              <>
                <span className="text-white">
                  Welcome, {user.name}
                </span>
                <Link
                  to="/dashboard"
                  className="text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Dashboard
                </Link>
                <Link
                  to="/search"
                  className="text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Search Donors
                </Link>
                <Link
                  to="/emergency-requests"
                  className="text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Emergency Requests
                </Link>
                <Link
                  to="/camps"
                  className="text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Our Camps
                </Link>
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    className="text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium"
                  >
                    Admin
                  </Link>
                )}
                <NotificationPanel />
                <button
                  onClick={logout}
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="text-white hover:text-red-200 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="bg-red-700 hover:bg-red-800 text-white px-4 py-2 rounded-md text-sm font-medium"
                >
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
