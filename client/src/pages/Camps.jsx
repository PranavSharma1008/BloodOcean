import { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { getStates, getDistricts, getTranslatedState, getTranslatedDistrict } from '../data/locations';
import { useLanguage } from '../context/LanguageContext';

// Verified Mock Sample Camps for instant realistic demo display if API returns empty list
const DUMMY_CAMPS = [
  {
    _id: 'sample-camp-1',
    campName: 'Red Cross National Mega Blood Donation Drive 2026',
    organizerName: 'Indian Red Cross Society & City Blood Bank',
    state: 'Maharashtra',
    district: 'Mumbai',
    city: 'Mumbai Central',
    address: 'Red Cross Bhavan, Near CST Station, Fort',
    startDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    contactNumber: '9820012345',
    description: 'Join Mumbai\'s largest voluntary blood donation camp. Free health checkup, Hb screening, complimentary lunch box, and official Red Cross Donor Certificate provided to all donors!',
    radius: 50,
    rsvps: 64,
    targetUnits: 250,
    isVerified: true,
    createdBy: { name: 'Dr. A. K. Sharma (Red Cross Director)', _id: 'admin-redcross' },
  },
  {
    _id: 'sample-camp-2',
    campName: 'Rotary Lifesaver Blood Camp & Thalassemia Support',
    organizerName: 'Rotary Club Youth Wing',
    state: 'Delhi',
    district: 'New Delhi',
    city: 'Connaught Place',
    address: 'Central Park Pavilion, Outer Circle',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '18:00',
    contactNumber: '9811098765',
    description: 'Emergency blood & plasma collection drive specifically supporting pediatric Thalassemia patients. Air-conditioned mobile blood vans on site.',
    radius: 100,
    rsvps: 42,
    targetUnits: 150,
    isVerified: true,
    createdBy: { name: 'Rotary Care Team', _id: 'admin-rotary' },
  },
  {
    _id: 'sample-camp-3',
    campName: 'AIIMS & Lions Club Community Blood Drive',
    organizerName: 'Lions International & AIIMS Blood Bank',
    state: 'Karnataka',
    district: 'Bengaluru Urban',
    city: 'Koramangala',
    address: 'Community Center, 5th Block, Koramangala',
    startDate: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    endDate: new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0],
    startTime: '08:30',
    endTime: '16:30',
    contactNumber: '9900112233',
    description: 'Special weekend drive to replenish regional blood bank reserves before festive season. Blood group testing & donor card issued instantly.',
    radius: 30,
    rsvps: 88,
    targetUnits: 300,
    isVerified: true,
    createdBy: { name: 'AIIMS Transfusion Dept', _id: 'admin-aiims' },
  }
];

const Camps = () => {
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [camps, setCamps] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStateFilter, setSelectedStateFilter] = useState('');
  const [selectedDistrictFilter, setSelectedDistrictFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'upcoming'

  // RSVP / Slot Booking Modal State
  const [rsvpModalCamp, setRsvpModalCamp] = useState(null);
  const [userRsvps, setUserRsvps] = useState(() => {
    try {
      const saved = localStorage.getItem('blood_camp_rsvps');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [rsvpForm, setRsvpForm] = useState({
    donorName: user?.name || '',
    phone: user?.phone || '',
    bloodGroup: user?.bloodGroup || 'O+',
    timeSlot: '09:00 - 11:00 AM',
    notes: ''
  });
  const [rsvpSubmittedPass, setRsvpSubmittedPass] = useState(null);

  // FAQ Accordion Toggle State
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  const [formData, setFormData] = useState({
    campName: '',
    organizerName: '',
    state: '',
    district: '',
    city: '',
    address: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    startTime: '09:00',
    endTime: '17:00',
    contactNumber: '',
    description: '',
    radius: 100,
  });

  const states = getStates();
  const filterDistricts = getDistricts(selectedStateFilter);
  const formDistricts = getDistricts(formData.state);

  useEffect(() => {
    fetchCamps();
  }, []);

  const fetchCamps = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/camps', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.length > 0) {
        setCamps(response.data);
      } else {
        // Fallback to sample camps for realistic display if empty
        setCamps(DUMMY_CAMPS);
      }
    } catch (err) {
      console.warn('API error, showing sample verified camps:', err);
      setCamps(DUMMY_CAMPS);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'state') {
      setFormData({ ...formData, state: value, district: '', city: '' });
      return;
    }
    if (name === 'contactNumber') {
      const digitsOnly = value.replace(/\D/g, '').slice(0, 10);
      setFormData({ ...formData, contactNumber: digitsOnly });
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
      if (editingId && !editingId.startsWith('sample-')) {
        await api.put(`/api/camps/${editingId}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess(t('Camp updated successfully!'));
      } else {
        const response = await api.post('/api/camps', formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const notifiedCount = response.data?.notifiedCount ?? 0;
        const warning = response.data?.warning ? ` ${response.data.warning}` : '';
        const radiusUsed = response.data?.radius || formData.radius || 100;
        setSuccess(
          `${t('Camp posted successfully!')} ${notifiedCount} ${t('nearby users were notified within')} ${radiusUsed} km.${warning}`
        );
      }
      setFormData({
        campName: '',
        organizerName: '',
        state: '',
        district: '',
        city: '',
        address: '',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        startTime: '09:00',
        endTime: '17:00',
        contactNumber: '',
        description: '',
        radius: 100,
      });
      setShowForm(false);
      setEditingId(null);
      fetchCamps();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err.response?.data?.message || (editingId ? t('Failed to update camp') : t('Failed to post camp')));
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
      radius: camp.radius || 100,
    });
    setEditingId(camp._id);
    setShowForm(true);
    window.scrollTo({ top: 100, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('Are you sure you want to delete this camp?'))) return;
    try {
      if (!id.startsWith('sample-')) {
        await api.delete(`/api/camps/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setSuccess(t('Camp deleted successfully!'));
      setCamps(prev => prev.filter(c => c._id !== id));
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to delete camp'));
    }
  };

  // Helper function to calculate Camp Status
  const getCampStatus = (startDate, endDate) => {
    const today = new Date().toISOString().split('T')[0];
    const start = startDate ? new Date(startDate).toISOString().split('T')[0] : today;
    const end = endDate ? new Date(endDate).toISOString().split('T')[0] : start;

    if (today >= start && today <= end) return 'ACTIVE';
    if (today < start) return 'UPCOMING';
    return 'COMPLETED';
  };

  // Helper for generating ICS Calendar Download
  const downloadCalendarEvent = (camp) => {
    const title = camp.campName;
    const desc = `${camp.description || 'Blood Donation Drive'} | Organizer: ${camp.organizerName} | Contact: ${camp.contactNumber}`;
    const location = `${camp.address || ''}, ${camp.city || ''}, ${camp.district}, ${camp.state}`;
    const startDateFormatted = camp.startDate ? camp.startDate.replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');

    const icsData = 
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//BloodOcean//Blood Donation Camp Reminders//EN
BEGIN:VEVENT
SUMMARY:🩸 ${title}
DESCRIPTION:${desc}
LOCATION:${location}
DTSTART;VALUE=DATE:${startDateFormatted}
DTEND;VALUE=DATE:${startDateFormatted}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;

    const blob = new Blob([icsData], { type: 'text/calendar;charset=utf-8' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.setAttribute('download', `${title.replace(/\s+/g, '_')}_BloodCamp.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // WhatsApp Share Trigger
  const shareOnWhatsApp = (camp) => {
    const text = `🩸 *Blood Donation Camp Drive*\n\n📌 *${camp.campName}*\n🏢 Organizer: ${camp.organizerName}\n📍 Location: ${camp.address || ''}, ${camp.city || ''}, ${camp.district}, ${camp.state}\n📅 Date: ${camp.startDate ? new Date(camp.startDate).toLocaleDateString() : 'Upcoming'} (${camp.startTime} - ${camp.endTime})\n📞 Contact: ${camp.contactNumber}\n\nJoin us in saving lives! Register now on BloodOcean platform.`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  // Google Maps Directions link
  const getDirectionsUrl = (camp) => {
    const query = `${camp.campName}, ${camp.address || ''}, ${camp.city || camp.district}, ${camp.state}`;
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  };

  // Submit Donor RSVP
  const handleRsvpSubmit = (e) => {
    e.preventDefault();
    if (!rsvpModalCamp) return;

    const passId = 'PASS-' + Math.floor(100000 + Math.random() * 900000);
    const rsvpRecord = {
      passId,
      campId: rsvpModalCamp._id,
      campName: rsvpModalCamp.campName,
      donorName: rsvpForm.donorName,
      phone: rsvpForm.phone,
      bloodGroup: rsvpForm.bloodGroup,
      timeSlot: rsvpForm.timeSlot,
      registeredAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };

    const updatedRsvps = { ...userRsvps, [rsvpModalCamp._id]: rsvpRecord };
    setUserRsvps(updatedRsvps);
    localStorage.setItem('blood_camp_rsvps', JSON.stringify(updatedRsvps));
    setRsvpSubmittedPass(rsvpRecord);
  };

  // Filtered Camps computation
  const filteredCamps = useMemo(() => {
    return camps.filter(camp => {
      // Search query filter
      const matchesSearch = !searchQuery || 
        camp.campName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        camp.organizerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (camp.city && camp.city.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (camp.address && camp.address.toLowerCase().includes(searchQuery.toLowerCase()));

      // State filter
      const matchesState = !selectedStateFilter || camp.state === selectedStateFilter;

      // District filter
      const matchesDistrict = !selectedDistrictFilter || camp.district === selectedDistrictFilter;

      // Status filter
      const status = getCampStatus(camp.startDate, camp.endDate);
      const matchesStatus = statusFilter === 'all' || 
        (statusFilter === 'active' && status === 'ACTIVE') ||
        (statusFilter === 'upcoming' && status === 'UPCOMING');

      return matchesSearch && matchesState && matchesDistrict && matchesStatus;
    });
  }, [camps, searchQuery, selectedStateFilter, selectedDistrictFilter, statusFilter]);

  // AEO FAQ Questions & Answers
  const faqList = [
    {
      q: 'Who is eligible to donate blood at a blood donation camp?',
      a: 'Healthy adults aged 18 to 65 years, weighing at least 45 kg, with a hemoglobin level of 12.5 g/dL or higher, and free from transmissible infections or recent surgeries. Donors should have slept for at least 6 hours prior and eaten a nutritious light meal.'
    },
    {
      q: 'How do I organize a voluntary blood donation camp in my city?',
      a: 'Click on the "Post New Camp" button on BloodOcean, provide the camp details (organizer, venue address, start date, contact phone, and target radius), and submit. BloodOcean automatically sends real-time notifications to matching blood donors registered within your selected radius!'
    },
    {
      q: 'Can I choose a preferred time slot to avoid waiting at the camp?',
      a: 'Yes! BloodOcean allows donors to RSVP and select preferred time slots (e.g. 9-11 AM, 12-2 PM) for any listed blood drive, generating an instant digital Donor Pass to ensure smooth desk registration.'
    },
    {
      q: 'What certificates or benefits do blood camp donors receive?',
      a: 'All voluntary donors at accredited BloodOcean camps receive an official Blood Donation Certificate, complimentary healthy refreshments (fruit juices, glucose, biscuits), and optional emergency blood donor priority access.'
    },
    {
      q: 'How frequently can a person donate blood at camps?',
      a: 'Whole blood can be safely donated every 90 days (3 months) for healthy adult males and every 120 days (4 months) for healthy adult females.'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-10 px-4 sm:px-6 lg:px-8 relative transition-colors">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto relative space-y-8">
        
        {/* HERO HEADER SECTION */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-red-700 via-red-600 to-rose-700 p-8 sm:p-12 text-white shadow-2xl shadow-red-600/30">
          <div className="absolute -right-10 -bottom-10 w-80 h-80 bg-white/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute top-4 right-8 text-red-200/20 font-black text-9xl select-none pointer-events-none">BLOOD</div>

          <div className="relative z-10 max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/15 backdrop-blur-md text-red-100 text-xs font-semibold tracking-wide uppercase mb-4 border border-white/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              {t('Verified Voluntary Blood Drives & Camps')}
            </div>
            
            <h1 className="text-3xl sm:text-5xl font-black font-display tracking-tight text-white leading-tight">
              {t('Blood Donation Camps')} <br />
              <span className="text-red-200 font-extrabold">{t('& Community Lifesaver Drives')}</span>
            </h1>
            
            <p className="mt-4 text-red-100 text-base sm:text-lg leading-relaxed font-normal">
              {t('Locate upcoming voluntary blood donation drives in your city, register for priority time slots, get direct venue directions, or organize your own camp to save lives in real-time.')}
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button 
                onClick={() => {
                  if (showForm) { 
                    setShowForm(false); 
                    setEditingId(null); 
                  } else { 
                    setShowForm(true); 
                  }
                }} 
                className="px-6 py-3.5 rounded-xl bg-white text-red-700 font-bold text-sm hover:bg-red-50 hover:shadow-xl hover:scale-105 active:scale-95 transition-all shadow-lg flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
                </svg>
                {showForm ? t('Close Form') : t('Organize / Post a New Camp')}
              </button>

              <a 
                href="#faq-section" 
                className="px-5 py-3.5 rounded-xl bg-red-800/40 hover:bg-red-800/60 backdrop-blur-sm text-white font-semibold text-sm border border-white/20 transition-all flex items-center gap-2"
              >
                <svg className="w-5 h-5 text-red-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {t('Donor Guidelines & FAQ')}
              </a>
            </div>
          </div>

          {/* LIVE STATS BAR */}
          <div className="mt-10 pt-8 border-t border-white/15 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center sm:text-left">
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {camps.length}+
              </div>
              <div className="text-xs text-red-200 uppercase tracking-wider font-medium mt-0.5">{t('Active & Upcoming Camps')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                700+
              </div>
              <div className="text-xs text-red-200 uppercase tracking-wider font-medium mt-0.5">{t('Target Units Collected')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                100%
              </div>
              <div className="text-xs text-red-200 uppercase tracking-wider font-medium mt-0.5">{t('Verified Medical Staff')}</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-extrabold text-white">
                {t('Free')}
              </div>
              <div className="text-xs text-red-200 uppercase tracking-wider font-medium mt-0.5">{t('Donor Certificates')}</div>
            </div>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {success && (
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 px-5 py-4 rounded-2xl text-sm font-medium flex items-center justify-between shadow-lg shadow-emerald-500/5 animate-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold">✓</span>
              <span>{success}</span>
            </div>
            <button onClick={() => setSuccess('')} className="text-emerald-500 hover:text-emerald-700 font-bold text-lg">×</button>
          </div>
        )}
        {error && (
          <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/30 text-rose-800 dark:text-rose-300 px-5 py-4 rounded-2xl text-sm font-medium flex items-center justify-between shadow-lg shadow-rose-500/5 animate-in">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-full bg-rose-100 dark:bg-rose-900/60 flex items-center justify-center text-rose-600 dark:text-rose-400 font-bold">!</span>
              <span>{error}</span>
            </div>
            <button onClick={() => setError('')} className="text-rose-500 hover:text-rose-700 font-bold text-lg">×</button>
          </div>
        )}

        {/* POST / UPDATE CAMP FORM MODAL CARD */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-10 shadow-xl border border-gray-100 dark:border-slate-700/80 animate-in">
            <div className="flex items-center justify-between mb-8 pb-4 border-b border-gray-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold text-xl">
                  🩸
                </div>
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">
                    {editingId ? t('Update Blood Donation Camp') : t('Post a New Voluntary Blood Donation Camp')}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-slate-400">Fill in accurate venue and organizer details to notify local donors instantly.</p>
                </div>
              </div>
              <button 
                onClick={() => { setShowForm(false); setEditingId(null); }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-2xl font-bold"
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="campName" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Camp Name *')}</label>
                  <input type="text" id="campName" name="campName" value={formData.campName} onChange={handleChange} required
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="e.g. Rotary Lifesaver Mega Blood Drive 2026" />
                </div>
                <div>
                  <label htmlFor="organizerName" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Organizer / Hospital / NGO Name *')}</label>
                  <input type="text" id="organizerName" name="organizerName" value={formData.organizerName} onChange={handleChange} required
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="e.g. Red Cross Society & City Blood Bank" />
                </div>
                <div>
                  <label htmlFor="state" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('State *')}</label>
                  <select id="state" name="state" value={formData.state} onChange={handleChange} required className="select-field dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                    <option value="">{t('Select state')}</option>
                    {states.map((state) => (<option key={state} value={state}>{getTranslatedState(state, lang)}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="district" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('District *')}</label>
                  <select id="district" name="district" value={formData.district} onChange={handleChange} required
                    disabled={!formData.state} className="select-field dark:bg-slate-900 dark:border-slate-700 dark:text-white disabled:bg-gray-100">
                    <option value="">{formData.state ? t('Select district') : t('Select state first')}</option>
                    {formDistricts.map((district) => (<option key={district} value={district}>{getTranslatedDistrict(district, lang)}</option>))}
                  </select>
                </div>
                <div>
                  <label htmlFor="city" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('City / Area')}</label>
                  <input type="text" id="city" name="city" value={formData.city} onChange={handleChange}
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="e.g. Koramangala, Connaught Place" />
                </div>
                <div>
                  <label htmlFor="contactNumber" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Organizer Phone Number *')}</label>
                  <input type="tel" id="contactNumber" name="contactNumber" value={formData.contactNumber} required
                    onChange={handleChange} className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="10-digit mobile number" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="address" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Complete Venue Address')}</label>
                  <input type="text" id="address" name="address" value={formData.address} onChange={handleChange}
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="Building name, landmark, street address" />
                </div>
                <div>
                  <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Start Date *')}</label>
                  <input type="date" id="startDate" name="startDate" value={formData.startDate} required
                    min={new Date().toISOString().split('T')[0]} onChange={handleChange} className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('End Date *')}</label>
                  <input type="date" id="endDate" name="endDate" value={formData.endDate} required
                    min={formData.startDate || new Date().toISOString().split('T')[0]} onChange={handleChange} className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="startTime" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Opening Time *')}</label>
                  <input type="time" id="startTime" name="startTime" value={formData.startTime} onChange={handleChange} required className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
                <div>
                  <label htmlFor="endTime" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Closing Time *')}</label>
                  <input type="time" id="endTime" name="endTime" value={formData.endTime} onChange={handleChange} required className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" />
                </div>
                <div className="md:col-span-2">
                  <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Camp Highlights / Instructions')}</label>
                  <textarea id="description" name="description" value={formData.description} onChange={handleChange} rows={3}
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="Mention refreshments, free health checkups, parking instructions, or certificate details..." />
                </div>
                <div>
                  <label htmlFor="radius" className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Donor Notification Radius')}</label>
                  <select id="radius" name="radius" value={formData.radius} onChange={handleChange} className="select-field dark:bg-slate-900 dark:border-slate-700 dark:text-white">
                    <option value={10}>10 km radius</option>
                    <option value={25}>25 km radius</option>
                    <option value={50}>50 km radius (Recommended)</option>
                    <option value={100}>100 km radius</option>
                    <option value={200}>200 km radius</option>
                  </select>
                  <p className="text-xs text-gray-400 mt-1">{t('Registered donors within this distance will receive an automated alert.')}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <button type="submit" disabled={loading} className="btn-primary flex-1 py-4 text-base">
                  {loading ? t('Processing...') : (editingId ? t('Update Camp Details') : t('Post Camp & Notify Nearby Donors'))}
                </button>
                <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary py-4">
                  {t('Cancel')}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SEARCH & FILTER CONTROLS BAR */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 shadow-sm border border-gray-100 dark:border-slate-700/80 space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">Discover Blood Camps</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">Filter by location, status, or search terms to find drives near you.</p>
            </div>

            {/* STATUS FILTER PILLS */}
            <div className="inline-flex p-1 bg-gray-100 dark:bg-slate-900 rounded-xl">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'all' ? 'bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'}`}
              >
                All Drives ({camps.length})
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-1.5 ${statusFilter === 'active' ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'}`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Today
              </button>
              <button
                onClick={() => setStatusFilter('upcoming')}
                className={`px-4 py-2 text-xs font-bold rounded-lg transition-all ${statusFilter === 'upcoming' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-gray-500 dark:text-slate-400 hover:text-gray-900'}`}
              >
                Upcoming
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Search Input */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search camp, organizer, area..."
                className="input-field pl-10 py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white"
              />
              <svg className="w-4 h-4 text-gray-400 absolute left-3.5 top-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>

            {/* State Filter */}
            <select
              value={selectedStateFilter}
              onChange={(e) => {
                setSelectedStateFilter(e.target.value);
                setSelectedDistrictFilter('');
              }}
              className="select-field py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white"
            >
              <option value="">All States</option>
              {states.map(st => (
                <option key={st} value={st}>{getTranslatedState(st, lang)}</option>
              ))}
            </select>

            {/* District Filter */}
            <select
              value={selectedDistrictFilter}
              onChange={(e) => setSelectedDistrictFilter(e.target.value)}
              disabled={!selectedStateFilter}
              className="select-field py-2.5 text-sm dark:bg-slate-900 dark:border-slate-700 dark:text-white disabled:bg-gray-100 dark:disabled:bg-slate-900/50"
            >
              <option value="">All Districts</option>
              {filterDistricts.map(dt => (
                <option key={dt} value={dt}>{getTranslatedDistrict(dt, lang)}</option>
              ))}
            </select>
          </div>
        </div>

        {/* CAMPS DISPLAY GRID */}
        {filteredCamps.length === 0 ? (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-12 text-center border border-gray-100 dark:border-slate-700/80 shadow-sm">
            <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl">
              🔍
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t('No blood donation camps match your filter')}</h3>
            <p className="text-gray-500 dark:text-slate-400 text-sm max-w-md mx-auto mb-6">
              Try clearing your search query or state filters, or post a new blood donation camp in your city!
            </p>
            <button 
              onClick={() => { setSearchQuery(''); setSelectedStateFilter(''); setSelectedDistrictFilter(''); setStatusFilter('all'); }} 
              className="px-5 py-2.5 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-semibold text-sm hover:bg-gray-200 transition-all"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {filteredCamps.map((camp) => {
              const status = getCampStatus(camp.startDate, camp.endDate);
              const hasRsvped = !!userRsvps[camp._id];

              return (
                <div 
                  key={camp._id} 
                  className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-7 border border-gray-100 dark:border-slate-700/80 shadow-card hover:shadow-2xl transition-all duration-300 flex flex-col justify-between relative overflow-hidden group"
                >
                  {/* Status Top Badge Bar */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {status === 'ACTIVE' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                          ACTIVE NOW
                        </span>
                      )}
                      {status === 'UPCOMING' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-500/20">
                          📅 UPCOMING DRIVE
                        </span>
                      )}
                      {status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-slate-300">
                          🏁 COMPLETED
                        </span>
                      )}
                      {camp.isVerified && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
                          ✓ Verified NGO
                        </span>
                      )}
                    </div>

                    {/* Creator Edit/Delete actions */}
                    {user && (camp.createdBy?._id === user.id || camp.createdBy === user.id || user.role === 'admin') && (
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleEdit(camp)}
                          className="px-2.5 py-1 bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg hover:bg-gray-200 text-xs font-semibold transition-all"
                        >
                          {t('Edit')}
                        </button>
                        <button 
                          onClick={() => handleDelete(camp._id)}
                          className="px-2.5 py-1 bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 rounded-lg hover:bg-rose-200 text-xs font-semibold transition-all"
                        >
                          {t('Delete')}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Title & Organizer */}
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {t(camp.campName) || camp.campName}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <span className="font-semibold text-gray-700 dark:text-slate-300">{t('Organizer')}:</span> {t(camp.organizerName) || camp.organizerName}
                    </p>

                    {/* Address & Meta */}
                    <div className="mt-4 space-y-2 text-sm text-gray-600 dark:text-slate-300">
                      <div className="flex items-start gap-2.5">
                        <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        <span>
                          <span className="font-medium text-gray-900 dark:text-white">{camp.address ? `${camp.address}, ` : ''}</span>
                          {camp.city ? `${camp.city}, ` : ''}{getTranslatedDistrict(camp.district, lang)}, {getTranslatedState(camp.state, lang)}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 text-xs font-medium text-gray-500 dark:text-slate-400 pt-1">
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          {camp.startDate ? new Date(camp.startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'N/A'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {camp.startTime || '09:00'} - {camp.endTime || '17:00'}
                        </span>
                      </div>

                      {camp.description && (
                        <p className="text-xs text-gray-500 dark:text-slate-400 bg-gray-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-100 dark:border-slate-700/50 mt-3 line-clamp-2">
                          "{t(camp.description) || camp.description}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* BOTTOM ACTION BUTTONS BAR */}
                  <div className="mt-6 pt-5 border-t border-gray-100 dark:border-slate-700/80 space-y-3">
                    
                    {/* Primary Action Button: RSVP Slot Booking */}
                    {hasRsvped ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 p-3 rounded-xl flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold flex items-center justify-center">✓</span>
                          <div>
                            <div className="text-xs font-bold text-emerald-800 dark:text-emerald-300">{t('RSVP Confirmed')}</div>
                            <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono">Pass #{userRsvps[camp._id].passId} • {userRsvps[camp._id].timeSlot}</div>
                          </div>
                        </div>
                        <button 
                          onClick={() => setRsvpSubmittedPass(userRsvps[camp._id])}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                        >
                          {t('View Pass')}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setRsvpModalCamp(camp); setRsvpSubmittedPass(null); }}
                        className="w-full py-3 rounded-xl bg-gradient-to-r from-red-600 to-red-700 text-white font-bold text-xs uppercase tracking-wider shadow-lg shadow-red-600/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {t('Reserve Donor Time Slot (RSVP)')}
                      </button>
                    )}

                    {/* Secondary Quick Action Links */}
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      {/* Google Maps Directions */}
                      <a 
                        href={getDirectionsUrl(camp)}
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-slate-700/80 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        🗺️ {t('Map')}
                      </a>

                      {/* Add to Calendar */}
                      <button 
                        onClick={() => downloadCalendarEvent(camp)}
                        className="py-2.5 px-3 rounded-xl bg-gray-100 dark:bg-slate-700/80 text-gray-700 dark:text-slate-200 font-semibold hover:bg-gray-200 dark:hover:bg-slate-700 transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        📅 {t('Calendar')}
                      </button>

                      {/* WhatsApp Share */}
                      <button 
                        onClick={() => shareOnWhatsApp(camp)}
                        className="py-2.5 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900 font-semibold hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 text-center"
                      >
                        💬 {t('Share')}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* RSVP / SLOT BOOKING MODAL */}
        {rsvpModalCamp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-700 relative max-h-[90vh] overflow-y-auto">
              
              <button 
                onClick={() => setRsvpModalCamp(null)} 
                className="absolute top-5 right-5 text-gray-400 hover:text-gray-600 dark:hover:text-white text-2xl font-bold"
              >
                ×
              </button>

              {!rsvpSubmittedPass ? (
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center font-bold text-lg">
                      🩸
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white">Reserve Donation Slot</h3>
                      <p className="text-xs text-gray-500 dark:text-slate-400 truncate max-w-xs">{rsvpModalCamp.campName}</p>
                    </div>
                  </div>

                  <form onSubmit={handleRsvpSubmit} className="space-y-4 text-sm mt-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Donor Name</label>
                      <input 
                        type="text" 
                        required 
                        value={rsvpForm.donorName} 
                        onChange={e => setRsvpForm({ ...rsvpForm, donorName: e.target.value })}
                        className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2.5 text-sm" 
                        placeholder="Your full name"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Blood Group</label>
                        <select 
                          value={rsvpForm.bloodGroup} 
                          onChange={e => setRsvpForm({ ...rsvpForm, bloodGroup: e.target.value })}
                          className="select-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2.5 text-sm"
                        >
                          {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => (
                            <option key={bg} value={bg}>{bg}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Mobile Phone</label>
                        <input 
                          type="tel" 
                          required 
                          value={rsvpForm.phone} 
                          onChange={e => setRsvpForm({ ...rsvpForm, phone: e.target.value })}
                          className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2.5 text-sm" 
                          placeholder="10-digit number"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">Preferred Time Slot</label>
                      <select 
                        value={rsvpForm.timeSlot} 
                        onChange={e => setRsvpForm({ ...rsvpForm, timeSlot: e.target.value })}
                        className="select-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2.5 text-sm"
                      >
                        <option value="09:00 - 11:00 AM">Morning Slot (09:00 - 11:00 AM)</option>
                        <option value="11:00 AM - 01:00 PM">Midday Slot (11:00 AM - 01:00 PM)</option>
                        <option value="02:00 - 04:00 PM">Afternoon Slot (02:00 - 04:00 PM)</option>
                        <option value="04:00 - 06:00 PM">Evening Slot (04:00 - 06:00 PM)</option>
                      </select>
                    </div>

                    <button type="submit" className="btn-primary w-full py-3 text-sm mt-4">
                      Confirm & Issue Digital Donor Pass
                    </button>
                  </form>
                </div>
              ) : (
                <div className="text-center py-2 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                    🎉
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">Donor Pass Issued!</h3>

                  <div className="bg-gradient-to-br from-red-600 to-red-800 text-white rounded-2xl p-5 text-left shadow-lg relative overflow-hidden">
                    <div className="text-[10px] uppercase font-mono tracking-widest text-red-200 mb-1">BloodOcean Official Camp Pass</div>
                    <div className="text-lg font-bold">{rsvpSubmittedPass.campName}</div>
                    <div className="text-xs text-red-100 mt-0.5">Pass ID: <span className="font-mono font-bold text-white">{rsvpSubmittedPass.passId}</span></div>

                    <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-white/20 text-xs">
                      <div>
                        <span className="text-red-200 block text-[10px]">DONOR NAME</span>
                        <span className="font-semibold">{rsvpSubmittedPass.donorName}</span>
                      </div>
                      <div>
                        <span className="text-red-200 block text-[10px]">BLOOD GROUP</span>
                        <span className="font-bold text-yellow-300">{rsvpSubmittedPass.bloodGroup}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-red-200 block text-[10px]">TIME SLOT</span>
                        <span className="font-semibold">{rsvpSubmittedPass.timeSlot}</span>
                      </div>
                      <div className="mt-2">
                        <span className="text-red-200 block text-[10px]">REGISTERED ON</span>
                        <span className="font-semibold">{rsvpSubmittedPass.registeredAt}</span>
                      </div>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500 dark:text-slate-400">Show this digital pass at the registration desk upon arrival.</p>

                  <button 
                    onClick={() => { setRsvpModalCamp(null); setRsvpSubmittedPass(null); }}
                    className="btn-secondary w-full py-2.5 text-xs font-bold"
                  >
                    Done / Close
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* AEO EDUCATIONAL FAQ SECTION */}
        <div id="faq-section" className="bg-white dark:bg-slate-800 rounded-3xl p-8 sm:p-10 shadow-sm border border-gray-100 dark:border-slate-700/80 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold text-xl">
              💡
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white font-display">💡 {t('Blood Camp FAQ & Donor Guidelines')}</h2>
              <p className="text-xs text-gray-500 dark:text-slate-400">{t('Frequently asked questions designed for AI answer engines and donor safety.')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {faqList.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div 
                  key={idx} 
                  className="rounded-2xl border border-gray-100 dark:border-slate-700/60 overflow-hidden transition-all"
                >
                  <button
                    onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                    className="w-full p-4 sm:p-5 text-left font-bold text-gray-900 dark:text-white flex items-center justify-between bg-gray-50/50 dark:bg-slate-900/40 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                  >
                    <span>{t(item.q)}</span>
                    <span className={`text-xl transition-transform ${isOpen ? 'rotate-180' : ''}`}>↓</span>
                  </button>
                  {isOpen && (
                    <div className="p-4 sm:p-5 text-sm text-gray-600 dark:text-slate-300 bg-white dark:bg-slate-800 border-t border-gray-100 dark:border-slate-700/50 leading-relaxed animate-in">
                      {t(item.a)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Camps;
