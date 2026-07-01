import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';

const ForgotPassword = () => {
  const [step, setStep] = useState('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sendCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message || 'If an account exists with that email, a reset code has been sent.');
      setStep('verify');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send reset code');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!code || !password || !confirmPassword) {
      setError('Please enter the code and new password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/api/auth/reset-password', {
        email,
        token: code,
        password,
      });
      setMessage(response.data.message || 'Your password has been reset successfully.');
      setStep('done');
      setCode('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    setError('');
    setMessage('');
    if (!email) {
      setError('Please enter your email to resend the code.');
      return;
    }
    setLoading(true);
    try {
      const response = await api.post('/api/auth/forgot-password', { email });
      setMessage(response.data.message || 'Reset code resent successfully.');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend reset code');
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
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-lg shadow-red-500/30 mb-4">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h2 className="text-center text-3xl font-extrabold text-gray-900 font-display">Forgot Password</h2>
            <p className="mt-2 text-center text-gray-500">
              {step === 'done'
                ? 'Your password is reset. Sign in with your new password.'
                : step === 'verify'
                ? 'Enter the code sent to your email.'
                : 'Enter your email to receive a reset code.'}
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
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <input id="email" name="email" type="email" autoComplete="email" required
                  className="input-field" placeholder="you@example.com"
                  value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              {step !== 'request' && (
                <>
                  <div>
                    <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-1.5">Reset code</label>
                    <input id="code" name="code" type="text" required
                      className="input-field" placeholder="Enter reset code"
                      value={code} onChange={(e) => setCode(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1.5">New password</label>
                    <input id="password" name="password" type="password" required
                      className="input-field" placeholder="Min. 6 characters"
                      value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm password</label>
                    <input id="confirmPassword" name="confirmPassword" type="password" required
                      className="input-field" placeholder="••••••••"
                      value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                  </div>
                </>
              )}
            </div>

            {step !== 'done' && (
              <button type="submit" disabled={loading} className="btn-primary w-full text-base">
                {step === 'request' ? (loading ? 'Sending...' : 'Send Reset Code') : loading ? 'Verifying...' : 'Reset Password'}
              </button>
            )}
          </form>

          {step === 'verify' && (
            <button type="button" onClick={resendCode} className="w-full text-center text-sm font-medium text-red-600 hover:text-red-700 mt-4 transition-colors">
              Didn't receive a code? Resend
            </button>
          )}

          <div className="text-center mt-6">
            <Link to="/login" className="text-sm font-semibold text-red-600 hover:text-red-700 transition-colors">
              Back to login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
