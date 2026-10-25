import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useCallback } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import MagicLoader from './components/MagicLoader';
import SplashScreen from './components/SplashScreen';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import CompleteProfile from './pages/CompleteProfile';
import Location from './pages/Location';
import Search from './pages/Search';
import CreateEmergency from './pages/CreateEmergency';
import UpdateEmergency from './pages/UpdateEmergency';
import EmergencyRequests from './pages/EmergencyRequests';
import Camps from './pages/Camps';
import AdminDashboard from './pages/AdminDashboard';
import MapPage from './pages/MapPage';
import BloodRequestMap from './pages/BloodRequestMap';
import PublicProfile from './pages/PublicProfile';
import CampLocationMap from './pages/CampLocationMap';
import DonationHistory from './pages/DonationHistory';
import LiveTracking from './pages/LiveTracking';
import ProtectedRoute from './components/ProtectedRoute';
import useLocationTracker from './hooks/useLocationTracker';

function AppContent() {
  const { loading } = useAuth();
  useLocationTracker();
  const [splashDone, setSplashDone] = useState(() => {
    const path = window.location.pathname;
    if (path.startsWith('/user/') || path.startsWith('/complete-profile')) {
      return true;
    }
    return (
      localStorage.getItem('splashSeen') === 'true' ||
      sessionStorage.getItem('splashSeen') === 'true'
    );
  });

  const handleSplashComplete = useCallback(() => {
    sessionStorage.setItem('splashSeen', 'true');
    localStorage.setItem('splashSeen', 'true');
    setSplashDone(true);
  }, []);

  if (!splashDone) {
    return <SplashScreen onComplete={handleSplashComplete} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-slate-900 flex items-center justify-center">
        <MagicLoader size={240} particleCount={2} speed={1.5} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 transition-colors duration-200">
      <Navbar />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/complete-profile" element={<ProtectedRoute><CompleteProfile /></ProtectedRoute>} />
        <Route path="/location" element={<ProtectedRoute><Location /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
        <Route path="/create-emergency" element={<ProtectedRoute><CreateEmergency /></ProtectedRoute>} />
        <Route path="/update-emergency/:id" element={<ProtectedRoute><UpdateEmergency /></ProtectedRoute>} />
        <Route path="/emergency-requests" element={<ProtectedRoute><EmergencyRequests /></ProtectedRoute>} />
        <Route path="/camps" element={<ProtectedRoute><Camps /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><AdminDashboard /></ProtectedRoute>} />
        <Route path="/map" element={<ProtectedRoute><MapPage /></ProtectedRoute>} />
        <Route path="/blood-request/:id" element={<ProtectedRoute><BloodRequestMap /></ProtectedRoute>} />
        <Route path="/tracking/:requestId" element={<ProtectedRoute><LiveTracking /></ProtectedRoute>} />
        <Route path="/user/:id" element={<ProtectedRoute><PublicProfile /></ProtectedRoute>} />
        <Route path="/camp/:id/location" element={<ProtectedRoute><CampLocationMap /></ProtectedRoute>} />
        <Route path="/donation-history" element={<ProtectedRoute><DonationHistory /></ProtectedRoute>} />
        <Route path="/" element={<Login />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <ThemeProvider>
          <Router>
            <AppContent />
          </Router>
        </ThemeProvider>
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
