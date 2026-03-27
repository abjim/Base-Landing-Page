import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, TrendingUp, CreditCard, Search, 
  CheckCircle, XCircle, AlertCircle, Loader2, Save, RefreshCw, MessageSquare 
} from 'lucide-react';

interface AdminAffiliatesProps {
  showToast: (msg: string, type?: 'success' | 'error') => void;
}

const AdminAffiliates: React.FC<AdminAffiliatesProps> = ({ showToast }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'withdrawals' | 'affiliates' | 'settings'>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [settings, setSettings] = useState({ 
      commission_percent: 20,
      notification_sms: '',
      notification_email_subject: '',
      notification_email_body: ''
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/affiliates.php?action=stats');
        const data = await res.json();
        setStats(data);
      } else if (activeTab === 'withdrawals') {
        const res = await fetch('/api/admin/affiliates.php?action=withdrawals');
        const data = await res.json();
        setWithdrawals(data.withdrawals || []);
      } else if (activeTab === 'affiliates') {
        const res = await fetch('/api/admin/affiliates.php?action=list');
        const data = await res.json();
        setAffiliates(data.affiliates || []);
      } else if (activeTab === 'settings') {
        const res = await fetch('/api/admin/affiliates.php?action=get_settings');
        const data = await res.json();
        setSettings(data);
      }
    } catch (e) {
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleWithdrawalAction = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    if (!confirm(`Are you sure you want to ${status} this withdrawal?`)) return;
    
    try {
      const res = await fetch('/api/admin/affiliates.php?action=update_withdrawal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Withdrawal ${status}`);
        fetchData();
      } else {
        showToast(data.message, 'error');
      }
    } catch (e) {
      showToast('Action failed', 'error');
    }
  };

  const saveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/affiliates.php?action=update_settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Settings saved successfully');
      } else {
        showToast('Failed to save settings', 'error');
      }
    } catch (e) {
      showToast('Network error', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Tabs */}
      <div className="flex gap-2 bg-brand-cream p-1 rounded-lg border border-brand-olive/20 w-fit">
        {['overview', 'withdrawals', 'affiliates', 'settings'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
              activeTab === tab 
                ? 'bg-brand-olive text-brand-ivory' 
                : 'text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-brand-olive/10'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <Loader2 className="animate-spin text-brand-olive" size={32} />
        </div>
      )}

      {!loading && activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Total Affiliates" value={stats.total_affiliates} icon={<Users size={20} className="text-brand-olive"/>} />
          <StatCard title="Total Clicks" value={stats.total_clicks} icon={<Search size={20} className="text-brand-sage"/>} />
          <StatCard title="Total Earnings" value={`৳${stats.total_earnings}`} icon={<DollarSign size={20} className="text-brand-leaf"/>} />
          <StatCard title="Pending Withdrawals" value={`৳${stats.pending_withdrawals}`} icon={<CreditCard size={20} className="text-brand-brown"/>} />
        </div>
      )}

      {!loading && activeTab === 'withdrawals' && (
        <div className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden">
          <div className="p-4 border-b border-brand-olive/20 flex justify-between items-center">
            <h3 className="font-bold text-brand-charcoal">Withdrawal Requests</h3>
            <button onClick={fetchData} className="p-2 hover:bg-brand-cream rounded-lg text-brand-charcoal/60"><RefreshCw size={16}/></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-brand-charcoal/70">
              <thead className="bg-brand-cream text-brand-charcoal font-medium">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Affiliate</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Details</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-olive/10">
                {withdrawals.map((w: any) => (
                  <tr key={w.id} className="hover:bg-brand-cream/50">
                    <td className="px-6 py-4">{new Date(w.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-charcoal">{w.affiliate_name}</div>
                      <div className="text-xs">{w.affiliate_email}</div>
                    </td>
                    <td className="px-6 py-4 font-bold text-brand-charcoal">৳{w.amount}</td>
                    <td className="px-6 py-4 uppercase text-xs font-bold">{w.method}</td>
                    <td className="px-6 py-4 max-w-xs truncate" title={w.details}>{w.details}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                        w.status === 'APPROVED' ? 'bg-green-100 text-green-700' :
                        w.status === 'REJECTED' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      {w.status === 'PENDING' && (
                        <div className="flex justify-end gap-2">
                          <button 
                            onClick={() => handleWithdrawalAction(w.id, 'APPROVED')}
                            className="p-1 bg-green-100 text-green-700 hover:bg-green-200 rounded"
                            title="Approve"
                          >
                            <CheckCircle size={18} />
                          </button>
                          <button 
                            onClick={() => handleWithdrawalAction(w.id, 'REJECTED')}
                            className="p-1 bg-red-100 text-red-700 hover:bg-red-200 rounded"
                            title="Reject"
                          >
                            <XCircle size={18} />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {withdrawals.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-brand-charcoal/60">No withdrawal requests found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'affiliates' && (
        <div className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden">
          <div className="p-4 border-b border-brand-olive/20 flex justify-between items-center">
            <h3 className="font-bold text-brand-charcoal">Affiliate List</h3>
            <div className="relative">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/50" size={14} />
               <input 
                 type="text" 
                 placeholder="Search affiliates..." 
                 className="bg-brand-cream border border-brand-olive/20 rounded-lg pl-9 py-1 text-sm text-brand-charcoal w-64 focus:outline-none focus:border-brand-olive"
                 value={searchTerm}
                 onChange={e => setSearchTerm(e.target.value)}
               />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-brand-charcoal/70">
              <thead className="bg-brand-cream text-brand-charcoal font-medium">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Code</th>
                  <th className="px-6 py-4 text-center">Clicks</th>
                  <th className="px-6 py-4 text-center">Sales</th>
                  <th className="px-6 py-4 text-right">Earnings</th>
                  <th className="px-6 py-4 text-right">Balance</th>
                  <th className="px-6 py-4">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-olive/10">
                {affiliates
                  .filter(a => a.email.toLowerCase().includes(searchTerm.toLowerCase()) || a.affiliate_code.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map((a: any) => (
                  <tr key={a.id} className="hover:bg-brand-cream/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-brand-charcoal">{a.name || 'N/A'}</div>
                      <div className="text-xs">{a.email}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-brand-olive">{a.affiliate_code}</td>
                    <td className="px-6 py-4 text-center">{a.clicks}</td>
                    <td className="px-6 py-4 text-center">{a.sales_count}</td>
                    <td className="px-6 py-4 text-right text-brand-leaf font-bold">৳{a.total_earnings}</td>
                    <td className="px-6 py-4 text-right font-bold">৳{a.balance}</td>
                    <td className="px-6 py-4 text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
                {affiliates.length === 0 && (
                  <tr><td colSpan={7} className="px-6 py-8 text-center text-brand-charcoal/60">No affiliates found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && activeTab === 'settings' && (
        <div className="max-w-3xl">
          <div className="bg-white rounded-xl border border-brand-olive/20 p-6">
            <h3 className="font-bold text-brand-charcoal mb-6 flex items-center gap-2">
              <TrendingUp size={20} className="text-brand-olive" /> Commission Settings
            </h3>
            <form onSubmit={saveSettings} className="space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm text-brand-charcoal/70 mb-2">Default Commission Percentage (%)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100"
                      value={settings.commission_percent}
                      onChange={e => setSettings({...settings, commission_percent: parseFloat(e.target.value)})}
                      className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive"
                    />
                    <p className="text-xs text-brand-charcoal/60 mt-2">This percentage applies to the total order value (excluding upsells if configured differently).</p>
                  </div>
                  
                  <div className="bg-brand-cream/50 p-4 rounded-lg border border-brand-olive/20">
                      <h4 className="text-sm font-bold text-brand-charcoal mb-2">Dynamic Fields</h4>
                      <div className="flex flex-wrap gap-2">
                          {['{name}', '{commission}', '{total_earnings}', '{order_amount}', '{code}'].map(tag => (
                              <span key={tag} className="text-xs bg-white text-brand-olive px-2 py-1 rounded border border-brand-olive/20 font-mono cursor-pointer hover:bg-brand-cream" onClick={() => {navigator.clipboard.writeText(tag); showToast('Copied');}}>
                                  {tag}
                              </span>
                          ))}
                      </div>
                      <p className="text-[10px] text-brand-charcoal/60 mt-2">Click to copy. Use these in your templates below.</p>
                  </div>
              </div>

              <div className="space-y-4 pt-6 border-t border-brand-olive/10">
                  <h4 className="font-bold text-brand-charcoal flex items-center gap-2"><MessageSquare size={18} className="text-brand-sage"/> Notification Templates</h4>
                  
                  <div>
                      <label className="block text-sm text-brand-charcoal/70 mb-2">SMS Template</label>
                      <textarea 
                          value={settings.notification_sms}
                          onChange={e => setSettings({...settings, notification_sms: e.target.value})}
                          className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive min-h-[80px]"
                          placeholder="Congrats! You earned ৳{commission}..."
                      />
                  </div>

                  <div>
                      <label className="block text-sm text-brand-charcoal/70 mb-2">Email Subject</label>
                      <input 
                          type="text"
                          value={settings.notification_email_subject}
                          onChange={e => setSettings({...settings, notification_email_subject: e.target.value})}
                          className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive"
                          placeholder="New Commission Earned"
                      />
                  </div>

                  <div>
                      <label className="block text-sm text-brand-charcoal/70 mb-2">Email Body (HTML Supported)</label>
                      <textarea 
                          value={settings.notification_email_body}
                          onChange={e => setSettings({...settings, notification_email_body: e.target.value})}
                          className="w-full bg-brand-cream border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive min-h-[150px] font-mono text-sm"
                          placeholder="Hi {name}, ..."
                      />
                  </div>
              </div>

              <button 
                type="submit"
                className="bg-brand-olive hover:bg-brand-leaf text-white font-bold py-3 px-6 rounded-lg flex items-center gap-2 transition-colors"
              >
                <Save size={18} /> Save Settings
              </button>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-brand-olive/20 p-6 mt-6">
            <h3 className="font-bold text-brand-charcoal mb-4 flex items-center gap-2">
                <AlertCircle size={20} className="text-brand-brown" /> Cron Job Setup
            </h3>
            <p className="text-sm text-brand-charcoal/70 mb-4">
                To ensure affiliate commissions are processed and notifications are sent automatically, please add the following Cron Job to your cPanel (recommended: run every 5 minutes):
            </p>
            <div className="bg-brand-cream border border-brand-olive/20 rounded p-4 font-mono text-xs text-brand-leaf break-all select-all">
                /usr/local/bin/php /home/YOUR_USERNAME/public_html/api/cron.php?key=YOUR_CRON_SECRET_KEY
            </div>
            <p className="text-xs text-brand-charcoal/60 mt-2">
                Replace <code>YOUR_USERNAME</code> with your cPanel username. Ensure the path to <code>cron.php</code> is correct. You can also trigger this manually using the "Run Now" button in the Automation tab.
            </p>
            <p className="text-xs text-brand-brown mt-2 font-medium">
                Note: Ensure your SMS Gateway details are correctly configured in <code>/api/config.php</code> or the Settings database.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon }: any) => (
  <div className="bg-white p-6 rounded-xl border border-brand-olive/20 flex items-center gap-4">
    <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center border border-brand-olive/10">
      {icon}
    </div>
    <div>
      <p className="text-xs text-brand-charcoal/60 uppercase tracking-wider mb-1">{title}</p>
      <h3 className="text-2xl font-bold text-brand-charcoal">{value}</h3>
    </div>
  </div>
);

export default AdminAffiliates;
