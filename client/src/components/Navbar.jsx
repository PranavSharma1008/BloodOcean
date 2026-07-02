import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationPanel from './NotificationPanel';
import ThemeToggle from './ThemeToggle';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard' },
    { to: '/search', label: 'Search Donors' },
    { to: '/emergency-requests', label: 'Requests' },
    { to: '/camps', label: 'Camps' },
    { to: '/map', label: 'Map' },
    { to: '/donation-history', label: 'Donations' },
    ...(user?.role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="sticky top-0 z-50 bg-gradient-to-r from-red-700 via-red-600 to-red-500 shadow-lg shadow-red-900/20 border-b border-red-500/20">
      <div className="w-full px-4 sm:px-6">
        <div className="flex items-center justify-between h-16 lg:h-20">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-4 lg:gap-10">
            <Link to="/" className="flex items-center gap-3 group flex-shrink-0">
              <svg width="32" height="32" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="flex-shrink-0">
                <path d="M50 10C50 10 25 45 25 60C25 75.5 37.5 85 50 85C62.5 85 75 75.5 75 60C75 45 50 10 50 10Z" fill="white" />
                <ellipse cx="46" cy="52" rx="6" ry="9" fill="white" opacity="0.3" />
              </svg>
              <span className="text-white font-extrabold text-xl sm:text-2xl tracking-tight font-display">
                Blood<span className="font-light">Donation</span>Finder
              </span>
            </Link>

            {/* Desktop Nav */}
            <div className="hidden lg:flex items-center gap-1">
              {user && navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-4 py-2.5 rounded-xl text-base font-semibold tracking-wide transition-all duration-200 ${
                    isActive(link.to)
                      ? 'bg-white/20 text-white shadow-inner'
                      : 'text-white/85 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-3 lg:gap-4">
            {user ? (
              <>
                <ThemeToggle />
                <span className="hidden sm:inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 pl-1 pr-4 py-1 text-sm sm:text-base text-white/90">
                  {user?.avatar ? (
                    <img src={user.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </span>
                  )}
                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                  {user.name}
                </span>
                <NotificationPanel />
                <span className="w-8 lg:w-16" />
                <button
                  onClick={handleLogout}
                  className="hidden sm:inline-flex items-center gap-2 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 px-4 py-2 text-sm sm:text-base font-semibold text-white transition-all duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Logout
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link
                  to="/login"
                  className="text-white/80 hover:text-white text-base font-semibold transition duration-200"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  className="rounded-full bg-white px-6 py-2.5 text-base font-bold text-red-600 shadow-lg shadow-red-900/20 hover:shadow-red-900/30 hover:scale-105 active:scale-95 transition-all duration-200"
                >
                  Register
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            {user && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="lg:hidden p-2 rounded-xl text-white/80 hover:text-white hover:bg-white/10 transition-all"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  {mobileOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {user && mobileOpen && (
        <div className="lg:hidden border-t border-white/10 bg-red-700/95 backdrop-blur-lg animate-slide-down">
          <div className="px-4 py-4 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={`block px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  isActive(link.to)
                    ? 'bg-white/20 text-white'
                    : 'text-white/70 hover:text-white hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <hr className="border-white/10 my-2" />
            <button
              onClick={() => { handleLogout(); setMobileOpen(false); }}
              className="w-full text-left px-4 py-3 rounded-xl text-sm font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-all"
            >
              Logout
            </button>
          </div>
        </div>
      )}
      {user?.disease && user.disease.trim() !== '' && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-sm font-semibold animate-fade-in">
          Sorry, we don't accept the disease blood for donation.
        </div>
      )}
    </nav>
  );
};

export default Navbar;
