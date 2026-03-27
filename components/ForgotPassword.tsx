import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Button from './Button';

const ForgotPassword: React.FC = () => {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/forgot_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setStep(2);
        setMessage('Reset code sent to your email.');
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to send request.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const response = await fetch('/api/reset_password.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, new_password: newPassword }),
      });
      const data = await response.json();
      
      if (data.status === 'success') {
        setMessage('Password updated successfully! Redirecting to login...');
        setTimeout(() => {
          window.location.href = '#/login';
        }, 2000);
      } else {
        setError(data.message);
      }
    } catch (err) {
      setError('Failed to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar onOpenModal={() => {}} />
      <div className="min-h-screen pt-24 pb-12 px-4 flex items-center justify-center bg-brand-ivory font-bengali">
        <div className="w-full max-w-md bg-white border border-brand-olive/20 rounded-2xl p-8 shadow-xl shadow-brand-olive/5">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-brand-charcoal mb-2">Reset Password</h1>
            <p className="text-brand-charcoal/70 text-sm">
              {step === 1 ? 'Enter your email to receive a reset code' : 'Enter the code sent to your email'}
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
              {message}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleRequestCode} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-charcoal/80 mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive focus:ring-1 focus:ring-brand-olive transition-colors placeholder:text-brand-charcoal/40"
                  placeholder="Enter your email"
                  required
                />
              </div>
              <Button
                text={loading ? 'Sending...' : 'Send Reset Code'}
                fullWidth
                className="!py-3 !text-base"
                onClick={() => {}}
              />
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-charcoal/80 mb-2">
                  Reset Code
                </label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive focus:ring-1 focus:ring-brand-olive transition-colors placeholder:text-brand-charcoal/40"
                  placeholder="Enter 6-digit code"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-charcoal/80 mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive focus:ring-1 focus:ring-brand-olive transition-colors placeholder:text-brand-charcoal/40"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <Button
                text={loading ? 'Updating...' : 'Update Password'}
                fullWidth
                className="!py-3 !text-base"
                onClick={() => {}}
              />
            </form>
          )}

          <div className="mt-6 text-center">
            <Link to="/login" className="text-sm text-brand-charcoal/60 hover:text-brand-olive transition-colors">
              Back to Login
            </Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default ForgotPassword;
