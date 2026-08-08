import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import { getTranslatedName } from '../utils/nameTranslator';

const today = new Date().toISOString().split('T')[0];

const DonationHistory = () => {
  const { user, token } = useAuth();
  const { t, lang } = useLanguage();

  const BADGES = [
    { level: t('Bronze'), min: 1, icon: '🥉', color: 'from-amber-600 to-amber-800', bg: 'bg-amber-100 text-amber-800' },
    { level: t('Silver'), min: 5, icon: '🥈', color: 'from-slate-400 to-slate-600', bg: 'bg-slate-100 text-slate-800' },
    { level: t('Gold'), min: 10, icon: '🥇', color: 'from-yellow-500 to-yellow-700', bg: 'bg-yellow-100 text-yellow-800' },
    { level: t('Platinum'), min: 25, icon: '💎', color: 'from-cyan-400 to-cyan-600', bg: 'bg-cyan-100 text-cyan-800' },
    { level: t('Diamond'), min: 50, icon: '🔮', color: 'from-violet-500 to-violet-700', bg: 'bg-violet-100 text-violet-800' },
  ];

  const getBadge = (count) => {
    for (const b of BADGES) {
      if (count >= b.min) return b;
    }
    return null;
  };

  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  
  // Fullscreen Photo Preview Modal
  const [previewImage, setPreviewImage] = useState(null);

  const [form, setForm] = useState({ 
    recipientName: user?.name || '', 
    bloodGroup: user?.bloodGroup || '', 
    hospital: '', 
    units: 1, 
    donationDate: today, 
    notes: '',
    image: '',
    memoryStory: ''
  });

  const [editingDonation, setEditingDonation] = useState(null);
  const [editForm, setEditForm] = useState({
    recipientName: '',
    bloodGroup: '',
    hospital: '',
    units: 1,
    donationDate: today,
    notes: '',
    image: '',
    memoryStory: ''
  });

  useEffect(() => {
    setForm((prev) => ({ 
      ...prev, 
      recipientName: user?.name || '',
      bloodGroup: user?.bloodGroup || prev.bloodGroup
    }));
  }, [user]);

  useEffect(() => { fetchDonations(); }, []);

  const fetchDonations = async () => {
    try {
      const res = await api.get('/api/donations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations(res.data.donations);
    } catch (err) {
      console.error('Failed to fetch donations:', err);
    }
    setLoading(false);
  };

  // Convert uploaded image file to Base64
  const handleImageUpload = (file, isEdit = false) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError(t('Image size must be less than 5MB'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      if (isEdit) {
        setEditForm(prev => ({ ...prev, image: reader.result }));
      } else {
        setForm(prev => ({ ...prev, image: reader.result }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('Are you sure you want to delete this donation memory record?'))) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations((prev) => prev.filter((d) => d._id !== id));
      setSuccess(t('Donation memory record deleted successfully'));
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to delete donation'));
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditClick = (donation) => {
    setEditingDonation(donation);
    setEditForm({
      recipientName: donation.recipientName || '',
      bloodGroup: donation.bloodGroup || '',
      hospital: donation.hospital || '',
      units: donation.units || 1,
      donationDate: donation.donationDate ? new Date(donation.donationDate).toISOString().split('T')[0] : today,
      notes: donation.notes || '',
      image: donation.image || '',
      memoryStory: donation.memoryStory || '',
    });
  };

  const handleUpdate = async () => {
    if (!editingDonation) return;
    setError('');
    setSuccess('');

    if (editForm.donationDate > today) {
      setError(t('Donation date cannot be in the future'));
      return;
    }

    try {
      const res = await api.put(`/api/donations/${editingDonation._id}`, editForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations((prev) => prev.map((d) => d._id === editingDonation._id ? res.data.donation : d));
      setSuccess(t('Donation memory updated successfully!'));
      setEditingDonation(null);
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to update donation'));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (form.donationDate > today) {
      setError(t('Donation date cannot be in the future'));
      return;
    }

    try {
      await api.post('/api/donations', form, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess(t('Donation memory recorded successfully!'));
      setShowForm(false);
      setForm({ 
        recipientName: user?.name || '', 
        bloodGroup: user?.bloodGroup || '', 
        hospital: '', 
        units: 1, 
        donationDate: today, 
        notes: '',
        image: '',
        memoryStory: ''
      });
      fetchDonations();
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to record donation'));
    }
  };

  const badge = getBadge(donations.length);
  const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);
  const nextBadge = BADGES.slice().reverse().find((b) => donations.length < b.min);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-red-50/20 to-gray-50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 py-8 px-4 sm:px-6 lg:px-8 relative transition-colors">
      <div className="absolute inset-0 bg-grid opacity-20 pointer-events-none" />
      
      <div className="max-w-6xl mx-auto relative space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-red-800 text-white flex items-center justify-center shadow-lg shadow-red-600/30 text-2xl font-bold">
              🩸
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white font-display">{t('Donation History & Memories')}</h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-0.5">{t('Preserve your life-saving memories, photos, and personal stories.')}</p>
            </div>
          </div>

          <button 
            onClick={() => setShowForm(!showForm)} 
            className="btn-primary flex items-center gap-2 text-sm py-3 px-5"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={showForm ? "M6 18L18 6M6 6l12 12" : "M12 4v16m8-8H4"} />
            </svg>
            {showForm ? t('Close Form') : t('Record New Memory')}
          </button>
        </div>

        {/* PRIVACY NOTICE BADGE */}
        <div className="flex items-center gap-3 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-emerald-800 dark:text-emerald-200 text-xs sm:text-sm font-semibold shadow-sm">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/15 flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div>
            <span className="font-bold block text-emerald-900 dark:text-emerald-100">{t('🔒 Private & Confidential Account Record')}</span>
            <span className="text-emerald-700 dark:text-emerald-300 font-normal">{t('Your donation history, memory photos, and personal stories are strictly private to your account. Other users cannot see your donation records.')}</span>
          </div>
        </div>


        {/* DONOR BADGE CARD */}
        {badge && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-slate-700/80 overflow-hidden relative">
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-4xl shadow-xl flex-shrink-0`}>
                {badge.icon}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-gray-400 dark:text-slate-400 uppercase tracking-widest">{t('Current Donor Level')}</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white font-display mt-0.5">{badge.level} {t('Donor')}</p>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                  {donations.length} {donations.length !== 1 ? t('donations') : t('donation')} · {totalUnits} {totalUnits !== 1 ? t('units') : t('unit')} donated
                </p>
              </div>
              {nextBadge && (
                <div className="text-left sm:text-right w-full sm:w-auto pt-4 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-slate-700">
                  <p className="text-xs text-gray-400 dark:text-slate-400 font-medium">{nextBadge.min - donations.length} {t('more to reach')} {nextBadge.level}</p>
                  <div className="mt-1.5 w-36 h-2 bg-gray-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all" style={{ width: `${Math.min(100, (donations.length / nextBadge.min) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* FEEDBACK ALERTS */}
        {error && <div className="bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 px-5 py-4 rounded-2xl text-sm font-medium">{error}</div>}
        {success && <div className="bg-emerald-50 dark:bg-emerald-950/40 border-2 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 px-5 py-4 rounded-2xl text-sm font-medium">{success}</div>}

        {/* RECORD DONATION & MEMORY FORM */}
        {showForm && (
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100 dark:border-slate-700/80 animate-in">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-6">{t('Record a Donation & Attach Memory')}</h3>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Recipient Name *')}</label>
                  <input type="text" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" required value={form.recipientName}
                    onChange={(e) => setForm({ ...form, recipientName: e.target.value })} placeholder="e.g. City Hospital Patient" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Blood Group *')}</label>
                  <select className="select-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" required value={form.bloodGroup}
                    onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                    <option value="">{t('Select Blood Group')}</option>
                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Hospital / Blood Bank Venue *')}</label>
                  <input type="text" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" required value={form.hospital}
                    onChange={(e) => setForm({ ...form, hospital: e.target.value })} placeholder="e.g. AIIMS / Red Cross Blood Bank" />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Units Donated')}</label>
                  <input type="number" min="1" max="10" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" value={form.units}
                    onChange={(e) => setForm({ ...form, units: parseInt(e.target.value) || 1 })} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('Donation Date *')}</label>
                  <input type="date" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" required max={today} value={form.donationDate}
                    onChange={(e) => setForm({ ...form, donationDate: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">{t('General Notes')}</label>
                  <input type="text" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" placeholder="Optional notes" value={form.notes}
                    onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                </div>

                {/* MEMORY PHOTO ATTACHMENT */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    📸 {t('Donation Memory Photo (1 Image)')}
                  </label>
                  <div className="flex items-center gap-4">
                    {form.image ? (
                      <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-red-500 shadow-md group">
                        <img src={form.image} alt="Memory Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button" 
                          onClick={() => setForm(prev => ({ ...prev, image: '' }))}
                          className="absolute inset-0 bg-black/60 text-white font-bold text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          {t('Remove')}
                        </button>
                      </div>
                    ) : (
                      <label className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-slate-700 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-red-500 dark:hover:border-red-400 transition-colors bg-gray-50/50 dark:bg-slate-900/50">
                        <span className="text-2xl mb-1">📷</span>
                        <span className="text-xs font-semibold text-gray-600 dark:text-slate-300">{t('Click to upload a memory photo while donating')}</span>
                        <span className="text-[10px] text-gray-400 dark:text-slate-500">{t('Supports JPG, PNG up to 5MB')}</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          className="hidden" 
                          onChange={(e) => handleImageUpload(e.target.files[0])} 
                        />
                      </label>
                    )}
                  </div>
                </div>

                {/* PERSONAL DESCRIPTION / STORY ABOUT YOURSELF & DONATION */}
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1.5">
                    💬 {t('Personal Story / Description About Yourself & This Donation')}
                  </label>
                  <textarea 
                    rows={3} 
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white" 
                    placeholder={t('Write a brief memory story about yourself or how you felt during this blood donation...')} 
                    value={form.memoryStory} 
                    onChange={(e) => setForm({ ...form, memoryStory: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-2">
                <button type="submit" className="btn-primary flex-1 py-3 text-sm">{t('Save Donation Memory')}</button>
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary py-3 text-sm">{t('Cancel')}</button>
              </div>
            </form>
          </div>
        )}

        {/* DONATIONS MEMORIES LIST */}
        {loading ? (
          <div className="text-center py-16">
            <div className="inline-block w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white font-display">
              {donations.length > 0 ? `${donations.length} ${donations.length !== 1 ? t('Donation Memories') : t('Donation Memory')}` : t('No donation memories recorded yet')}
            </h2>

            {donations.length === 0 && !showForm && (
              <div className="bg-white dark:bg-slate-800 rounded-3xl p-16 text-center border border-gray-100 dark:border-slate-700/80 shadow-sm">
                <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/50 text-red-500 flex items-center justify-center mx-auto mb-4 text-2xl">
                  📸
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{t('No donation memories yet')}</h3>
                <p className="text-gray-500 dark:text-slate-400 text-sm mt-1 mb-6">{t('Record your blood donation, attach a memory photo, and write your story!')}</p>
                <button onClick={() => setShowForm(true)} className="btn-primary py-2.5 px-6 text-sm">{t('Record First Memory')}</button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donations.map((d) => (
                <div key={d._id} className="bg-white dark:bg-slate-800 rounded-3xl p-6 border border-gray-100 dark:border-slate-700/80 shadow-card hover:shadow-xl transition-all duration-300 flex flex-col justify-between space-y-4">
                  
                  <div>
                    {/* Top Row: Blood badge + Date + Edit/Delete */}
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 rounded-full bg-red-100 dark:bg-red-950/80 text-red-700 dark:text-red-300 text-xs font-black">
                          {d.bloodGroup}
                        </span>
                        <span className="text-xs font-semibold text-gray-500 dark:text-slate-400">
                          {d.units} {d.units > 1 ? t('units') : t('unit')}
                        </span>
                      </div>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleEditClick(d)}
                          className="px-2.5 py-1 rounded-lg bg-gray-100 dark:bg-slate-700 text-gray-700 dark:text-slate-200 text-xs font-semibold hover:bg-gray-200"
                        >
                          {t('Edit')}
                        </button>
                        <button
                          onClick={() => handleDelete(d._id)}
                          disabled={deletingId === d._id}
                          className="px-2.5 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 text-xs font-semibold hover:bg-rose-200"
                        >
                          {t('Delete')}
                        </button>
                      </div>
                    </div>

                    {/* Hospital & Recipient */}
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white font-display">
                      {d.hospital ? (t(d.hospital) || d.hospital) : t('Voluntary Donation Drive')}
                    </h3>
                    
                    {d.recipientName && (
                      <p className="text-xs text-gray-600 dark:text-slate-300 mt-1">
                        <span className="font-semibold">{t('Recipient:')}</span> {getTranslatedName(d.recipientName, lang)}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 dark:text-slate-500 mt-1">
                      📅 {new Date(d.donationDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>

                    {/* MEMORY STORY / DESCRIPTION */}
                    {d.memoryStory && (
                      <div className="mt-3 bg-red-50/50 dark:bg-slate-900/60 p-3.5 rounded-2xl border border-red-100 dark:border-slate-700/50 text-xs text-gray-700 dark:text-slate-300 leading-relaxed italic">
                        <span className="font-bold text-red-600 dark:text-red-400 not-italic block mb-0.5">💬 {t('Memory Story:')}</span>
                        "{d.memoryStory}"
                      </div>
                    )}

                    {d.notes && !d.memoryStory && (
                      <p className="text-xs text-gray-500 dark:text-slate-400 italic mt-2">"{d.notes}"</p>
                    )}
                  </div>

                  {/* MEMORY PHOTO FRAME PREVIEW */}
                  {d.image && (
                    <div className="pt-3 border-t border-gray-100 dark:border-slate-700/80">
                      <div 
                        onClick={() => setPreviewImage(d.image)}
                        className="relative rounded-2xl overflow-hidden cursor-pointer group border border-gray-200 dark:border-slate-700 max-h-48 shadow-sm"
                      >
                        <img src={d.image} alt="Donation Memory" className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1.5">
                          🔍 {t('View Full Memory Photo')}
                        </div>
                      </div>
                    </div>
                  )}

                </div>
              ))}
            </div>
          </div>
        )}

        {/* UPDATE MEMORY MODAL */}
        {editingDonation && (
          <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in">
            <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-100 dark:border-slate-700 relative max-h-[90vh] overflow-y-auto">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white font-display mb-4">{t('Update Donation Memory')}</h3>
              
              <div className="space-y-4 text-sm">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('Recipient Name')}</label>
                  <input type="text" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2 text-sm" value={editForm.recipientName}
                    onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })} />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('Blood Group')}</label>
                    <select className="select-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2 text-sm" value={editForm.bloodGroup}
                      onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}>
                      {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                        <option key={bg} value={bg}>{bg}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('Units')}</label>
                    <input type="number" min="1" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2 text-sm" value={editForm.units}
                      onChange={(e) => setEditForm({ ...editForm, units: parseInt(e.target.value) || 1 })} />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('Hospital')}</label>
                  <input type="text" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2 text-sm" value={editForm.hospital}
                    onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })} />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">{t('Donation Date')}</label>
                  <input type="date" className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2 text-sm" max={today} value={editForm.donationDate}
                    onChange={(e) => setEditForm({ ...editForm, donationDate: e.target.value })} />
                </div>

                {/* MEMORY PHOTO IN EDIT */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">📸 {t('Memory Photo')}</label>
                  {editForm.image ? (
                    <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-red-500 mb-2">
                      <img src={editForm.image} alt="Preview" className="w-full h-full object-cover" />
                      <button 
                        type="button" 
                        onClick={() => setEditForm(prev => ({ ...prev, image: '' }))}
                        className="absolute inset-0 bg-black/60 text-white font-bold text-xs flex items-center justify-center"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleImageUpload(e.target.files[0], true)} 
                      className="text-xs text-gray-500"
                    />
                  )}
                </div>

                {/* MEMORY STORY IN EDIT */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-slate-300 mb-1">💬 {t('Personal Story / Description')}</label>
                  <textarea 
                    rows={3} 
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white py-2 text-sm" 
                    value={editForm.memoryStory} 
                    onChange={(e) => setEditForm({ ...editForm, memoryStory: e.target.value })} 
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setEditingDonation(null)} className="btn-secondary flex-1 py-2.5 text-xs font-bold">
                  {t('Cancel')}
                </button>
                <button onClick={handleUpdate} className="btn-primary flex-1 py-2.5 text-xs font-bold">
                  {t('Save Changes')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULLSCREEN PHOTO PREVIEW MODAL */}
        {previewImage && (
          <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-in">
            <div className="relative max-w-3xl w-full">
              <button 
                onClick={() => setPreviewImage(null)}
                className="absolute -top-10 right-0 text-white text-3xl font-bold hover:text-red-400"
              >
                ×
              </button>
              <img src={previewImage} alt="Donation Memory Full" className="w-full max-h-[80vh] object-contain rounded-3xl shadow-2xl border border-white/20" />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default DonationHistory;
