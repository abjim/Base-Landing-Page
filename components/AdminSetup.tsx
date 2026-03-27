import React, { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';

const AdminSetup: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPass) { alert("Passwords don't match"); return; }
    if (password.length < 6) { alert("Password too short"); return; }
    
    setLoading(true);
    const res = await fetch('/api/admin.php?action=setup_password', {
        method: 'POST',
        body: JSON.stringify({ token, password })
    });
    const data = await res.json();
    setLoading(false);
    
    if(data.success) {
        setSuccess(true);
        setTimeout(() => navigate('/admin'), 2000);
    } else {
        alert(data.message || 'Invalid or Expired Token');
    }
  };

  if (!token) return <div className="text-brand-charcoal text-center mt-20">Invalid Access</div>;

  return (
    <div className="min-h-screen bg-brand-ivory flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl border border-brand-olive/20 p-8 shadow-2xl">
        <div className="text-center mb-8">
           <div className="w-16 h-16 bg-brand-olive/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-olive">
               {success ? <CheckCircle size={32} /> : <Lock size={32} />}
           </div>
           <h2 className="text-2xl font-bold text-brand-charcoal">Set Organic Panel Password</h2>
           <p className="text-brand-charcoal/60 text-sm">Create a secure password to access the panel.</p>
        </div>

        {success ? (
            <div className="text-center text-brand-leaf font-bold">
                Password Set! Redirecting to login...
            </div>
        ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-brand-charcoal/60 mb-1">New Password</label>
                    <input 
                        type="password" 
                        required 
                        className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-3 text-brand-charcoal focus:border-brand-olive transition"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label className="block text-xs font-bold text-brand-charcoal/60 mb-1">Confirm Password</label>
                    <input 
                        type="password" 
                        required 
                        className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-3 text-brand-charcoal focus:border-brand-olive transition"
                        value={confirmPass}
                        onChange={e => setConfirmPass(e.target.value)}
                    />
                </div>
                <button disabled={loading} className="w-full bg-brand-olive hover:bg-brand-leaf text-brand-ivory font-bold py-3 rounded-lg transition shadow-lg">
                    {loading ? 'Setting Password...' : 'Set Password & Login'}
                </button>
            </form>
        )}
      </div>
    </div>
  );
};

export default AdminSetup;