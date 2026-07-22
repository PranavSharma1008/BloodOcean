import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import api from '../api/axios';

const UpdateEmergency = () => {
  const { user, token } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
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

  useEffect(() => {
    fetchRequest();
  }, [id]);

  const fetchRequest = async () => {
    try {
      const response = await api.get(`/api/emergency/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const request = response.data.emergencyRequest;
      setFormData({
        patientName: request.patientName,
        bloodGroup: request.bloodGroup,
        hospital: request.hospital,
        contactNumber: request.contactNumber,
        notes: request.notes || '',
        useCurrentLocation: true,
      });
      setFetchLoading(false);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to fetch request'));
      setFetchLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, contactNumber: digitsOnly });
      return;
    }
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
      setError(t('Please fill in all required fields'));
      setLoading(false);
      return;
    }

    if (formData.contactNumber.length !== 10) {
      setError(t('Contact number must be exactly 10 digits'));
      setLoading(false);
      return;
    }

    try {
      const requestData = {
        patientName: formData.patientName,
        bloodGroup: formData.bloodGroup,
        hospital: formData.hospital,
        contactNumber: formData.contactNumber,
        notes: formData.notes,
      };

      const response = await api.put(`/api/emergency/${id}`, requestData, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setSuccess(t('Emergency request updated successfully!'));
      setLoading(false);

      setTimeout(() => {
        navigate('/emergency-requests');
      }, 1500);
    } catch (error) {
      setError(error.response?.data?.message || t('Failed to update emergency request'));
      setLoading(false);
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-10 w-10 border-4 border-red-200 border-t-red-600"></div>
          <p className="mt-4 text-gray-500 font-medium">{t('Loading request...')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-12 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-2xl mx-auto relative animate-fade-in">
        <div className="card p-8 sm:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
              <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Update Request')}</h1>
              <p className="text-gray-500 mt-1">{t('Update the emergency blood donation request details')}</p>
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
                <label htmlFor="patientName" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Patient Name *')}</label>
                <input type="text" id="patientName" name="patientName" value={formData.patientName}
                  onChange={handleChange} className="input-field" placeholder={t('Enter patient name')} />
              </div>
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Blood Group *')}</label>
                <select id="bloodGroup" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} className="select-field">
                  <option value="">{t('Select blood group')}</option>
                  {bloodGroups.map((group) => (<option key={group} value={group}>{group}</option>))}
                </select>
              </div>
              <div>
                <label htmlFor="hospital" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Hospital Name *')}</label>
                <input type="text" id="hospital" name="hospital" value={formData.hospital}
                  onChange={handleChange} className="input-field" placeholder={t('Enter hospital name')} />
              </div>
              <div>
                <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Contact Number *')}</label>
                <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber}
                  onChange={handleChange} className="input-field" placeholder={t('Enter contact number')} />
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Additional Notes')}</label>
              <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} rows={3}
                className="input-field" placeholder={t('Any additional information (optional)')} />
            </div>

            <div className="flex gap-4 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? t('Updating...') : t('Update Request')}
              </button>
              <button type="button" onClick={() => navigate('/emergency-requests')} className="btn-secondary flex-1">{t('Cancel')}</button>
            </div>
          </form>

          <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-yellow-100/50 rounded-xl border-2 border-yellow-200">
            <p className="text-sm text-yellow-800">
              <strong className="font-semibold">{t('Important:')}</strong> {t('Please ensure all information is accurate before updating.')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UpdateEmergency;
