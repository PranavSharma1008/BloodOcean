import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarUpload from '../components/AvatarUpload';
import { getStates, getDistricts, normalizeDistrict } from '../data/locations';

const CompleteProfile = () => {
  const { user, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    bloodGroup: '',
    state: '',
    district: '',
    city: '',
    available: false,
  });

  const states = getStates();
  const districts = getDistricts(formData.state);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bloodGroup: user.bloodGroup || '',
        state: user.state || 'Himachal Pradesh',
        district: normalizeDistrict(user.state || 'Himachal Pradesh', user.district || ''),
        city: user.city || '',
        available: user.available || false,
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'state') {
      setFormData({ ...formData, state: value, district: '' });
      return;
    }
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) { setError('Name is required'); setLoading(false); return; }
    if (!formData.phone.trim()) { setError('Phone number is required'); setLoading(false); return; }
    if (!formData.bloodGroup) { setError('Blood group is required'); setLoading(false); return; }
    if (!formData.state) { setError('State is required'); setLoading(false); return; }
    if (!formData.district) { setError('District is required'); setLoading(false); return; }
    if (!formData.city.trim()) { setError('City/Town is required'); setLoading(false); return; }

    const result = await updateProfile(formData);
    setLoading(false);
    if (result.success) { navigate('/dashboard'); }
    else { setError(result.message); }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-red-50/30 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-2xl mx-auto relative animate-fade-in">
        <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">
                {user?.profileCompleted ? 'Edit Profile' : 'Complete Your Profile'}
              </h1>
              <p className="text-gray-500 mt-1">Provide your donor information to help others find you</p>
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

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="mb-6 pb-6 border-b-2 border-gray-100">
              <AvatarUpload />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name *</label>
                <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange}
                  className="input-field" placeholder="Enter your full name" />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">Phone Number *</label>
                <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange}
                  className="input-field" placeholder="Enter your phone number" />
              </div>
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-1.5">Blood Group *</label>
                <select id="bloodGroup" name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange}
                  className="select-field">
                  <option value="">Select your blood group</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1.5">State *</label>
                <select id="state" name="state" required value={formData.state} onChange={handleChange}
                  className="select-field">
                  <option value="">Select state</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{state}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-semibold text-gray-700 mb-1.5">District *</label>
                <select id="district" name="district" required value={formData.district} onChange={handleChange}
                  disabled={!formData.state} className="select-field disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">{formData.state ? 'Select district' : 'Select state first'}</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>{district}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1.5">City / Town *</label>
                <input type="text" id="city" name="city" required value={formData.city} onChange={handleChange}
                  disabled={!formData.district} className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder="Enter your city or town" />
              </div>
            </div>

            <label className="flex items-center gap-3 p-4 rounded-xl bg-gray-50 border-2 border-gray-200 hover:border-red-200 cursor-pointer transition-all">
              <input type="checkbox" id="available" name="available" checked={formData.available} onChange={handleChange}
                className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
              <div>
                <span className="text-sm font-semibold text-gray-900">I am available to donate blood</span>
                <p className="text-xs text-gray-500 mt-0.5">Toggle this when you're ready to donate</p>
              </div>
            </label>

            <div className="flex gap-4 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? 'Saving...' : 'Save Profile'}
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
