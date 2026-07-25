import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedState } from '../data/locations';

const AdminDashboard = () => {
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState('statistics');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState(null);
  const [users, setUsers] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [bloodRequests, setBloodRequests] = useState([]);
  const [donations, setDonations] = useState([]);
  const [camps, setCamps] = useState([]);
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (user?.role !== 'admin') {
      setError(t('Access denied. Admin only.'));
      setLoading(false);
      return;
    }
    fetchStatistics();
  }, [user]);

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/api/admin/statistics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStatistics(response.data.statistics);
      setLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch statistics'));
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch users'));
    }
  };

  const fetchEmergencyRequests = async () => {
    try {
      const response = await api.get('/api/admin/emergency-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEmergencyRequests(response.data.requests);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch emergency requests'));
    }
  };

  const fetchBloodRequests = async () => {
    try {
      const response = await api.get('/api/admin/blood-requests', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBloodRequests(response.data.requests);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch blood requests'));
    }
  };

  const fetchDonations = async () => {
    try {
      const response = await api.get('/api/admin/donations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(response.data.donations);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch donations'));
    }
  };

  const fetchCamps = async () => {
    try {
      const response = await api.get('/api/admin/camps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCamps(response.data.camps);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch camps'));
    }
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/admin/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch notifications'));
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm(t('Are you sure you want to delete this user?'))) return;

    try {
      await api.delete(`/api/admin/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchUsers();
      fetchStatistics();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete user'));
    }
  };

  const handleDeleteEmergencyRequest = async (requestId) => {
    if (!window.confirm(t('Are you sure you want to delete this emergency request?'))) return;

    try {
      await api.delete(`/api/admin/emergency-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchEmergencyRequests();
      fetchStatistics();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete emergency request'));
    }
  };

  const handleDeleteBloodRequest = async (requestId) => {
    if (!window.confirm(t('Are you sure you want to delete this blood request?'))) return;

    try {
      await api.delete(`/api/admin/blood-requests/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBloodRequests();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete blood request'));
    }
  };

  const handleDeleteDonation = async (donationId) => {
    if (!window.confirm(t('Are you sure you want to delete this donation?'))) return;

    try {
      await api.delete(`/api/admin/donations/${donationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchDonations();
      fetchStatistics();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete donation'));
    }
  };

  const handleDeleteCamp = async (campId) => {
    if (!window.confirm(t('Are you sure you want to delete this camp?'))) return;

    try {
      await api.delete(`/api/admin/camps/${campId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchCamps();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete camp'));
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    if (!window.confirm(t('Are you sure you want to delete this notification?'))) return;

    try {
      await api.delete(`/api/admin/notifications/${notificationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to delete notification'));
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setError('');
    if (tab === 'users') fetchUsers();
    if (tab === 'requests') fetchEmergencyRequests();
    if (tab === 'blood-requests') fetchBloodRequests();
    if (tab === 'donations') fetchDonations();
    if (tab === 'camps') fetchCamps();
    if (tab === 'notifications') fetchNotifications();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-12 h-12 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
          <p className="mt-4 text-gray-600 font-medium">{t('Loading dashboard...')}</p>
        </div>
      </div>
    );
  }

  if (error && user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 flex items-center justify-center">
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-2xl">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Admin Dashboard')}</h1>
            <p className="text-gray-500 mt-1">{t('Manage users, emergency requests, blood requests, donations, camps, notifications, and view statistics')}</p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {/* Tab Navigation */}
        <div className="card mb-8 overflow-hidden">
          <nav className="flex px-2 py-2 gap-1" aria-label="Tabs">
            {[
              { id: 'statistics', label: t('Statistics'), icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
              { id: 'users', label: t('Users'), icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z' },
              { id: 'requests', label: t('Emergency'), icon: 'M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
              { id: 'blood-requests', label: t('Blood Requests'), icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
              { id: 'donations', label: t('Donations'), icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z' },
              { id: 'camps', label: t('Camps'), icon: 'M3 21h18M3 10h18M3 7l9-4 9 4M4 10v11m16-11v11M8 14v.01M12 14v.01M16 14v.01M8 18v.01M12 18v.01M16 18v.01' },
              { id: 'notifications', label: t('Notifications'), icon: 'M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9' },
            ].map((tab) => (
              <button key={tab.id} onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  activeTab === tab.id
                    ? 'bg-red-600 text-white shadow-lg shadow-red-500/25'
                    : 'text-gray-600 hover:text-red-600 hover:bg-red-50'
                }`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={tab.icon} />
                </svg>
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Statistics Tab */}
        {activeTab === 'statistics' && statistics && (
          <div className="space-y-6">
            {/* Donor Statistics */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('Donor Statistics')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100/50 border-2 border-blue-200/50">
                  <p className="text-sm font-semibold text-blue-700">{t('Total Donors')}</p>
                  <p className="text-4xl font-bold text-blue-900 font-display mt-1">{statistics.donors.total}</p>
                </div>
                <div className="p-6 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200/50">
                  <p className="text-sm font-semibold text-green-700">{t('Available Donors')}</p>
                  <p className="text-4xl font-bold text-green-900 font-display mt-1">{statistics.donors.available}</p>
                </div>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-bold text-gray-900 font-display mb-4">{t('Blood Group Distribution')}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {statistics.donors.bloodGroupDistribution.map((bg) => (
                    <div key={bg._id} className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200/50 text-center hover:shadow-md transition-shadow">
                      <p className="text-3xl font-bold text-red-600 font-display">{bg._id}</p>
                      <p className="text-sm font-medium text-gray-600 mt-1">{bg.count} {bg.count !== 1 ? t('donors') : t('donor')}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Emergency Request Statistics */}
            <div className="card p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('Emergency Request Statistics')}</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-purple-50 to-purple-100/50 border-2 border-purple-200/50">
                  <p className="text-sm font-semibold text-purple-700">{t('Total')}</p>
                  <p className="text-3xl font-bold text-purple-900 font-display mt-1">{statistics.emergencyRequests.total}</p>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-yellow-50 to-yellow-100/50 border-2 border-yellow-200/50">
                  <p className="text-sm font-semibold text-yellow-700">{t('Active')}</p>
                  <p className="text-3xl font-bold text-yellow-900 font-display mt-1">{statistics.emergencyRequests.active}</p>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-green-50 to-green-100/50 border-2 border-green-200/50">
                  <p className="text-sm font-semibold text-green-700">{t('Fulfilled')}</p>
                  <p className="text-3xl font-bold text-green-900 font-display mt-1">{statistics.emergencyRequests.fulfilled}</p>
                </div>
                <div className="p-5 rounded-2xl bg-gradient-to-br from-red-50 to-red-100/50 border-2 border-red-200/50">
                  <p className="text-sm font-semibold text-red-700">{t('Cancelled')}</p>
                  <p className="text-3xl font-bold text-red-900 font-display mt-1">{statistics.emergencyRequests.cancelled}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="card overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('User Management')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{users.length} {users.length !== 1 ? t('users') : t('user')} registered</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    {[t('Name'), t('Email'), t('Blood Group'), t('Role'), t('Status'), t('Actions')].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map((userItem) => (
                    <tr key={userItem._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <Link to={`/user/${userItem._id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">{userItem.name}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{userItem.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                          {userItem.bloodGroup || t('N/A')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          userItem.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                          {userItem.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold ${
                          userItem.available ? 'text-green-600' : 'text-red-600'
                        }`}>
                          <span className={`w-2 h-2 rounded-full ${userItem.available ? 'bg-green-500' : 'bg-red-500'}`} />
                          {userItem.available ? t('Available') : t('Unavailable')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userItem._id !== user?.id && (
                          <button onClick={() => handleDeleteUser(userItem._id)}
                            className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-all">
                            {t('Delete')}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Emergency Requests Tab */}
        {activeTab === 'requests' && (
          <div className="card overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-gray-100">
              <h2 className="text-xl font-bold text-gray-900 font-display">{t('Emergency Request Management')}</h2>
              <p className="text-sm text-gray-500 mt-0.5">{emergencyRequests.length} {emergencyRequests.length !== 1 ? t('requests') : t('request')}</p>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    {[t('Patient'), t('Blood Group'), t('Hospital'), t('Status'), t('Created'), t('Actions')].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {emergencyRequests.map((request) => (
                    <tr key={request._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{request.patientName}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                          {request.bloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{request.hospital}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          request.status === 'active' ? 'bg-green-100 text-green-700' :
                          request.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(request.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleDeleteEmergencyRequest(request._id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-all">
                          {t('Delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Blood Requests Tab */}
        {activeTab === 'blood-requests' && (
          <div className="card overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('Blood Request Management')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{bloodRequests.length} {bloodRequests.length !== 1 ? t('requests') : t('request')}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    {[t('Requester'), t('Donor'), t('Blood Group'), t('Hospital'), t('Status'), t('Created'), t('Actions')].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {bloodRequests.map((req) => (
                    <tr key={req._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <Link to={`/user/${req.requester?._id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">{req.requester?.name || t('Unknown')}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <Link to={`/user/${req.donor?._id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">{req.donor?.name || t('Unknown')}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                          {req.bloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{req.hospital}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          req.status === 'accepted' ? 'bg-green-100 text-green-700' :
                          req.status === 'completed' ? 'bg-blue-100 text-blue-700' :
                          req.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(req.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleDeleteBloodRequest(req._id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-all">
                          {t('Delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Donations Tab */}
        {activeTab === 'donations' && (
          <div className="card overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('Donation Management')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{donations.length} {donations.length !== 1 ? t('donations') : t('donation')}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    {[t('Donor'), t('Blood Group'), t('Hospital'), t('Units'), t('Date'), t('Actions')].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {donations.map((donation) => (
                    <tr key={donation._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <Link to={`/user/${donation.donor?._id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">{donation.donor?.name || t('Unknown')}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-red-100 text-red-700">
                          {donation.bloodGroup}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{donation.hospital}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">{donation.units}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(donation.donationDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleDeleteDonation(donation._id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-all">
                          {t('Delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Camps Tab */}
        {activeTab === 'camps' && (
          <div className="card overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('Camp Management')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{camps.length} {camps.length !== 1 ? t('camps') : t('camp')}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    {[t('Camp Name'), t('Organizer'), t('City'), t('State'), t('Start Date'), t('End Date'), t('Actions')].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {camps.map((camp) => (
                    <tr key={camp._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">{camp.campName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{camp.organizerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{camp.city || t('-')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{getTranslatedState(camp.state, lang)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(camp.startDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(camp.endDate)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleDeleteCamp(camp._id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-all">
                          {t('Delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="card overflow-hidden">
            <div className="px-8 py-5 border-b-2 border-gray-100 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-900 font-display">{t('Notification Management')}</h2>
                <p className="text-sm text-gray-500 mt-0.5">{notifications.length} {notifications.length !== 1 ? t('notifications') : t('notification')}</p>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y-2 divide-gray-100">
                <thead>
                  <tr className="bg-gray-50/50">
                    {[t('User'), t('Type'), t('Message'), t('Status'), t('Created'), t('Actions')].map((h) => (
                      <th key={h} className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {notifications.map((notif) => (
                    <tr key={notif._id} className="hover:bg-red-50/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        <Link to={`/user/${notif.donorId?._id}`} target="_blank" rel="noopener noreferrer" className="text-red-600 hover:underline">{notif.donorId?.name || t('Unknown')}</Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-gray-100 text-gray-700">
                          {notif.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{notif.message}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold ${
                          notif.status === 'unread' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                        }`}>
                          {notif.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(notif.createdAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button onClick={() => handleDeleteNotification(notif._id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-all">
                          {t('Delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
