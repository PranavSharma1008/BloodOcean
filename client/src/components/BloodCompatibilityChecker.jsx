import { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const COMPATIBILITY = {
  'A+':  { canDonateTo: ['A+', 'AB+'], canReceiveFrom: ['A+', 'A-', 'O+', 'O-'] },
  'A-':  { canDonateTo: ['A+', 'A-', 'AB+', 'AB-'], canReceiveFrom: ['A-', 'O-'] },
  'B+':  { canDonateTo: ['B+', 'AB+'], canReceiveFrom: ['B+', 'B-', 'O+', 'O-'] },
  'B-':  { canDonateTo: ['B+', 'B-', 'AB+', 'AB-'], canReceiveFrom: ['B-', 'O-'] },
  'AB+': { canDonateTo: ['AB+'], canReceiveFrom: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] },
  'AB-': { canDonateTo: ['AB+', 'AB-'], canReceiveFrom: ['A-', 'B-', 'AB-', 'O-'] },
  'O+':  { canDonateTo: ['A+', 'B+', 'AB+', 'O+'], canReceiveFrom: ['O+', 'O-'] },
  'O-':  { canDonateTo: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'], canReceiveFrom: ['O-'] },
};

const BloodCompatibilityChecker = () => {
  const { t } = useLanguage();
  const [selected, setSelected] = useState(null);

  return (
    <div className="card p-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center">
          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-gray-900 font-display">{t('Blood Compatibility Checker')}</h2>
      </div>

      <p className="text-gray-600 mb-6">{t('Select your blood group to see who you can donate to and receive from.')}</p>

      <div className="flex flex-wrap gap-2 mb-8">
        {BLOOD_GROUPS.map((bg) => (
          <button key={bg} onClick={() => setSelected(bg)}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 ${
              selected === bg
                ? 'bg-gradient-to-r from-red-600 to-red-700 text-white shadow-lg shadow-red-500/25 scale-105'
                : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
            }`}>
            {bg}
          </button>
        ))}
      </div>

      {selected && (
        <div className="grid md:grid-cols-2 gap-6 animate-fade-in">
          <div className="p-5 rounded-2xl bg-green-50 border-2 border-green-200/50">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <h3 className="font-bold text-green-800">{t('Can Donate To')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMPATIBILITY[selected].canDonateTo.map((bg) => (
                <span key={bg} className="px-3 py-1.5 rounded-lg bg-green-100 text-green-800 text-sm font-bold">{bg}</span>
              ))}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-blue-50 border-2 border-blue-200/50">
            <div className="flex items-center gap-2 mb-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
              </svg>
              <h3 className="font-bold text-blue-800">{t('Can Receive From')}</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {COMPATIBILITY[selected].canReceiveFrom.map((bg) => (
                <span key={bg} className="px-3 py-1.5 rounded-lg bg-blue-100 text-blue-800 text-sm font-bold">{bg}</span>
              ))}
            </div>
          </div>
        </div>
      )}

      <details className="mt-6">
        <summary className="text-sm font-semibold text-red-600 cursor-pointer hover:text-red-700">{t('Full compatibility table')}</summary>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-2 border border-gray-200 bg-gray-50 text-gray-700 font-bold">{t('Blood Type')}</th>
                <th className="p-2 border border-gray-200 bg-green-50 text-green-800 font-bold">{t('Can Donate To')}</th>
                <th className="p-2 border border-gray-200 bg-blue-50 text-blue-800 font-bold">{t('Can Receive From')}</th>
              </tr>
            </thead>
            <tbody>
              {BLOOD_GROUPS.map((bg) => (
                <tr key={bg} className={selected === bg ? 'bg-red-50' : ''}>
                  <td className="p-2 border border-gray-200 font-bold text-center">{bg}</td>
                  <td className="p-2 border border-gray-200 text-center">{COMPATIBILITY[bg].canDonateTo.join(', ')}</td>
                  <td className="p-2 border border-gray-200 text-center">{COMPATIBILITY[bg].canReceiveFrom.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>

      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200">
        <p className="text-xs text-amber-800 font-medium">
          <strong>{t('Universal Donor:')}</strong> {t('O- can donate to everyone.')}{' '}
          <strong>{t('Universal Recipient:')}</strong> {t('AB+ can receive from everyone.')}
        </p>
      </div>
    </div>
  );
};

export default BloodCompatibilityChecker;
