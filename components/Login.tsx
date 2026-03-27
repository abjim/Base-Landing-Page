import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import Button from './Button';

const Login: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/login.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      const data = await response.json();

      if (data.status === 'success') {
        localStorage.setItem('authToken', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
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
            <h1 className="text-3xl font-bold text-brand-charcoal mb-2">Welcome Back</h1>
            <p className="text-brand-charcoal/70">Login to access your library</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg mb-6 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-brand-charcoal/80 mb-2">
                Email or Phone
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive focus:ring-1 focus:ring-brand-olive transition-colors placeholder:text-brand-charcoal/40"
                placeholder="Enter your email or phone"
                required
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="block text-sm font-medium text-brand-charcoal/80">
                  Password
                </label>
                <Link to="/forgot-password" className="text-xs text-brand-olive hover:text-brand-leaf transition-colors">
                  Forgot Password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive focus:ring-1 focus:ring-brand-olive transition-colors placeholder:text-brand-charcoal/40"
                placeholder="Enter your password"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full group relative inline-flex items-center justify-center gap-4 px-8 py-3 rounded-2xl font-bold transition-all duration-300 transform hover:scale-105 active:scale-95 shadow-xl overflow-hidden cursor-pointer bg-brand-olive text-white hover:shadow-brand-olive/30 hover:bg-brand-leaf border border-transparent ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {loading ? 'Logging in...' : 'Login'}
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-2 transition-transform shrink-0"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-brand-charcoal/60">
            <p>Default password for new users: <span className="font-mono text-brand-charcoal/80">12345678</span></p>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Login;
