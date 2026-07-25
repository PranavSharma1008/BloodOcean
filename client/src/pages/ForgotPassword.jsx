import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';
import AuthLayout from '../components/AuthLayout';

const ForgotPassword = () => {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isAccountNotFound, setIsAccountNotFound] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t } = useLanguage();

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsAccountNotFound(false);
    
    if (!email) {
      setError(t('Please enter your email.'));
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message || t('Check in your SPAM folder.'));
      setStep('verify');
    } catch (err) {
      const errMsg = err.response?.data?.message || t('Failed to send reset code');
      setError(errMsg);
      if (err.response?.status === 404 || errMsg.toLowerCase().includes('not have an account')) {
        setIsAccountNotFound(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!code || !password || !confirmPassword) {
      setError(t('Please enter the OTP code and new password.'));
      return;
    }
    if (password !== confirmPassword) {
      setError(t('Passwords do not match.'));
      return;
    }
    if (password.length < 6) {
      setError(t('Password must be at least 6 characters.'));
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', { email, token: code, password });
      setMessage(response.data.message || t('Your password has been reset successfully.'));
      setStep('done');
      setCode('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || t('Security alert: Failed to reset password. Check code & email.'));
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError(t('Please enter your email to resend the code.'));
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message || t('Check in your SPAM folder.'));
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to resend reset code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('Forgot Password')}
      subtitle={
        step === 'done'
          ? t('Your password is reset. Sign in with your new password.')
          : step === 'verify'
          ? t('Enter the OTP reset code sent to your verified email.')
          : t('Enter your registered email to receive an OTP reset code.')
      }
    >
      {message && (
        <div className="bg-emerald-50 dark:bg-emerald-950/60 border-2 border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 px-4 py-3.5 rounded-xl text-sm font-bold mb-5 flex items-center gap-2">
          <span>✅</span>
          <span>{message}</span>
        </div>
      )}
      
      {error && (
        <div className="bg-red-50 dark:bg-red-950/60 border-2 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 px-4 py-3.5 rounded-xl text-sm font-medium mb-5 space-y-3">
          <div className="flex items-center gap-2 font-bold">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
          
          {isAccountNotFound && (
            <div className="pt-2 border-t border-red-200 dark:border-red-900/80">
              <Link 
                to="/register" 
                className="btn-primary inline-block text-center text-xs w-full py-2.5 shadow-md"
              >
                {t('Sign Up & Create An Account Now')}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* SPAM FOLDER NOTICE */}
      {step === 'verify' && (
        <div className="bg-amber-50 dark:bg-amber-950/60 border-2 border-amber-300 dark:border-amber-900 text-amber-900 dark:text-amber-200 p-4 rounded-2xl text-xs sm:text-sm font-medium mb-6 flex items-start gap-3 shadow-sm">
          <span className="text-xl flex-shrink-0">📬</span>
          <div>
            <p className="font-bold text-amber-900 dark:text-amber-100">{t('Check in your SPAM folder.')}</p>
            <p className="mt-0.5 leading-relaxed text-amber-800 dark:text-amber-300">
              {t('If you do not see the OTP code in your Inbox, please check your SPAM or Junk folder.')}
            </p>
          </div>
        </div>
      )}

      <form className="space-y-5" onSubmit={step === 'request' ? sendCode : verifyCode}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5">{t('Registered Email address')}</label>
            <input 
              id="email" 
              name="email" 
              type="email" 
              autoComplete="email" 
              required
              disabled={step === 'verify'}
              className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white disabled:opacity-80 disabled:bg-gray-100 dark:disabled:bg-slate-900/60 disabled:cursor-not-allowed" 
              placeholder=""
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
            />
            
            {step === 'request' && (
              <p className="text-xs text-amber-700 dark:text-amber-400 mt-2 flex items-center gap-1.5 font-medium">
                <span>📩</span>
                <span>{t('Check in your SPAM folder for OTP.')}</span>
              </p>
            )}
          </div>

          {step === 'verify' && (
            <>
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5">{t('OTP Reset Code *')}</label>
                <input 
                  id="code" 
                  name="code" 
                  type="text" 
                  required
                  className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white font-mono tracking-wider font-bold text-center text-lg" 
                  placeholder="6-digit OTP"
                  value={code} 
                  onChange={(e) => setCode(e.target.value)} 
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5">{t('New Password *')}</label>
                <div className="relative">
                  <input 
                    id="password" 
                    name="password"
                    type={showPassword ? 'text' : 'password'} 
                    required
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white pr-10" 
                    placeholder=""
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
                    {showPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 dark:text-slate-200 mb-1.5">{t('Confirm New Password *')}</label>
                <div className="relative">
                  <input 
                    id="confirmPassword" 
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'} 
                    required
                    className="input-field dark:bg-slate-900 dark:border-slate-700 dark:text-white pr-10" 
                    placeholder=""
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                  />
                  <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 dark:text-slate-400 hover:text-gray-600 dark:hover:text-slate-200">
                    {showConfirmPassword ? (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {step !== 'done' && (
          <button type="submit" disabled={loading} className="btn-primary w-full text-base">
            {step === 'request' ? (loading ? t('Sending OTP...') : t('Send OTP Code')) : loading ? t('Verifying...') : t('Reset Password')}
          </button>
        )}
      </form>

      {step === 'verify' && (
        <div className="space-y-3 mt-4 text-center">
          <button type="button" onClick={resendCode} className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
            {t("Didn't receive a code? Resend OTP")}
          </button>
          <div>
            <button 
              type="button" 
              onClick={() => { setStep('request'); setError(''); setMessage(''); }} 
              className="text-xs text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
            >
              {t('Change email address')}
            </button>
          </div>
        </div>
      )}

      <div className="text-center mt-6">
        <Link to="/login" className="text-sm font-semibold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors">
          {t('Back to login')}
        </Link>
      </div>
    </AuthLayout>
  );
};

export default ForgotPassword;
