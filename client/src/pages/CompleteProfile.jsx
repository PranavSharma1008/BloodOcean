import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import AvatarUpload from '../components/AvatarUpload';
import { getStates, getDistricts, normalizeDistrict, getTranslatedState, getTranslatedDistrict } from '../data/locations';
import { useLanguage } from '../context/LanguageContext';

const CompleteProfile = () => {
  const { user, updateProfile, removeAvatar } = useAuth();
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
    age: '',
    gender: '',
    religion: '',
    disease: '',
    hasDisease: false,
    unitsCanDonate: 1,
    bloodCharges: 0,
    freeBlood: true,
  });

  const states = getStates();
  const districts = getDistricts(formData.state);
  const { t, lang } = useLanguage();

  useEffect(() => {
    if (user) {
      const diseaseStr = typeof user.disease === 'string' ? user.disease : '';
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        bloodGroup: user.bloodGroup || '',
        state: user.state || 'Himachal Pradesh',
        district: normalizeDistrict(user.state || 'Himachal Pradesh', user.district || ''),
        city: user.city || '',
        available: user.available || false,
        age: user.age || '',
        gender: user.gender || '',
        religion: user.religion || '',
        disease: diseaseStr,
        hasDisease: !!(diseaseStr && diseaseStr.trim() !== ''),
        unitsCanDonate: user.unitsCanDonate || 1,
        bloodCharges: user.bloodCharges || 0,
        freeBlood: !user.bloodCharges || user.bloodCharges === 0,
      });
    }
  }, [user]);

  const [showDiseasePopup, setShowDiseasePopup] = useState(false);
  const [pendingDiseaseValue, setPendingDiseaseValue] = useState('');

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === 'state') {
      setFormData({ ...formData, state: value, district: '' });
      return;
    }
    if (name === 'freeBlood') {
      setFormData({ ...formData, freeBlood: checked, bloodCharges: checked ? 0 : formData.bloodCharges });
      return;
    }
    if (name === 'phone') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, phone: digitsOnly });
      return;
    }
    setFormData({ ...formData, [name]: type === 'checkbox' ? checked : value });
  };

  const confirmDiseaseYes = () => {
    setFormData({ ...formData, hasDisease: true, disease: pendingDiseaseValue });
    setShowDiseasePopup(false);
    setPendingDiseaseValue('');
  };

  const cancelDiseaseYes = () => {
    setShowDiseasePopup(false);
    setPendingDiseaseValue('');
  };

  const handleRemoveAvatar = async () => {
    const result = await removeAvatar();
    if (result.success) {
      setError('');
    } else {
      setError(result.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) { setError(t('Name is required')); setLoading(false); return; }
    if (!formData.phone.trim()) { setError(t('Phone number is required')); setLoading(false); return; }
    if (!formData.bloodGroup) { setError(t('Blood group is required')); setLoading(false); return; }
    if (!formData.state) { setError(t('State is required')); setLoading(false); return; }
    if (!formData.district) { setError(t('District is required')); setLoading(false); return; }
    if (!formData.city.trim()) { setError(t('City/Town is required')); setLoading(false); return; }
    if (!formData.age || Number(formData.age) < 18 || Number(formData.age) > 65) { setError(t('Age must be between 18 and 65')); setLoading(false); return; }
    if (!formData.gender) { setError(t('Gender is required')); setLoading(false); return; }
    if (!formData.religion.trim()) { setError(t('Religion is required')); setLoading(false); return; }
    if (!formData.unitsCanDonate || Number(formData.unitsCanDonate) < 1) { setError(t('Units to donate must be at least 1')); setLoading(false); return; }

    const result = await updateProfile(formData);
    setLoading(false);
    if (result.success) { navigate('/dashboard'); }
    else { setError(result.message); }
  };

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-12 px-4 sm:px-6 lg:px-8 relative">
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
                {user?.profileCompleted ? t('Edit Profile') : t('Complete Your Profile')}
              </h1>
              <p className="text-gray-500 mt-1">{t('Provide your donor information to help others find you')}</p>
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
            <div className="mb-6 pb-6 border-b-2 border-gray-100 flex items-center justify-between">
              <AvatarUpload />
              {user?.avatar && (
                <button type="button" onClick={handleRemoveAvatar}
                  className="ml-4 px-4 py-2 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-all">
                  {t('Remove Photo')}
                </button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Full Name *')}</label>
                <input type="text" id="name" name="name" required value={formData.name} onChange={handleChange}
                  className="input-field" placeholder={t('Enter your full name')} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Phone Number *')}</label>
                <input type="tel" id="phone" name="phone" required value={formData.phone} onChange={handleChange}
                  className="input-field" placeholder={t('Enter your phone number')} />
              </div>
              <div>
                <label htmlFor="bloodGroup" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Blood Group *')}</label>
                <select id="bloodGroup" name="bloodGroup" required value={formData.bloodGroup} onChange={handleChange}
                  className="select-field">
                  <option value="">{t('Select your blood group')}</option>
                  {bloodGroups.map((group) => (
                    <option key={group} value={group}>{group}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="state" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('State *')}</label>
                <select id="state" name="state" required value={formData.state} onChange={handleChange}
                  className="select-field">
                  <option value="">{t('Select state')}</option>
                  {states.map((state) => (
                    <option key={state} value={state}>{getTranslatedState(state, lang)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="district" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('District *')}</label>
                <select id="district" name="district" required value={formData.district} onChange={handleChange}
                  disabled={!formData.state} className="select-field disabled:bg-gray-100 disabled:cursor-not-allowed">
                  <option value="">{formData.state ? t('Select district') : t('Select state first')}</option>
                  {districts.map((district) => (
                    <option key={district} value={district}>{getTranslatedDistrict(district, lang)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="city" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('City / Town *')}</label>
                <input type="text" id="city" name="city" required value={formData.city} onChange={handleChange}
                  disabled={!formData.district} className="input-field disabled:bg-gray-100 disabled:cursor-not-allowed"
                  placeholder={t('Enter your city or town')} />
              </div>
              <div>
                <label htmlFor="age" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Age *')}</label>
                <input type="number" id="age" name="age" required min="18" max="65" value={formData.age} onChange={handleChange}
                  className="input-field" placeholder={t('Enter your age')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Gender *')}</label>
                <div className="flex gap-2">
                  {['male', 'female', 'others'].map((g) => (
                    <button key={g} type="button" onClick={() => setFormData({ ...formData, gender: g })}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold capitalize transition-all ${
                        formData.gender === g
                          ? 'border-red-500 bg-red-50 text-red-700 shadow-sm'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}>
                      {t(g)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="religion" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Religion *')}</label>
                <select id="religion" name="religion" required value={formData.religion} onChange={handleChange}
                  className="select-field">
                  <option value="">{t('Select your religion')}</option>
                  <option value="Hindu">{t('Hindu')}</option>
                  <option value="Muslim">{t('Muslim')}</option>
                  <option value="Christian">{t('Christian')}</option>
                  <option value="Sikh">{t('Sikh')}</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Do you have any disease? *')}</label>
                <div className="flex gap-2">
                  {['yes', 'no'].map((option) => (
                    <button key={option} type="button" onClick={() => {
                      if (option === 'yes') {
                        setPendingDiseaseValue('yes');
                        setShowDiseasePopup(true);
                      } else {
                        setFormData({ ...formData, hasDisease: false, disease: '' });
                      }
                    }}
                      className={`flex-1 py-2.5 rounded-xl border-2 text-sm font-bold capitalize transition-all ${
                        formData.hasDisease ? (option === 'yes' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 text-gray-400') : (option === 'no' ? 'border-red-500 bg-red-50 text-red-700 shadow-sm' : 'border-gray-200 text-gray-600 hover:border-gray-300')
                      }`}>
                      {t(option)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label htmlFor="unitsCanDonate" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Units Can Donate *')}</label>
                <input type="number" id="unitsCanDonate" name="unitsCanDonate" required min="1" value={formData.unitsCanDonate} onChange={handleChange}
                  className="input-field" placeholder={t('How many units can you donate?')} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Blood Charges')}</label>
                <label className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border-2 border-gray-200 cursor-pointer transition-all">
                  <input type="checkbox" id="freeBlood" name="freeBlood" checked={formData.freeBlood} onChange={handleChange}
                    className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
                  <div>
                    <span className="text-sm font-semibold text-gray-900">{t('Donate blood for free')}</span>
                    <p className="text-xs text-gray-500 mt-0.5">{t('Uncheck if you charge for blood')}</p>
                  </div>
                </label>
                {!formData.freeBlood && (
                  <div className="mt-3">
                    <label htmlFor="bloodCharges" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Amount per Unit')}</label>
                    <input type="number" id="bloodCharges" name="bloodCharges" min="0" value={formData.bloodCharges} onChange={handleChange}
                      className="input-field" placeholder={t('Enter amount')} />
                  </div>
                )}
              </div>
            </div>

            {showDiseasePopup && (
              <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
                <div className="bg-white rounded-2xl p-6 max-w-md mx-4 shadow-2xl shadow-red-900/20 animate-slide-up">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                      <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 20 20" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{t('Medical Condition Notice')}</h3>
                  </div>
                  <p className="text-gray-600 mb-4">
                    {t("Sorry, we don't accept the disease blood for donation. If you have a medical condition, you will not be able to donate blood and your availability will be turned off.")}
                  </p>
                  <p className="text-sm text-gray-500 mb-6">
                    {t('Are you sure you have a disease or medical condition?')}
                  </p>
                  <div className="flex gap-3">
                    <button onClick={confirmDiseaseYes} className="btn-primary flex-1 text-sm py-3">
                      {t('Yes, I have a disease')}
                    </button>
                    <button onClick={cancelDiseaseYes} className="btn-secondary flex-1 text-sm py-3">
                      {t("No, I don't")}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <label className={`flex items-center gap-3 p-4 rounded-xl border-2 transition-all ${typeof formData.disease === 'string' && formData.disease.trim() !== '' ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-70' : 'bg-gray-50 border-gray-200 hover:border-red-200 cursor-pointer'}`}>
              <input type="checkbox" id="available" name="available" checked={formData.available} onChange={handleChange}
                disabled={typeof formData.disease === 'string' && formData.disease.trim() !== ''}
                className="w-5 h-5 text-red-600 focus:ring-red-500 border-gray-300 rounded" />
              <div>
                <span className="text-sm font-semibold text-gray-900">{t('I am available to donate blood')}</span>
                <p className="text-xs text-gray-500 mt-0.5">
                  {typeof formData.disease === 'string' && formData.disease.trim() !== '' ? t('You cannot donate due to medical condition') : t("Toggle this when you're ready to donate")}
                </p>
              </div>
            </label>

            <div className="flex gap-4 pt-2">
              <button type="submit" disabled={loading} className="btn-primary flex-1">
                {loading ? t('Saving...') : t('Save Profile')}
              </button>
              <button type="button" onClick={() => navigate('/dashboard')} className="btn-secondary flex-1">
                {t('Cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CompleteProfile;
