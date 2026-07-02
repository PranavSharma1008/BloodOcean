import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const NotificationPanel = () => {
  const { token, acceptBloodRequest, declineBloodRequest } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(response.data.notifications);
      setUnreadCount(response.data.unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await api.put(`/api/notifications/${notificationId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.put('/api/notifications/mark-all-read', {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchNotifications();
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const handleAcceptRequest = async (notificationId, bloodRequestId) => {
    setActionLoading((prev) => ({ ...prev, [bloodRequestId]: 'accept' }));
    try {
      const result = await acceptBloodRequest(bloodRequestId);
      if (result.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to accept request:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bloodRequestId]: false }));
    }
  };

  const handleDeclineRequest = async (notificationId, bloodRequestId) => {
    setActionLoading((prev) => ({ ...prev, [bloodRequestId]: 'decline' }));
    try {
      const result = await declineBloodRequest(bloodRequestId);
      if (result.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error('Failed to decline request:', error);
    } finally {
      setActionLoading((prev) => ({ ...prev, [bloodRequestId]: false }));
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 rounded-xl text-white/90 hover:text-white hover:bg-white/10 transition-all focus:outline-none"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold leading-none text-white bg-gradient-to-br from-red-500 to-red-600 rounded-full ring-2 ring-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-red-500/10 border border-red-100/50 z-50 overflow-hidden animate-fade-in">
          <div className="p-5 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 font-display">Notifications</h3>
              </div>
              {unreadCount > 0 && (
                <button onClick={handleMarkAllAsRead}
                  className="text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 px-2.5 py-1.5 rounded-lg transition-all">
                  Mark all read
                </button>
              )}
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-10 text-center">
                <svg className="mx-auto h-14 w-14 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
                <p className="font-semibold text-gray-900">No notifications yet</p>
                <p className="text-sm text-gray-500 mt-1">We'll notify you when something arrives</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {notifications.map((notification) => (
                  <div key={notification._id}
                    className={`p-4 hover:bg-red-50/50 cursor-pointer transition-all duration-200 ${
                      notification.status === 'unread' ? 'bg-red-50/70' : ''
                    }`}
                    onClick={() => notification.status === 'unread' && handleMarkAsRead(notification._id)}>
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center ${
                        notification.status === 'unread'
                          ? 'bg-gradient-to-br from-red-100 to-red-200'
                          : 'bg-gray-100'
                      }`}>
                        <svg className={`w-4 h-4 ${notification.status === 'unread' ? 'text-red-600' : 'text-gray-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-red-600">
                            {notification.type === 'camp' ? 'Camp Alert' : notification.type === 'donor_request' ? 'Blood Request' : notification.type === 'blood_request_update' ? 'Request Update' : notification.type === 'emergency_response' ? 'Donor Available' : 'Emergency'}
                          </span>
                          <span className="text-[10px] text-gray-400 whitespace-nowrap">{formatDate(notification.createdAt)}</span>
                        </div>
                        <p className={`mt-1.5 text-sm leading-snug ${notification.status === 'unread' ? 'font-semibold text-gray-900' : 'text-gray-600'}`}>
                          {notification.message}
                        </p>
                        {notification.campId?.campName && (
                          <p className="mt-1 text-[11px] text-gray-500">Camp: {notification.campId.campName}</p>
                        )}
                        {(notification.type === 'donor_request' || notification.type === 'blood_request_update') && notification.bloodRequestId && (
                          <div className="mt-2 flex gap-2">
                            {(notification.type === 'donor_request' && notification.actionTaken === 'pending') && (
                              <>
                                <button
                                  onClick={() => handleAcceptRequest(notification._id, notification.bloodRequestId._id)}
                                  disabled={actionLoading[notification.bloodRequestId._id]}
                                  className="flex-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 disabled:opacity-50 transition-all"
                                >
                                  {actionLoading[notification.bloodRequestId._id] === 'accept' ? 'Accepting...' : 'Accept'}
                                </button>
                                <button
                                  onClick={() => handleDeclineRequest(notification._id, notification.bloodRequestId._id)}
                                  disabled={actionLoading[notification.bloodRequestId._id]}
                                  className="flex-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg text-xs font-bold hover:bg-gray-300 disabled:opacity-50 transition-all"
                                >
                                  {actionLoading[notification.bloodRequestId._id] === 'decline' ? 'Declining...' : 'Decline'}
                                </button>
                              </>
                            )}
                            {notification.actionTaken === 'accepted' && (
                              <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded-lg text-[10px] font-bold">Accepted</span>
                            )}
                            {notification.actionTaken === 'declined' && (
                              <span className="inline-block px-2 py-1 bg-gray-200 text-gray-700 rounded-lg text-[10px] font-bold">Declined</span>
                            )}
                          </div>
                        )}
                        {notification.type === 'emergency_response' && notification.relatedUserId && (
                          <div className="mt-2 flex flex-wrap gap-2">
                            <a href={`/user/${notification.relatedUserId._id}`} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-all">
                              View Profile
                            </a>
                            {notification.relatedUserId.phone && (
                              <a href={`tel:${notification.relatedUserId.phone}`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-all">
                                Call {notification.relatedUserId.phone}
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                      {notification.status === 'unread' && (
                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-gradient-to-br from-red-500 to-red-600 mt-2" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50/50">
              <button onClick={() => setIsOpen(false)}
                className="w-full text-center text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors">
                Close
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationPanel;
