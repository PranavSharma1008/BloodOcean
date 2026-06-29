import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getStates, getDistricts } from '../data/locations';

const Camps = () => {
  const { user, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [camps, setCamps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    campName: '',
    organizerName: '',
    state: '',
    district: '',
    city: '',
    address: '',
    startDate: '',
    endDate: '',
    startTime: '',
    endTime: '',
    contactNumber: '',
    description: '',
  });

  const states = getStates();
  const districts = getDistricts(formData.state);

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    try {
      const response = await api.get('/api/camps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCamps(response.data);
    } catch (err) {
      setError('Failed to fetch camps');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setFormData({ ...formData, state: value, district: '', city: '' });
      return;
    }
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (!formData.campName || !formData.organizerName || !formData.state || 
        !formData.district || !formData.startDate || !formData.endDate || !formData.startTime || !formData.endTime || !formData.contactNumber) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    try {
      if (editingId) {
        await api.put(`/api/camps/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Camp updated successfully!');
      } else {
        await api.post('/api/camps', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess('Camp posted successfully!');
      }
      setFormData({
        campName: '',
        organizerName: '',
        state: '',
        district: '',
        city: '',
        address: '',
        startDate: '',
        endDate: '',
        startTime: '',
        endTime: '',
        contactNumber: '',
        description: '',
      });
      setShowForm(false);
      setEditingId(null);
      fetchCamps();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? 'Failed to update camp' : 'Failed to post camp'));
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (camp) => {
    setFormData({
      campName: camp.campName || '',
      organizerName: camp.organizerName || '',
      state: camp.state || '',
      district: camp.district || '',
      city: camp.city || '',
      address: camp.address || '',
      startDate: camp.startDate ? new Date(camp.startDate).toISOString().split('T')[0] : '',
      endDate: camp.endDate ? new Date(camp.endDate).toISOString().split('T')[0] : '',
      startTime: camp.startTime || '',
      endTime: camp.endTime || '',
      contactNumber: camp.contactNumber || '',
      description: camp.description || '',
    });
    setEditingId(camp._id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this camp?')) return;
    try {
      await api.delete(`/api/camps/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess('Camp deleted successfully!');
      fetchCamps();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete camp');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Blood Donation Camps</h1>
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false);
                setEditingId(null);
                setFormData({
                  campName: '',
                  organizerName: '',
                  state: '',
                  district: '',
                  city: '',
                  address: '',
                  startDate: '',
                  endDate: '',
                  startTime: '',
                  endTime: '',
                  contactNumber: '',
                  description: '',
                });
              } else {
                setShowForm(true);
              }
            }}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            {showForm ? 'Cancel' : 'Post New Camp'}
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-6">
            {success}
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {showForm && (
          <div className="bg-white shadow rounded-lg p-8 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">{editingId ? 'Update Blood Donation Camp' : 'Post a New Blood Donation Camp'}</h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="campName" className="block text-sm font-medium text-gray-700 mb-2">
                    Camp Name *
                  </label>
                  <input
                    type="text"
                    id="campName"
                    name="campName"
                    value={formData.campName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter camp name"
                  />
                </div>

                <div>
                  <label htmlFor="organizerName" className="block text-sm font-medium text-gray-700 mb-2">
                    Organizer Name *
                  </label>
                  <input
                    type="text"
                    id="organizerName"
                    name="organizerName"
                    value={formData.organizerName}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter organizer name"
                  />
                </div>

                <div>
                  <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-2">
                    State *
                  </label>
                  <select
                    id="state"
                    name="state"
                    value={formData.state}
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
                    value={formData.district}
                    onChange={handleChange}
                    disabled={!formData.state}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 disabled:bg-gray-100"
                  >
                    <option value="">
                      {formData.state ? 'Select district' : 'Select state first'}
                    </option>
                    {districts.map((district) => (
                      <option key={district} value={district}>
                        {district}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">
                    City / Town (optional)
                  </label>
                  <input
                    type="text"
                    id="city"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter city or town"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter venue address"
                  />
                </div>

                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                    End Date *
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-2">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    id="startTime"
                    name="startTime"
                    value={formData.startTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-2">
                    End Time *
                  </label>
                  <input
                    type="time"
                    id="endTime"
                    name="endTime"
                    value={formData.endTime}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                  />
                </div>

                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                    Contact Number *
                  </label>
                  <input
                    type="tel"
                    id="contactNumber"
                    name="contactNumber"
                    value={formData.contactNumber}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter contact number"
                  />
                </div>

                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
                    placeholder="Enter camp description"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 text-white py-3 px-4 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              >
                {loading ? 'Posting...' : 'Post Camp'}
              </button>
            </form>
          </div>
        )}

        <div className="bg-white shadow rounded-lg p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Upcoming Blood Donation Camps</h2>
          {camps.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-sm font-medium text-gray-900">No camps posted yet</h3>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to post a blood donation camp!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {camps.map((camp) => (
                <div
                  key={camp._id}
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900">{camp.campName}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        <span className="font-medium">Organizer:</span> {camp.organizerName}
                      </p>
                      <div className="mt-2 space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Location:</span> {camp.city ? `${camp.city}, ` : ''}{camp.district}, {camp.state}
                        </p>
                        {camp.address && (
                          <p>
                            <span className="font-medium">Address:</span> {camp.address}
                          </p>
                        )}
                        <p>
                          <span className="font-medium">Date:</span>{' '}
                          {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : (camp.date ? new Date(camp.date).toLocaleDateString() : 'Unknown Date')}{' '}
                          to{' '}
                          {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : (camp.date ? new Date(camp.date).toLocaleDateString() : 'Unknown Date')}
                        </p>
                        <p>
                          <span className="font-medium">Time:</span>{' '}
                          {camp.startTime ? `${camp.startTime} to ${camp.endTime}` : (camp.time || 'Unknown Time')}
                        </p>
                        <p>
                          <span className="font-medium">Contact:</span> {camp.contactNumber}
                        </p>
                        {camp.description && (
                          <p>
                            <span className="font-medium">Description:</span> {camp.description}
                          </p>
                        )}
                      </div>
                    </div>
                    {user && camp.createdBy && (camp.createdBy._id === user._id || camp.createdBy === user._id) && (
                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => handleEdit(camp)}
                          className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm font-medium"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(camp._id)}
                          className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm font-medium"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Camps;
