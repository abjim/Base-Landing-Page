import React, { useState } from 'react';
import { User, Mail, Phone, Lock, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

interface UserData {
  name: string;
  email: string;
  phone: string;
}

const ProfileSettings: React.FC<{ user: UserData; onUpdate: (user: UserData) => void }> = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    email: user.email || '',
    phone: user.phone || '',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (formData.password && formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/update_profile.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: formData.email,
          phone: formData.phone,
          password: formData.password
        })
      });

      const data = await res.json();

      if (data.status === 'success') {
        setMessage({ type: 'success', text: data.message });
        // Update local storage if email changed (and token)
        if (data.new_token) {
          localStorage.setItem('authToken', data.new_token);
        }
        const updatedUser = { ...user, email: formData.email, phone: formData.phone };
        onUpdate(updatedUser);
        setFormData(prev => ({ ...prev, password: '', confirmPassword: '' }));
      } else {
        setMessage({ type: 'error', text: data.message });
      }
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to update profile' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-brand-charcoal mb-6 flex items-center gap-2">
        <User className="text-brand-olive" /> Profile Settings
      </h2>

      <div className="bg-brand-cream border border-brand-olive/20 rounded-xl p-6 md:p-8 shadow-sm">
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${message.type === 'success' ? 'bg-brand-leaf/10 text-brand-leaf border border-brand-leaf/20' : 'bg-red-50 text-red-600 border border-red-100'}`}>
            {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-charcoal/80">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
                <input 
                  type="email" 
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className="w-full bg-white border border-brand-olive/20 rounded-lg py-2.5 pl-10 pr-4 text-brand-charcoal focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none transition-all"
                  placeholder="name@example.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-brand-charcoal/80">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
                <input 
                  type="tel" 
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full bg-white border border-brand-olive/20 rounded-lg py-2.5 pl-10 pr-4 text-brand-charcoal focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none transition-all"
                  placeholder="+1234567890"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-brand-olive/10 pt-6">
            <h3 className="text-lg font-medium text-brand-charcoal mb-4">Change Password</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-charcoal/80">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
                  <input 
                    type="password" 
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-olive/20 rounded-lg py-2.5 pl-10 pr-4 text-brand-charcoal focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none transition-all"
                    placeholder="Leave empty to keep current"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-brand-charcoal/80">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/40" size={18} />
                  <input 
                    type="password" 
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="w-full bg-white border border-brand-olive/20 rounded-lg py-2.5 pl-10 pr-4 text-brand-charcoal focus:ring-2 focus:ring-brand-olive/20 focus:border-brand-olive outline-none transition-all"
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="px-6 py-3 bg-brand-olive hover:bg-brand-leaf text-white rounded-xl font-bold transition-all shadow-lg shadow-brand-olive/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border-0"
            >
              {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileSettings;
