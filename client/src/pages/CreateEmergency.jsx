import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const CreateEmergency = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    patientName: '',
    bloodGroup: '',
    hospital: '',
    contactNumber: '',
    notes: '',
    useCurrentLocation: true,
  });

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    // Validation
    if (!formData.patientName || !formData.bloodGroup || !formData.hospital || !formData.contactNumber) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    // Check if user has location set when using current location
    if (formData.useCurrentLocation) {
      if (!user?.location || user.location.coordinates[0] === 0 || user.location.coordinates[1] === 0) {
        setError('Please set your location first or uncheck "Use my current location"');
        setLoading(false);
        return;
      }
    }

    try {
      const requestData = {
        patientName: formData.patientName,
        bloodGroup: formData.bloodGroup,
        hospital: formData.hospital,
        contactNumber: formData.contactNumber,
        notes: formData.notes,
      };

      if (!formData.useCurrentLocation) {
        // Would need to add manual location input fields
        // For now, we'll use the user's stored location
        if (!user?.location || user.location.coordinates[0] === 0 || user.location.coordinates[1] === 0) {
          setError('Please set your location first');
          setLoading(false);
          return;
        }
      }

      const response = await api.post('/api/emergency', requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess('Emergency request created successfully!');
      setLoading(false);

      setTimeout(() => {
        navigate('/emergency-requests');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to create emergency request');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-2xl mx-auto relative animate-fade-in">
        <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">Emergency Request</h1>
              <p className="text-gray-500 mt-1">Post an urgent blood donation request</p>
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
          {success && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{success}</div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="patientName" className="block text-sm font-semibold text-gray-700 mb-1.5">Patient Name *</label>
                <input type="text" id="patientName" name="patientName" value={formData.patientName}
                  onChange={handleChange} className="input-field" placeholder="Enter patient name" />
              </div>
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-1.5">Blood Group *</label>
                <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="select-field">
                  <option value="">Select blood group</option>
                  {bloodGroups.map((group) => (<option key={group} value={group}>{group}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="hospital" className="block text-sm font-semibold text-gray-700 mb-1.5">Hospital Name *</label>
                <input type="text" id="hospital" name="hospital" value={formData.hospital}
                  onChange={handleChange} className="input-field" placeholder="Enter hospital name" />
              </div>
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">Contact Number *</label>
                <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber}
                  onChange={handleChange} className="input-field" placeholder="Enter contact number" />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1.5">Additional Notes</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3}
                className="input-field" placeholder="Any additional information (optional)" />
            </div>

            <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-red-200 cursor-pointer transition-all">
              <input type="checkbox" id="useCurrentLocation" name="useCurrentLocation" checked={formData.useCurrentLocation}
                onChange={handleChange} className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
              <div>
                <span className="text-sm font-semibold text-gray-900">Use my current location (from profile)</span>
                <p className="text-xs text-gray-500 mt-0.5">Helps match you with nearby donors</p>
              </div>
            </label>

            <div className="flex gap-4 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Creating...' : 'Create Request'}
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">Cancel</button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-xl border-2 border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong className="font-semibold">Important:</strong> This is an emergency request. Please ensure all information is accurate. Your request will be visible to nearby donors with matching blood groups.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateEmergency;
