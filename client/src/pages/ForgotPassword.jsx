import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useLanguage } from '../context/LanguageContext';

const ForgotPassword = () => {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { t, lang, setLanguage } = useLanguage();

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError(t('Please enter your email.'));
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message || t('If an account exists with that email, a reset code has been sent.'));
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to send reset code'));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code || !password || !confirmPassword) {
      setError(t('Please enter the code and new password.'));
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
      const response = await api.post('/api/auth/reset-password', {
        email,
        token: code,
        password,
      });
      setMessage(response.data.message || t('Your password has been reset successfully.'));
      setStep('done');
      setCode('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to reset password'));
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
      setMessage(response.data.message || t('Reset code resent successfully.'));
    } catch (err) {
      setError(err.response?.data?.message || t('Failed to resend reset code'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-red-50/40 py-16 px-6 sm:px-8 lg:px-10 relative overflow-hidden">
      <div className="absolute inset-0 bg-grid opacity-50" />
      <div className="absolute top-20 left-10 w-72 h-72 bg-red-200/20 rounded-full blur-3xl" />
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-red-300/10 rounded-full blur-3xl" />

      <div className="max-w-md w-full relative animate-fade-in">
        <div className="bg-white/80 backdrop-blur-xl p-8 sm:p-10 rounded-3xl shadow-2xl shadow-red-900/10 border border-red-100/50">
          <div className="flex flex-col items-center mb-8">
            <div className="flex items-center gap-2 self-end mb-2">
              <button
                onClick={() => setLanguage('en')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${lang === 'en' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('hi')}
                className={`px-3 py-1 rounded-md text-sm font-semibold transition-colors ${lang === 'hi' ? 'bg-red-100 text-red-700' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
              >
                HI
              </button>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 font-display">{t('Forgot Password')}</h2>
            <p className="mt-2 text-center text-gray-500">
              {step === 'done'
                ? t('Your password is reset. Sign in with your new password.')
                : step === 'verify'
                ? t('Enter the code sent to your email.')
                : t('Enter your email to receive a reset code.')}
            </p>
          </div>

          {message && (
            <div className="bg-green-50 border-2 border-green-200 text-green-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{message}</div>
          )}
          {error && (
            <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3.5 rounded-xl text-sm font-medium mb-6">{error}</div>
          )}

          <form className="space-y-5" onSubmit={step === 'request' ? sendCode : verifyCode}>
            <div className="space-y-4">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Email address')}</label>
                <input id="email" name="email" type="email" autoComplete="email" required
                  className="input-field" placeholder={t('you@example.com')}
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {step !== 'request' && (
                <>
                  <div>
                    <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Reset code')}</label>
                    <input id="code" name="code" type="text" required
                      className="input-field" placeholder={t('Enter reset code')}
                      value={code} onChange={(e) => setCode(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('New password')}</label>
                    <div className="relative">
                      <input id="password" name="password"
                        type={showPassword ? 'text' : 'password'} required
                        className="input-field pr-10" placeholder={t('Min. 6 characters')}
                        value={password} onChange={(e) => setPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
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
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">{t('Confirm password')}</label>
                    <div className="relative">
                      <input id="confirmPassword" name="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'} required
                        className="input-field pr-10" placeholder={t('••••••••')}
                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600">
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
                {step === 'request' ? (loading ? t('Sending...') : t('Send Reset Code')) : loading ? t('Verifying...') : t('Reset Password')}
              </button>
            )}
          </form>

          {step === 'verify' && (
            <button type="button" onClick={resendCode} className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700 mt-4 transition-colors">
              {t("Didn't receive a code? Resend")}
            </button>
          )}

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
              {t('Back to login')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
