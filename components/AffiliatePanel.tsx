import React, { useState, useEffect } from 'react';
import { 
  Users, DollarSign, Copy, TrendingUp, CreditCard, 
  ArrowRight, CheckCircle, AlertCircle, Loader2, History 
} from 'lucide-react';
import { toBengaliNumber } from '../utils';

interface AffiliatePanelProps {
  user: any;
  onUpdateUser: (user: any) => void;
}

const AffiliatePanel: React.FC<AffiliatePanelProps> = ({ user, onUpdateUser }) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [error, setError] = useState('');
  const [joinLoading, setJoinLoading] = useState(false);
  
  // Withdrawal State
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState('bkash');
  const [withdrawDetails, setWithdrawDetails] = useState('');
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const [withdrawMsg, setWithdrawMsg] = useState('');

  const [commissionRate, setCommissionRate] = useState(20);

  useEffect(() => {
    fetchStats();
  }, [user]);

  const fetchStats = async () => {
    try {
      const res = await fetch(`/api/affiliate/stats.php?email=${user.email}`);
      const data = await res.json();
      
      if (data.commission_percent) {
        setCommissionRate(data.commission_percent);
      } else if (data.data && data.data.commission_percent) {
        setCommissionRate(data.data.commission_percent);
      }

      if (data.status === 'success') {
        setStats(data.data);
      } else if (data.status === 'error' && data.message !== 'Not an affiliate') {
        setError(data.message);
      }
    } catch (e) {
      if (user.is_affiliate) {
        setError('Failed to load stats');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async () => {
    setJoinLoading(true);
    try {
      const res = await fetch('/api/affiliate/join.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email })
      });
      const data = await res.json();
      if (data.status === 'success') {
        onUpdateUser({ ...user, is_affiliate: true, affiliate_code: data.code });
        fetchStats(); // Will trigger loading stats
      } else {
        setError(data.message);
      }
    } catch (e) {
      setError('Failed to join affiliate program');
    } finally {
      setJoinLoading(false);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawLoading(true);
    setWithdrawMsg('');
    
    try {
      const res = await fetch('/api/affiliate/withdraw.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount: parseFloat(withdrawAmount),
          method: withdrawMethod,
          details: withdrawDetails
        })
      });
      const data = await res.json();
      if (data.status === 'success') {
        setWithdrawMsg('Withdrawal request submitted successfully!');
        setWithdrawAmount('');
        setWithdrawDetails('');
        fetchStats(); // Refresh balance
      } else {
        setWithdrawMsg(`Error: ${data.message}`);
      }
    } catch (e) {
      setWithdrawMsg('Network error');
    } finally {
      setWithdrawLoading(false);
    }
  };

  const copyLink = () => {
    if (!stats?.code) return;
    const link = `${window.location.origin}/?ref=${stats.code}`;
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  if (loading) {
    return <div className="flex justify-center p-8"><Loader2 className="animate-spin text-brand-olive" /></div>;
  }

  // --- NOT AN AFFILIATE VIEW ---
  if (!user.is_affiliate) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-brand-cream border border-brand-olive/20 rounded-2xl p-8 md:p-12 text-center relative overflow-hidden">
           {/* Background Decoration */}
           <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/3 w-96 h-96 bg-brand-olive/5 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 translate-y-1/2 -translate-x-1/3 w-96 h-96 bg-brand-leaf/5 rounded-full blur-3xl"></div>

           <div className="relative z-10">
             <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm border border-brand-olive/10 transform rotate-3">
                <Users className="text-brand-olive" size={40} />
             </div>
             
             <h2 className="text-3xl md:text-4xl font-bold text-brand-charcoal mb-4">Join our Affiliate Program</h2>
             <p className="text-brand-charcoal/70 max-w-2xl mx-auto text-lg mb-8">
               Earn money by sharing অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট with your friends and audience. 
               Get <span className="text-brand-olive font-bold">{commissionRate}% commission</span> on every sale made through your link.
             </p>

             <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto mb-10">
                <div className="bg-white p-6 rounded-xl border border-brand-olive/10 shadow-sm">
                   <TrendingUp className="text-brand-leaf mx-auto mb-3" size={28} />
                   <h3 className="text-brand-charcoal font-bold mb-1">High Conversion</h3>
                   <p className="text-sm text-brand-charcoal/60">Our landing page is optimized for sales.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-brand-olive/10 shadow-sm">
                   <DollarSign className="text-brand-brown mx-auto mb-3" size={28} />
                   <h3 className="text-brand-charcoal font-bold mb-1">{commissionRate}% Commission</h3>
                   <p className="text-sm text-brand-charcoal/60">Earn ~৳40-100 per sale instantly.</p>
                </div>
                <div className="bg-white p-6 rounded-xl border border-brand-olive/10 shadow-sm">
                   <CreditCard className="text-brand-sage mx-auto mb-3" size={28} />
                   <h3 className="text-brand-charcoal font-bold mb-1">Easy Payout</h3>
                   <p className="text-sm text-brand-charcoal/60">Withdraw to bKash/Nagad anytime.</p>
                </div>
             </div>

             {error && (
               <div className="bg-red-50 text-red-600 border border-red-100 px-4 py-2 rounded-lg mb-6 inline-block">
                 {error}
               </div>
             )}

             <button 
               onClick={handleJoin}
               disabled={joinLoading}
               className="bg-brand-olive hover:bg-brand-leaf text-white font-bold py-4 px-10 rounded-xl shadow-lg shadow-brand-olive/20 transition-all transform hover:scale-105 flex items-center gap-2 mx-auto border-0"
             >
               {joinLoading ? <Loader2 className="animate-spin" /> : <>Activate Affiliate Account <ArrowRight size={20} /></>}
             </button>
           </div>
        </div>
      </div>
    );
  }

  // --- AFFILIATE DASHBOARD VIEW ---
  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header & Link */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-brand-cream p-6 rounded-2xl border border-brand-olive/20 shadow-sm">
         <div>
            <h2 className="text-2xl font-bold text-brand-charcoal mb-1">Affiliate Dashboard</h2>
            <p className="text-brand-charcoal/70 text-sm">Welcome back, Partner! Here's how you are performing.</p>
         </div>
         <div className="w-full md:w-auto bg-white border border-brand-olive/20 rounded-xl p-2 flex items-center gap-2 shadow-sm">
            <div className="px-3 py-1 bg-brand-ivory rounded text-brand-charcoal/80 text-sm font-mono truncate max-w-[200px]">
               {window.location.origin}/?ref={stats?.code}
            </div>
            <button 
              onClick={copyLink}
              className="p-2 bg-brand-olive hover:bg-brand-leaf text-white rounded-lg transition-colors"
              title="Copy Link"
            >
               <Copy size={16} />
            </button>
         </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
         <StatsCard 
           title="Total Clicks" 
           value={stats?.clicks || 0} 
           icon={<Users size={20} className="text-brand-olive" />} 
           color="blue"
         />
         <StatsCard 
           title="Total Sales" 
           value={stats?.sales || 0} 
           icon={<CheckCircle size={20} className="text-brand-leaf" />} 
           color="green"
         />
         <StatsCard 
           title="Total Earnings" 
           value={`৳${toBengaliNumber(stats?.total_earnings || 0)}`} 
           icon={<TrendingUp size={20} className="text-brand-brown" />} 
           color="purple"
         />
         <StatsCard 
           title="Current Balance" 
           value={`৳${toBengaliNumber(stats?.balance || 0)}`} 
           icon={<DollarSign size={20} className="text-brand-sage" />} 
           color="yellow"
           highlight
         />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Left: Transactions */}
         <div className="lg:col-span-2 space-y-6">
            <div className="bg-brand-cream border border-brand-olive/20 rounded-2xl overflow-hidden shadow-sm">
               <div className="p-6 border-b border-brand-olive/10 flex justify-between items-center bg-white">
                  <h3 className="font-bold text-brand-charcoal flex items-center gap-2">
                     <History size={18} className="text-brand-olive" /> Recent Transactions
                  </h3>
               </div>
               <div className="overflow-x-auto bg-white">
                  <table className="w-full text-left text-sm text-brand-charcoal/70">
                     <thead className="bg-brand-ivory text-brand-charcoal">
                        <tr>
                           <th className="px-6 py-4">Date</th>
                           <th className="px-6 py-4">Type</th>
                           <th className="px-6 py-4 text-right">Amount</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-brand-olive/10">
                        {stats?.transactions?.length > 0 ? (
                           stats.transactions.map((t: any) => (
                              <tr key={t.id} className="hover:bg-brand-ivory/50 transition-colors">
                                 <td className="px-6 py-4">{new Date(t.created_at).toLocaleDateString()}</td>
                                 <td className="px-6 py-4">
                                    <span className={`px-2 py-1 rounded text-xs font-bold ${
                                       t.type === 'COMMISSION' ? 'bg-brand-leaf/10 text-brand-leaf' : 
                                       t.type === 'WITHDRAWAL' ? 'bg-red-50 text-red-600' : 
                                       'bg-brand-ivory text-brand-charcoal/60'
                                    }`}>
                                       {t.type}
                                    </span>
                                 </td>
                                 <td className={`px-6 py-4 text-right font-bold ${t.amount > 0 ? 'text-brand-leaf' : 'text-red-600'}`}>
                                    {t.amount > 0 ? '+' : ''}৳{toBengaliNumber(t.amount)}
                                 </td>
                              </tr>
                           ))
                        ) : (
                           <tr>
                              <td colSpan={3} className="px-6 py-8 text-center text-brand-charcoal/50">
                                 No transactions yet. Share your link to start earning!
                              </td>
                           </tr>
                        )}
                     </tbody>
                  </table>
               </div>
            </div>
         </div>

         {/* Right: Withdrawal */}
         <div className="space-y-6">
            <div className="bg-brand-cream border border-brand-olive/20 rounded-2xl p-6 shadow-sm">
               <h3 className="font-bold text-brand-charcoal mb-4 flex items-center gap-2">
                  <CreditCard size={18} className="text-brand-olive" /> Request Withdrawal
               </h3>
               
               <div className="bg-white p-4 rounded-xl border border-brand-olive/10 mb-6 shadow-sm">
                  <p className="text-xs text-brand-charcoal/60 mb-1">Available Balance</p>
                  <p className="text-2xl font-bold text-brand-charcoal">৳{toBengaliNumber(stats?.balance || 0)}</p>
               </div>

               <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                     <label className="block text-xs text-brand-charcoal/70 mb-1">Amount (Min 500 BDT)</label>
                     <input 
                       type="number" 
                       min="500"
                       max={stats?.balance}
                       value={withdrawAmount}
                       onChange={e => setWithdrawAmount(e.target.value)}
                       className="w-full bg-white border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive"
                       placeholder="0.00"
                       required
                     />
                  </div>
                  <div>
                     <label className="block text-xs text-brand-charcoal/70 mb-1">Method</label>
                     <select 
                       value={withdrawMethod}
                       onChange={e => setWithdrawMethod(e.target.value)}
                       className="w-full bg-white border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive"
                     >
                        <option value="bkash">bKash</option>
                        <option value="nagad">Nagad</option>
                        <option value="rocket">Rocket</option>
                        <option value="bank">Bank Transfer</option>
                     </select>
                  </div>
                  <div>
                     <label className="block text-xs text-brand-charcoal/70 mb-1">Account Details</label>
                     <textarea 
                       value={withdrawDetails}
                       onChange={e => setWithdrawDetails(e.target.value)}
                       className="w-full bg-white border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive h-20 resize-none"
                       placeholder="e.g. 017XXXXXXXX (Personal)"
                       required
                     />
                  </div>

                  {withdrawMsg && (
                     <div className={`text-xs p-3 rounded ${withdrawMsg.includes('success') ? 'bg-brand-leaf/10 text-brand-leaf border border-brand-leaf/20' : 'bg-red-50 text-red-600 border border-red-100'}`}>
                        {withdrawMsg}
                     </div>
                  )}

                  <button 
                    type="submit"
                    disabled={withdrawLoading || (stats?.balance || 0) < 500}
                    className="w-full bg-brand-olive hover:bg-brand-leaf disabled:bg-brand-ivory disabled:text-brand-charcoal/40 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 border-0"
                  >
                     {withdrawLoading ? <Loader2 className="animate-spin" size={18} /> : 'Withdraw Funds'}
                  </button>
               </form>
            </div>

            {/* Withdrawal History */}
            <div className="bg-brand-cream border border-brand-olive/20 rounded-2xl p-6 shadow-sm">
               <h3 className="font-bold text-brand-charcoal mb-4 text-sm uppercase tracking-wider">Withdrawal History</h3>
               <div className="space-y-3">
                  {stats?.withdrawals?.length > 0 ? (
                     stats.withdrawals.map((w: any) => (
                        <div key={w.id} className="flex justify-between items-center p-3 bg-white rounded-lg border border-brand-olive/10 shadow-sm">
                           <div>
                              <p className="text-brand-charcoal font-bold text-sm">৳{toBengaliNumber(w.amount)}</p>
                              <p className="text-[10px] text-brand-charcoal/50">{new Date(w.created_at).toLocaleDateString()}</p>
                           </div>
                           <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${
                              w.status === 'APPROVED' ? 'bg-brand-leaf/10 text-brand-leaf' :
                              w.status === 'REJECTED' ? 'bg-red-50 text-red-600' :
                              'bg-brand-brown/10 text-brand-brown'
                           }`}>
                              {w.status}
                           </span>
                        </div>
                     ))
                  ) : (
                     <p className="text-xs text-brand-charcoal/50 text-center py-4">No withdrawals yet.</p>
                  )}
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

const StatsCard = ({ title, value, icon, color, highlight = false }: any) => (
  <div className={`p-6 rounded-xl border flex items-center gap-4 ${highlight ? 'bg-white border-brand-olive/30 shadow-md shadow-brand-olive/5' : 'bg-white border-brand-olive/10 shadow-sm'}`}>
     <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
        color === 'blue' ? 'bg-brand-olive/10' :
        color === 'green' ? 'bg-brand-leaf/10' :
        color === 'purple' ? 'bg-brand-brown/10' :
        'bg-brand-sage/20'
     }`}>
        {icon}
     </div>
     <div>
        <p className="text-brand-charcoal/60 text-xs uppercase tracking-wider mb-1">{title}</p>
        <h3 className="text-2xl font-bold text-brand-charcoal">{value}</h3>
     </div>
  </div>
);

export default AffiliatePanel;
