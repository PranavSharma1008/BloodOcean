import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const MAX_DAYS_AGO = 15;

const today = new Date().toISOString().split('T')[0];

const DonationHistory = () => {
  const { user, token } = useAuth();
  const { t } = useLanguage();

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
  const [form, setForm] = useState({ recipientName: user?.name || '', bloodGroup: '', hospital: '', units: 1, donationDate: today, notes: '' });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [editingDonation, setEditingDonation] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    setForm((prev) => ({ ...prev, recipientName: user?.name || '' }));
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

  const handleDelete = async (id) => {
    if (!window.confirm(t('Are you sure you want to delete this donation record?'))) return;
    setDeletingId(id);
    try {
      await api.delete(`/api/donations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setDonations((prev) => prev.filter((d) => d._id !== id));
      setSuccess(t('Donation deleted successfully'));
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
      donationDate: new Date(donation.donationDate).toISOString().split('T')[0],
      notes: donation.notes || '',
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
      setSuccess(t('Donation updated successfully'));
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
      setSuccess(t('Donation recorded!'));
      setShowForm(false);
      setForm({ recipientName: user?.name || '', bloodGroup: '', hospital: '', units: 1, donationDate: today, notes: '' });
      fetchDonations();
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to record donation'));
    }
  };

  const badge = getBadge(donations.length);
  const totalUnits = donations.reduce((sum, d) => sum + d.units, 0);
  const nextBadge = BADGES.slice().reverse().find((b) => donations.length < b.min);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50/50 to-red-50/20 py-8 px-4 sm:px-6 lg:px-8 relative">
      <div className="absolute inset-0 bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-6xl mx-auto relative">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/20">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 font-display">{t('Donation History')}</h1>
            <p className="text-gray-500 mt-1">{t('Track your life-saving contributions')}</p>
          </div>
        </div>

        {badge && (
          <div className="card p-6 mb-8 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-red-50/30 to-transparent" />
            <div className="relative flex items-center gap-6">
              <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${badge.color} flex items-center justify-center text-3xl shadow-lg`}>
                {badge.icon}
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-gray-500 uppercase tracking-wider">{t('Current Badge')}</p>
                <p className="text-2xl font-extrabold text-gray-900 font-display mt-0.5">{badge.level} {t('Donor')}</p>
                <p className="text-gray-500 mt-1">{donations.length} {donations.length !== 1 ? t('donations') : t('donation')} · {totalUnits} {totalUnits !== 1 ? t('units') : t('unit')} donated</p>
              </div>
              {nextBadge && (
                <div className="text-right">
                  <p className="text-xs text-gray-400 font-medium">{nextBadge.min - donations.length} {t('more to')} {nextBadge.level}</p>
                  <div className="mt-1.5 w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full transition-all" style={{ width: `${Math.min(100, (donations.length / nextBadge.min) * 100)}%` }} />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-10 h-10 rounded-full border-4 border-gray-200 border-t-red-600 animate-spin" />
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 font-display">
                {donations.length > 0 ? `${donations.length} ${donations.length !== 1 ? t('Recorded Donations') : t('Recorded Donation')}` : t('No donations yet')}
              </h2>
              <button onClick={() => setShowForm(!showForm)} className="btn-primary flex items-center gap-2 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                {showForm ? t('Cancel') : t('Record Donation')}
              </button>
            </div>

            {error && <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{error}</div>}
            {success && <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{success}</div>}

            {showForm && (
              <div className="card p-8 mb-8 animate-fade-in">
                <h3 className="text-lg font-bold text-gray-900 font-display mb-6">{t('Record a Donation')}</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Recipient Name *')}</label>
                      <input type="text" className="input-field" required value={form.recipientName}
                        onChange={(e) => setForm({ ...form, recipientName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Blood Group *')}</label>
                      <select className="select-field" required value={form.bloodGroup}
                        onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })}>
                        <option value="">{t('Select')}</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Hospital *')}</label>
                      <input type="text" className="input-field" required value={form.hospital}
                        onChange={(e) => setForm({ ...form, hospital: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Units')}</label>
                      <input type="number" min="1" className="input-field" value={form.units}
                        onChange={(e) => setForm({ ...form, units: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Donation Date *')}</label>
                      <input type="date" className="input-field" required max={today} value={form.donationDate}
                        onChange={(e) => setForm({ ...form, donationDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Notes')}</label>
                      <input type="text" className="input-field" placeholder={t('Optional')} value={form.notes}
                        onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                  </div>
                  <button type="submit" className="btn-primary w-full">{t('Record Donation')}</button>
                </form>
              </div>
            )}

            {donations.length === 0 && !showForm && (
              <div className="card p-16 text-center">
                <svg className="mx-auto h-16 w-16 text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="text-lg font-bold text-gray-900">{t('No donations recorded yet')}</h3>
                <p className="text-gray-500 mt-1">{t('Start tracking your life-saving contributions!')}</p>
              </div>
            )}

            {editingDonation && (
              <div className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
                <div className="bg-white rounded-2xl p-6 max-w-lg w-full shadow-2xl">
                  <h3 className="text-lg font-bold text-gray-900 mb-4">{t('Update Donation')}</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Recipient Name')}</label>
                      <input type="text" className="input-field" value={editForm.recipientName}
                        onChange={(e) => setEditForm({ ...editForm, recipientName: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Blood Group')}</label>
                      <select className="select-field" value={editForm.bloodGroup}
                        onChange={(e) => setEditForm({ ...editForm, bloodGroup: e.target.value })}>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Hospital')}</label>
                      <input type="text" className="input-field" value={editForm.hospital}
                        onChange={(e) => setEditForm({ ...editForm, hospital: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Units')}</label>
                      <input type="number" min="1" className="input-field" value={editForm.units}
                        onChange={(e) => setEditForm({ ...editForm, units: parseInt(e.target.value) || 1 })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Donation Date')}</label>
                      <input type="date" className="input-field" max={today} value={editForm.donationDate}
                        onChange={(e) => setEditForm({ ...editForm, donationDate: e.target.value })} />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Notes')}</label>
                      <input type="text" className="input-field" value={editForm.notes}
                        onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })} />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-6">
                    <button onClick={() => setEditingDonation(null)} className="btn-secondary flex-1 py-3 text-sm">
                      {t('Cancel')}
                    </button>
                    <button onClick={handleUpdate} className="btn-primary flex-1 py-3 text-sm">
                      {t('Save Changes')}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="grid gap-4">
              {donations.map((d) => (
                <div key={d._id} className="card p-5 flex items-center gap-5">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-200 flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 rounded-lg bg-red-100 text-red-700 text-xs font-bold">{d.bloodGroup}</span>
                      <span className="text-sm text-gray-500">{d.units} unit{d.units > 1 ? 's' : ''}</span>
                      {d.hospital && <span className="text-sm text-gray-500">{t(' at ')}{d.hospital}</span>}
                    </div>
                    {d.recipientName && <p className="text-sm text-gray-600 mt-1">{t('Recipient: ')}{d.recipientName}</p>}
                    <p className="text-xs text-gray-400 mt-1">{new Date(d.donationDate).toLocaleDateString()}</p>
                  </div>
                  <button
                    onClick={() => handleEditClick(d)}
                    className="px-3 py-2 rounded-xl border-2 border-blue-200 text-blue-600 hover:bg-blue-50 text-sm font-semibold transition-all"
                  >
                    {t('Update')}
                  </button>
                  <button
                    onClick={() => handleDelete(d._id)}
                    disabled={deletingId === d._id}
                    className="px-3 py-2 rounded-xl border-2 border-red-200 text-red-600 hover:bg-red-50 text-sm font-semibold transition-all disabled:opacity-50"
                  >
                    {deletingId === d._id ? t('Deleting...') : t('Remove')}
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default DonationHistory;
