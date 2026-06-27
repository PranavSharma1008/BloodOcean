import { createContext, useState, useContext, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      try {
        const response = await api.get('/api/profile', {
          headers: { Authorization: `Bearer ${storedToken}` },
        });
        setUser(response.data.user);
        setToken(storedToken);
      } catch (error) {
        localStorage.removeItem('token');
        setUser(null);
        setToken(null);
      }
    }
    setLoading(false);
  };

  const login = async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setToken(response.data.token);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed',
      };
    }
  };

  const register = async (name, email, password) => {
    try {
      const response = await api.post('/api/auth/register', {
        name,
        email,
        password,
      });
      localStorage.setItem('token', response.data.token);
      setUser(response.data.user);
      setToken(response.data.token);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Registration failed',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setToken(null);
  };

  const getProfile = async () => {
    try {
      const response = await api.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch profile',
      };
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.get('/api/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to refresh user data',
      };
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await api.put('/api/profile', profileData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUser(response.data.user);
      return { success: true, user: response.data.user };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update profile',
      };
    }
  };

  const updateLocation = async (latitude, longitude) => {
    try {
      const response = await api.put(
        '/api/users/location',
        { latitude, longitude },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data.user) {
        setUser(response.data.user);
      } else {
        setUser((prev) => ({
          ...prev,
          location: {
            type: 'Point',
            coordinates: [longitude, latitude],
          },
        }));
      }
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to update location',
      };
    }
  };

  const getNotifications = async () => {
    try {
      const response = await api.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to fetch notifications',
      };
    }
  };

  const markNotificationAsRead = async (notificationId) => {
    try {
      const response = await api.put(`/api/notifications/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark notification as read',
      };
    }
  };

  const markAllNotificationsAsRead = async () => {
    try {
      const response = await api.put('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return { success: true, message: response.data.message };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to mark all notifications as read',
      };
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, token, login, register, logout, getProfile, refreshUser, updateProfile, updateLocation, getNotifications, markNotificationAsRead, markAllNotificationsAsRead }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
