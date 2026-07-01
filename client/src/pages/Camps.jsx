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
        const response = await api.post('/api/camps', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifiedCount = response.data.notifiedCount ?? 0;
        const warning = response.data.warning ? ` ${response.data.warning}` : '';
        setSuccess(
          `Camp posted successfully! ${notifiedCount} nearby users were notified within 100 km.${warning}`
        );
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">Blood Donation Camps</h1>
              <p className="text-gray-500 mt-1">Organize and find blood donation camps</p>
            </div>
          </div>
          <button onClick={() => {
            if (showForm) { setShowForm(false); setEditingId(null); setFormData({
              campName: '', organizerName: '', state: '', district: '', city: '', address: '',
              startDate: '', endDate: '', startTime: '', endTime: '', contactNumber: '', description: '',
            }); } else { setShowForm(true); }
          }} className="btn-primary flex items-center gap-2">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {showForm ? 'Cancel' : 'New Camp'}
          </button>
        </div>

        {success && (
          <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{success}</div>
        )}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium flex items-center gap-2 mb-6">
            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {error}
          </div>
        )}

        {showForm && (
          <div className="card p-8 mb-8 animate-fade-in">
            <h2 className="text-xl font-bold text-gray-900 font-display mb-6">
              {editingId ? 'Update Camp' : 'Post a New Blood Donation Camp'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="campName" className="block text-sm font-semibold text-gray-700 mb-1.5">Camp Name *</label>
                  <input type="text" id="campName" name="campName" value={formData.campName} onChange={handleChange}
                    className="input-field" placeholder="Enter camp name" />
                </div>
                <div>
                  <label htmlFor="organizerName" className="block text-sm font-semibold text-gray-700 mb-1.5">Organizer Name *</label>
                  <input type="text" id="organizerName" name="organizerName" value={formData.organizerName} onChange={handleChange}
                    className="input-field" placeholder="Enter organizer name" />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                  <select id="state" name="state" value={formData.state} onChange={handleChange} className="select-field">
                    <option value="">Select state</option>
                    {states.map((state) => (<option key={state} value={state}>{state}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="district" className="block text-sm font-semibold text-gray-700 mb-1.5">District *</label>
                  <select id="district" name="district" value={formData.district} onChange={handleChange}
                    disabled={!formData.state} className="select-field disabled:bg-gray-100">
                    <option value="">{formData.state ? 'Select district' : 'Select state first'}</option>
                    {districts.map((district) => (<option key={district} value={district}>{district}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1.5">City / Town</label>
                  <input type="text" id="city" name="city" value={formData.city} onChange={handleChange}
                    className="input-field" placeholder="Enter city or town" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 mb-1.5">Address</label>
                  <input type="text" id="address" name="address" value={formData.address} onChange={handleChange}
                    className="input-field" placeholder="Enter venue address" />
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 mb-1.5">Start Date *</label>
                  <input type="date" id="startDate" name="startDate" value={formData.startDate}
                    min={new Date().toISOString().split('T')[0]} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 mb-1.5">End Date *</label>
                  <input type="date" id="endDate" name="endDate" value={formData.endDate}
                    min={formData.startDate || new Date().toISOString().split('T')[0]} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 mb-1.5">Start Time *</label>
                  <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 mb-1.5">End Time *</label>
                  <input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleChange} className="input-field" />
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Number *</label>
                  <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber}
                    onChange={handleChange} className="input-field" placeholder="Enter contact number" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-1.5">Description</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3}
                    className="input-field" placeholder="Enter camp description" />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading ? 'Posting...' : (editingId ? 'Update Camp' : 'Post Camp')}
              </button>
            </form>
          </div>
        )}

        <div className="card p-8">
          <h2 className="text-xl font-bold text-gray-900 font-display mb-6">Upcoming Camps</h2>
          {camps.length === 0 ? (
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900">No camps posted yet</h3>
              <p className="text-gray-500 mt-1">Be the first to post a blood donation camp!</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {camps.map((camp) => (
                <div key={camp._id} className="group p-6 rounded-2xl border-2 border-gray-100 hover:border-red-200 hover:shadow-lg transition-all duration-300">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center">
                      <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    {user && camp.createdBy && (camp.createdBy._id === user._id || camp.createdBy === user._id) && (
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(camp)}
                          className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 text-xs font-semibold transition-all">Edit</button>
                        <button onClick={() => handleDelete(camp._id)}
                          className="px-3 py-1.5 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 text-xs font-semibold transition-all">Delete</button>
                      </div>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{camp.campName}</h3>
                  <p className="text-sm text-gray-500 mb-3">by {camp.organizerName}</p>
                  <div className="space-y-1.5 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      </svg>
                      {camp.city ? `${camp.city}, ` : ''}{camp.district}, {camp.state}
                    </p>
                    {camp.address && <p className="flex items-center gap-2"><svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>{camp.address}</p>}
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      {camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'N/A'} - {camp.endDate ? new Date(camp.endDate).toLocaleDateString() : 'N/A'}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {camp.startTime || ''} - {camp.endTime || ''}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {camp.contactNumber}
                    </p>
                    {camp.description && <p className="pt-1 text-gray-500 italic">"{camp.description}"</p>}
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
