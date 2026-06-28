import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CompleteProfile from './pages/CompleteProfile';
import Location from './pages/Location';
import Search from './pages/Search';
import CreateEmergency from './pages/CreateEmergency';
import UpdateEmergency from './pages/UpdateEmergency';
import EmergencyRequests from './pages/EmergencyRequests';
import Camps from './pages/Camps';
import AdminDashboard from './pages/AdminDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/complete-profile"
              element={
                <ProtectedRoute>
                  <CompleteProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/location"
              element={
                <ProtectedRoute>
                  <Location />
                </ProtectedRoute>
              }
            />
            <Route
              path="/search"
              element={
                <ProtectedRoute>
                  <Search />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-emergency"
              element={
                <ProtectedRoute>
                  <CreateEmergency />
                </ProtectedRoute>
              }
            />
            <Route
              path="/update-emergency/:id"
              element={
                <ProtectedRoute>
                  <UpdateEmergency />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency-requests"
              element={
                <ProtectedRoute>
                  <EmergencyRequests />
                </ProtectedRoute>
              }
            />
            <Route
              path="/camps"
              element={
                <ProtectedRoute>
                  <Camps />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route path="/" element={<Login />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
