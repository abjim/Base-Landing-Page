import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, MessageSquare, LogOut, Check, Search, Download, 
  Settings, Save, X, Send, CreditCard, RefreshCw, Mail, Smartphone, Edit, Zap,
  BarChart2, Calendar, TrendingUp, DollarSign, Filter, Code, Copy, Trash2, Key,
  UserPlus, Shield, Lock, Clock, AlertTriangle, Link as LinkIcon, Database, ArrowLeft,
  Briefcase, MapPin, PieChart as PieChartIcon, FileSpreadsheet, ArrowUpRight, Server,
  Activity, Tag, Package, UploadCloud, Loader2, Share2
} from 'lucide-react';
import AdminAffiliates from './AdminAffiliates';

// --- CUSTOM TOAST NOTIFICATION ---
const ToastContext = React.createContext<{ showToast: (msg: string, type?: 'success' | 'error') => void }>({ showToast: () => {} });

const ToastProvider = ({ children }: { children: React.ReactNode }) => {
  const [toasts, setToasts] = useState<{id: number, msg: string, type: 'success' | 'error'}[]>([]);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, msg, type }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3000);
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
        {toasts.map(t => (
          <div key={t.id} className={`px-4 py-3 rounded-lg shadow-lg text-white text-sm font-bold animate-fade-in-up flex items-center gap-2 ${t.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
            {t.type === 'success' ? <Check size={16}/> : <AlertTriangle size={16}/>}
            {t.msg}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

const useToast = () => React.useContext(ToastContext);

// --- CUSTOM STABLE CHARTS (No External Libs) ---

const SimpleBarChart = ({ data, colorClass = "bg-cyan-500" }: { data: { label: string, value: number }[], colorClass?: string }) => {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="flex items-end justify-between h-40 gap-2 pt-4">
      {data.map((d, i) => (
        <div key={i} className="flex flex-col items-center gap-2 flex-1 group relative">
          <div className="absolute bottom-full mb-2 opacity-0 group-hover:opacity-100 transition text-[10px] bg-brand-cream px-2 py-1 rounded text-brand-charcoal whitespace-nowrap z-10">
            {d.label}: {d.value}
          </div>
          <div 
            style={{ height: `${(d.value / max) * 100}%` }} 
            className={`w-full max-w-[30px] rounded-t-sm transition-all duration-500 ${colorClass} opacity-80 hover:opacity-100`}
          ></div>
          <span className="text-[10px] text-brand-charcoal/60 truncate w-full text-center">{d.label}</span>
        </div>
      ))}
    </div>
  );
};

const SimpleAreaChart = ({ data }: { data: { date: string, value: number }[] }) => {
  if (!data || data.length === 0) return <div className="h-full flex items-center justify-center text-slate-600 text-sm">No Data Available</div>;

  // Handle single data point to prevent division by organic
  if (data.length === 1) {
      return (
        <div className="relative h-full w-full flex items-end justify-center">
            <div className="w-full border-b border-brand-olive/20 absolute bottom-0"></div>
            <div className="w-8 bg-cyan-500/50 h-1/2 rounded-t"></div>
            <div className="absolute bottom-1/2 mb-2 text-brand-olive font-bold text-xs">৳{data[0].value}</div>
            <div className="absolute bottom-[-20px] text-brand-charcoal/60 text-[10px]">{new Date(data[0].date).toLocaleDateString()}</div>
        </div>
      );
  }

  const max = Math.max(...data.map(d => d.value), 100);
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - (d.value / max) * 100;
    return `${x},${y}`;
  }).join(' ');

  const fillPath = `0,100 ${points} 100,100`;

  return (
    <div className="relative h-full w-full flex flex-col justify-end overflow-hidden group">
      {/* Grid Lines */}
      <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
        {[0, 25, 50, 75, 100].map(p => (
          <div key={p} className="border-b border-brand-olive/20 w-full h-px opacity-50"></div>
        ))}
      </div>
      
      {/* SVG Chart */}
      <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full relative z-10 overflow-visible">
        <defs>
          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={fillPath} fill="url(#chartGradient)" />
        <polyline points={points} fill="none" stroke="#06b6d4" strokeWidth="2" vectorEffect="non-scaling-stroke" />
        
        {/* Hover Points */}
        {data.map((d, i) => {
            const x = (i / (data.length - 1)) * 100;
            const y = 100 - (d.value / max) * 100;
            return (
                <circle key={i} cx={x} cy={y} r="0" className="group-hover:r-[3px] transition-all duration-300 fill-brand-olive stroke-white stroke-2" />
            );
        })}
      </svg>
      
      {/* Tooltip Overlay */}
      <div className="absolute inset-0 flex items-end justify-between z-20 opacity-0 hover:opacity-100 transition-opacity duration-300">
         {data.map((d, i) => (
             <div key={i} className="flex-1 h-full hover:bg-white/5 relative group/tooltip border-r border-transparent hover:border-brand-olive/20/50 transition-colors">
                <div className="absolute bottom-1/2 left-1/2 -translate-x-1/2 bg-white border border-brand-olive/20 p-2 rounded shadow-xl text-center min-w-[120px] pointer-events-none hidden group-hover/tooltip:block z-30 transform -translate-y-4">
                    <p className="text-[10px] text-brand-charcoal/70 mb-1">{new Date(d.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                    <p className="text-sm font-bold text-brand-olive">৳{d.value.toLocaleString()}</p>
                </div>
             </div>
         ))}
      </div>
    </div>
  );
};

// --- MAIN COMPONENT ---

const AdminDashboardContent: React.FC = () => {
  const { showToast } = useToast();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminProfile, setAdminProfile] = useState({ role: '', name: '', email: '', id: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [automationTab, setAutomationTab] = useState<'pending' | 'paid'>('pending');
  
  // Login & Forgot Password
  const [authView, setAuthView] = useState<'login' | 'forgot'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [forgotEmail, setForgotEmail] = useState('');
  
  // Data State
  const [orders, setOrders] = useState<any[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);
  const [accountData, setAccountData] = useState<any>({
      summary: { totalRevenue: 0, totalCount: 0, aov: 0, revenueGrowth: 0, countGrowth: 0 },
      daily: [],
      statuses: [],
      gateways: [],
      recentTransactions: []
  });
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  
  // CRM Modal State
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [crmForm, setCrmForm] = useState<any>({});
  const [customMsgForm, setCustomMsgForm] = useState({ type: 'sms', message: '', subject: 'Update on your Order' });
  
  // Marketing State
  const [bulkForm, setBulkForm] = useState({ target_status: 'PENDING', type: 'sms', message: '', subject: '' });
  const [isBulkSending, setIsBulkSending] = useState(false);
  
  // Settings
  const [newClientName, setNewClientName] = useState('');
  const [config, setConfig] = useState<any>({});
  
  // Automation State
  const [automationConfig, setAutomationConfig] = useState<any>({
      day1: { sms: '', email_subject: '', email_body: '' },
      day3: { sms: '', email_subject: '', email_body: '' },
      day5: { sms: '', email_subject: '', email_body: '' }
  });

  // Coupon State
  const [coupons, setCoupons] = useState<any[]>([]);
  const [couponForm, setCouponForm] = useState<any>({ code: '', type: 'fixed', amount: '', expiry_date: '', usage_limit: '', status: 'ACTIVE' });
  const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
  const [isCouponSettingsOpen, setIsCouponSettingsOpen] = useState(false);
  const [couponSettings, setCouponSettings] = useState({ coupon_timer_enabled: '1', coupon_timer_duration: '60' });
  const [automationLogs, setAutomationLogs] = useState<any[]>([]);
  const [logPage, setLogPage] = useState(1);
  const [logTotalPages, setLogTotalPages] = useState(1);
  const [logFilters, setLogFilters] = useState({ status: 'ALL', start_date: '', end_date: '' });

  // Product & Upsell State
  const [products, setProducts] = useState<any[]>([]);
  const [productForm, setProductForm] = useState<any>({ type: 'upsell', name: '', price: '', regular_price: '', image_url: '', file_url: '', description: '', status: 'ACTIVE' });
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Admin Management State
  const [newAdminForm, setNewAdminForm] = useState({ name: '', email: '', phone: '', role: 'SALES' });
  const [profileForm, setProfileForm] = useState({ password: '' });

  // Accounts & Filters
  const [accountDateRange, setAccountDateRange] = useState({ 
      start: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0], 
      end: new Date().toISOString().split('T')[0] 
  });
  const [accountStatusFilter, setAccountStatusFilter] = useState('PAID');

  // Order List Filters
  const [orderDateRange, setOrderDateRange] = useState({ start: '', end: '' });
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [orderGatewayFilter, setOrderGatewayFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalOrders, setTotalOrders] = useState(0);
  const [orderStats, setOrderStats] = useState({ paid: 0, pending: 0, revenue: 0, pending_amount: 0 });
  const itemsPerPage = 50;

  // Check session
  useEffect(() => {
    fetch('/api/admin.php?action=check_session')
      .then(res => res.json())
      .then(data => {
        if (data.logged_in) {
            setIsAuthenticated(true);
            setAdminProfile({ role: data.role, name: data.name, email: data.email, id: data.id });
            setActiveTab(data.role === 'ACCOUNTS' ? 'accounts' : 'orders');
        }
      });
  }, []);

  // Fetch Data
  useEffect(() => {
      if (!isAuthenticated) return;
      if (activeTab === 'orders') {
          const timer = setTimeout(() => {
              fetchOrders();
          }, 300);
          return () => clearTimeout(timer);
      }
  }, [isAuthenticated, activeTab, currentPage, searchTerm, orderStatusFilter, orderGatewayFilter, orderDateRange]);

  const fetchCouponSettings = async () => {
      try {
          const res = await fetch('/api/admin.php?action=get_integration_settings');
          const data = await res.json();
          setCouponSettings({
              coupon_timer_enabled: data.coupon_timer_enabled || '1',
              coupon_timer_duration: data.coupon_timer_duration || '60'
          });
      } catch (e) {
          showToast('Failed to load coupon settings', 'error');
      }
  };

  const saveCouponSettings = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch('/api/admin.php?action=save_integration_settings', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(couponSettings)
          });
          const data = await res.json();
          if (data.success) {
              showToast('Coupon Settings Saved');
              setIsCouponSettingsOpen(false);
          } else {
              showToast('Failed to save settings', 'error');
          }
      } catch (e) {
          showToast('Error saving settings', 'error');
      }
  };

  useEffect(() => {
      if (!isAuthenticated) return;
      if (activeTab === 'accounts') fetchAccountStats();
      if (activeTab === 'team') fetchAdmins();
      if (activeTab === 'coupons' && adminProfile.role === 'SUPER_ADMIN') {
          fetchCoupons();
          fetchCouponSettings();
      }
      if (activeTab === 'products' && adminProfile.role === 'SUPER_ADMIN') fetchProducts();
      if (activeTab === 'automation' && adminProfile.role === 'SUPER_ADMIN') {
          fetchAutomationSettings();
          fetchAutomationLogs();
      }
      if (activeTab === 'api' && adminProfile.role === 'SUPER_ADMIN') fetchApiKeys();
      if (activeTab === 'settings' && adminProfile.role === 'SUPER_ADMIN') fetchIntegrationSettings();
  }, [isAuthenticated, activeTab]);

  const fetchOrders = async () => {
      setIsDataLoading(true);
      try {
        const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: itemsPerPage.toString(),
            search: searchTerm,
            status: orderStatusFilter,
            gateway: orderGatewayFilter,
            start_date: orderDateRange.start,
            end_date: orderDateRange.end
        });
        const res = await fetch(`/api/admin.php?action=get_orders&${params}`);
        const data = await res.json();
        if(data.orders) {
            setOrders(data.orders);
            setTotalPages(data.totalPages || 1);
            setTotalOrders(data.total || 0);
            if (data.stats) {
                setOrderStats({
                    paid: data.stats.paid || 0,
                    pending: data.stats.pending || 0,
                    revenue: data.stats.revenue || 0,
                    pending_amount: data.stats.pending_amount || 0
                });
            }
        }
      } catch (e) {
        console.error("Failed to fetch orders", e);
        showToast("Failed to load orders", 'error');
      } finally {
        setIsDataLoading(false);
      }
  };

  const fetchAccountStats = async () => {
      try {
          const params = new URLSearchParams({
              start_date: accountDateRange.start,
              end_date: accountDateRange.end,
              status: accountStatusFilter
          });
          const res = await fetch(`/api/admin.php?action=get_account_stats&${params}`);
          const data = await res.json();
          if (data.error) {
              console.error("API Error:", data.error, data.trace);
              showToast(`Error: ${data.error}`, 'error');
          } else if(data) {
              setAccountData(data);
          }
      } catch (e) {
          console.error("Failed to fetch account stats", e);
          showToast("Failed to load account stats", 'error');
      }
  };

  // Fetch account stats when filters change
  useEffect(() => {
      if (isAuthenticated && activeTab === 'accounts') {
          fetchAccountStats();
      }
  }, [accountDateRange, accountStatusFilter]);

  const fetchProducts = async () => {
      try {
          const res = await fetch('/api/admin.php?action=get_products');
          const data = await res.json();
          setProducts(data.products || []);
      } catch (e) {
          showToast('Failed to load products', 'error');
      }
  };

  const saveProduct = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch('/api/admin.php?action=save_product', { method: 'POST', body: JSON.stringify(productForm) });
          const data = await res.json();
          if(data.success) { 
              showToast('Product Saved'); 
              fetchProducts(); 
              setIsProductModalOpen(false); 
              setProductForm({ type: 'upsell', name: '', price: '', regular_price: '', image_url: '', file_url: '', description: '', status: 'ACTIVE', page_count: '১৩৫+' }); 
          } else { 
              showToast(data.message || 'Error', 'error'); 
          }
      } catch (e) {
          showToast('Failed to save product', 'error');
      }
  };

  const deleteProduct = async (id: number) => {
      if(!confirm('Delete this product?')) return;
      try {
          await fetch('/api/admin.php?action=delete_product', { method: 'POST', body: JSON.stringify({ id }) });
          showToast('Product Deleted'); fetchProducts();
      } catch (e) {
          showToast('Failed to delete product', 'error');
      }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'image_url' | 'file_url') => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      try {
          const res = await fetch('/api/admin.php?action=upload_file', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setProductForm((prev: any) => ({ ...prev, [field]: data.url }));
              showToast('File Uploaded');
          } else {
              showToast('Upload Failed', 'error');
          }
      } catch (err) {
          showToast('Upload Error', 'error');
      }
  };

  const fetchAdmins = async () => {
      try {
          const res = await fetch('/api/admin.php?action=get_admins');
          const data = await res.json();
          setAdmins(data.admins || []);
      } catch (e) {
          showToast('Failed to load admins', 'error');
      }
  };

  const fetchIntegrationSettings = async () => {
      try {
          const res = await fetch('/api/admin.php?action=get_integration_settings');
          const data = await res.json();
          setConfig(data || {});
      } catch (e) {
          showToast('Failed to load settings', 'error');
      }
  };

  const fetchAutomationSettings = async () => {
      try {
          const res = await fetch('/api/admin.php?action=get_automation_settings');
          const data = await res.json();
          if(data.day1) setAutomationConfig(data);
      } catch (e) {
          showToast('Failed to load automation settings', 'error');
      }
  };

  const fetchAutomationLogs = async () => {
      try {
          const params = new URLSearchParams({
              page: logPage.toString(),
              limit: '15',
              status: logFilters.status,
              start_date: logFilters.start_date,
              end_date: logFilters.end_date
          });
          const res = await fetch(`/api/admin.php?action=get_automation_logs&${params}`);
          const data = await res.json();
          setAutomationLogs(data.logs || []);
          setLogTotalPages(data.totalPages || 1);
      } catch (e) {
          showToast('Failed to load automation logs', 'error');
      }
  };

  useEffect(() => {
      if (activeTab === 'automation' && adminProfile.role === 'SUPER_ADMIN') {
          fetchAutomationLogs();
      }
  }, [logPage, logFilters]);

  const fetchApiKeys = async () => {
      try {
          const res = await fetch('/api/admin.php?action=get_api_keys');
          const data = await res.json();
          setApiKeys(data.keys || []);
      } catch (e) {
          showToast('Failed to load API keys', 'error');
      }
  };

  const fetchCoupons = async () => {
      try {
          const res = await fetch('/api/admin.php?action=get_coupons');
          const data = await res.json();
          setCoupons(data.coupons || []);
      } catch (e) {
          showToast('Failed to load coupons', 'error');
      }
  };

  const saveCoupon = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          const res = await fetch('/api/admin.php?action=save_coupon', { method: 'POST', body: JSON.stringify(couponForm) });
          const data = await res.json();
          if(data.success) { showToast('Coupon Saved'); fetchCoupons(); setIsCouponModalOpen(false); setCouponForm({ code: '', type: 'fixed', amount: '', expiry_date: '', usage_limit: '', status: 'ACTIVE' }); }
          else { showToast(data.message || 'Error', 'error'); }
      } catch (e) {
          showToast('Failed to save coupon', 'error');
      }
  };

  const deleteCoupon = async (id: number) => {
      if(!confirm('Delete this coupon?')) return;
      try {
          await fetch('/api/admin.php?action=delete_coupon', { method: 'POST', body: JSON.stringify({ id }) });
          showToast('Coupon Deleted'); fetchCoupons();
      } catch (e) {
          showToast('Failed to delete coupon', 'error');
      }
  };

  const toggleCoupon = async (id: number, currentStatus: string) => {
      const newStatus = currentStatus === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      try {
          await fetch('/api/admin.php?action=toggle_coupon', { method: 'POST', body: JSON.stringify({ id, status: newStatus }) });
          showToast('Status Updated'); fetchCoupons();
      } catch (e) {
          showToast('Failed to update status', 'error');
      }
  };

  const loadOrganicDefaults = () => {
    if(!confirm('This will overwrite current automation settings with Organic defaults. Continue?')) return;
    setAutomationConfig({
      day1: {
        delay: '24',
        sms: 'প্রিয় {name}, অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট ইবুকটি কার্টে অ্যাড করেছিলেন কিন্তু অর্ডার কমপ্লিট করেননি। স্টক শেষ হওয়ার আগেই সংগ্রহ করুন: https://organic.shehzin.com',
        email_subject: 'অসম্পূর্ণ অর্ডার: অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট',
        email_body: 'প্রিয় {name},<br><br>আপনি আমাদের \'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট\' ইবুকটি কেনার চেষ্টা করেছিলেন, কিন্তু কোনো কারণে অর্ডারটি সম্পন্ন হয়নি।<br><br>এই ইবুকে আপনি পাবেন:<br>- কপি-ক্যাট নাকি গেম চেঞ্জার?<br>- কম্পিটিশন হলো লুজারদের খেলা<br>- দ্য এন্ডগেম<br><br>এখনই অর্ডার সম্পন্ন করুন: <a href="https://organic.shehzin.com">https://organic.shehzin.com</a><br><br>ধন্যবাদ,<br>শেহজীন'
      },
      day3: {
        delay: '72',
        sms: 'প্রিয় {name}, হাজারো মানুষ অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট পড়ে নিজেদের জীবন বদলে ফেলছে। আপনি কেন পিছিয়ে থাকবেন? আজই শুরু করুন: https://organic.shehzin.com',
        email_subject: 'সাফল্যের গল্প: অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট',
        email_body: 'প্রিয় {name},<br><br>আমাদের কমিউনিটিতে প্রতিদিন নতুন নতুন মানুষ তাদের জার্নি শেয়ার করছে। আপনিও নিজের জীবন বদলাতে পারেন।<br><br>আমাদের ইবুকটি আপনাকে ধাপে ধাপে গাইড করবে।<br><br>ডাউনলোড লিংক: <a href="https://organic.shehzin.com">https://organic.shehzin.com</a><br><br>ধন্যবাদ,<br>শেহজীন'
      },
      day5: {
        delay: '120',
        sms: 'প্রিয় {name}, অফারটি শীঘ্রই শেষ হয়ে যাবে। নিজের জীবন বদলানোর এটাই সেরা সময়। এখনই ইবুকটি সংগ্রহ করুন: https://organic.shehzin.com',
        email_subject: 'শেষ সুযোগ: জীবন বদলানোর',
        email_body: 'প্রিয় {name},<br><br>এটি আপনার জন্য শেষ রিমাইন্ডার। অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট ইবুকটি সংগ্রহ করে আজই আপনার যাত্রা শুরু করুন।<br><br>অফারটি মিস করবেন না!<br><br>অর্ডার লিংক: <a href="https://organic.shehzin.com">https://organic.shehzin.com</a><br><br>শুভকামনা,<br>শেহজীন'
      }
    });
    showToast('Defaults loaded. Click Save to apply.');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
        const res = await fetch('/api/admin.php?action=login', { method: 'POST', body: JSON.stringify(loginForm) });
        const data = await res.json();
        if (data.success) {
            setIsAuthenticated(true);
            setAdminProfile({ role: data.role, name: data.name, email: data.email, id: data.id });
            window.location.reload(); 
        } else { showToast(data.message || 'Invalid credentials', 'error'); }
    } catch (e) {
        showToast('Login failed', 'error');
    } finally {
        setIsLoading(false);
    }
  };

  // --- ORDER TAB CALCS ---
  // Reset pagination when filters change
  useEffect(() => {
      setCurrentPage(1);
  }, [searchTerm, orderStatusFilter, orderGatewayFilter, orderDateRange]);

  // --- CSV Export Logic ---
  const downloadReportCSV = () => {
      const params = new URLSearchParams({
          status: accountStatusFilter,
          start_date: accountDateRange.start,
          end_date: accountDateRange.end
      });
      window.open(`/api/admin.php?action=export_orders_csv&${params}`, '_blank');
  };
  
  const downloadOrdersCSV = () => {
      const params = new URLSearchParams({
          search: searchTerm,
          status: orderStatusFilter,
          gateway: orderGatewayFilter,
          start_date: orderDateRange.start,
          end_date: orderDateRange.end
      });
      window.open(`/api/admin.php?action=export_orders_csv&${params}`, '_blank');
  };
  
  const setPresetDate = (days: number, setter: any) => {
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - days);
      setter({
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
      });
  };

  // --- Actions ---
  const handleFaviconUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!e.target.files || e.target.files.length === 0) return;
      const file = e.target.files[0];
      const formData = new FormData();
      formData.append('file', file);
      
      try {
          const res = await fetch('/api/admin.php?action=upload_file', { method: 'POST', body: formData });
          const data = await res.json();
          if (data.success) {
              setConfig((prev: any) => ({ ...prev, favicon_url: data.url }));
              showToast('Favicon uploaded. Click Save Configuration to apply.');
          } else {
              showToast('Upload failed', 'error');
          }
      } catch (e) {
          showToast('Upload failed', 'error');
      }
  };

  const updateConfig = async () => {
      try {
          await fetch('/api/admin.php?action=save_integration_settings', { method: 'POST', body: JSON.stringify(config) });
          showToast('Settings Saved Successfully!');
      } catch (e) {
          showToast('Failed to save settings', 'error');
      }
  };

  const updateDatabase = async () => {
      if(!confirm('This will attempt to update database schema, migrate missing users, and update missing columns. Continue?')) return;
      try {
          const res0 = await fetch('/api/install.php');
          const data0 = await res0.text();

          const res1 = await fetch('/api/setup_auth.php');
          const data1 = await res1.json();
          
          const res2 = await fetch('/api/admin.php?action=fix_schema');
          const data2 = await res2.json();

          const res3 = await fetch('/api/admin.php?action=fix_database', { method: 'POST' });
          const data3 = await res3.json();

          if(data1.status === 'success' && data2.success && data3.success) {
              showToast(`Success: ${data1.messages?.join(' ') || ''}. ${data2.message || ''}. Database updated.`);
          } else {
              showToast(`Error: ${data1.message || data2.message || data3.message}`, 'error');
          }
      } catch (e) {
          showToast('Failed to update database', 'error');
      }
  };

  const generateApiKey = async () => {
      if(!newClientName) return showToast('Name required', 'error');
      try {
          await fetch('/api/admin.php?action=create_api_key', { method: 'POST', body: JSON.stringify({ client_name: newClientName }) });
          setNewClientName(''); fetchApiKeys();
          showToast('API Key Generated');
      } catch (e) {
          showToast('Failed to generate API key', 'error');
      }
  };

  const saveOrderDetails = async () => {
      if(!selectedOrder) return;
      try {
          await fetch('/api/admin.php?action=update_order_details', { method: 'POST', body: JSON.stringify(crmForm) });
          showToast('Order Updated'); fetchOrders(); setSelectedOrder(null);
      } catch (e) {
          showToast('Failed to update order', 'error');
      }
  };

  if (!isAuthenticated) return (
      <div className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <div className="w-full max-w-sm p-8 bg-white rounded-2xl border border-brand-olive/20 shadow-2xl">
          <h2 className="text-2xl font-bold text-brand-charcoal mb-6 text-center">{authView === 'login' ? 'Organic Panel Login' : 'Reset Password'}</h2>
          
          {authView === 'login' ? (
              <form onSubmit={handleLogin} className="space-y-4">
                <input type="text" placeholder="Email/Phone" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-3 text-brand-charcoal" value={loginForm.email} onChange={e => setLoginForm({...loginForm, email: e.target.value})} />
                <input type="password" placeholder="Password" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-3 text-brand-charcoal" value={loginForm.password} onChange={e => setLoginForm({...loginForm, password: e.target.value})} />
                <button disabled={isLoading} className="w-full bg-brand-olive text-brand-ivory font-bold py-3 rounded hover:bg-brand-leaf">{isLoading ? '...' : 'Login'}</button>
                <div className="text-center mt-4">
                    <button type="button" onClick={() => setAuthView('forgot')} className="text-brand-charcoal/60 text-sm hover:text-brand-olive">Forgot Password?</button>
                </div>
              </form>
          ) : (
              <form onSubmit={async (e) => {e.preventDefault(); try { const res = await fetch('/api/admin.php?action=forgot_password', { method: 'POST', body: JSON.stringify({ email: forgotEmail }) }); showToast((await res.json()).message); } catch (e) { showToast('Error', 'error'); } }} className="space-y-4">
                <p className="text-brand-charcoal/70 text-sm text-center mb-4">Enter your admin email to receive a password reset link.</p>
                <input type="email" placeholder="Admin Email" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-3 text-brand-charcoal" value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} required />
                <button className="w-full bg-brand-olive text-brand-ivory font-bold py-3 rounded hover:bg-brand-leaf">Send Reset Link</button>
                <div className="text-center mt-4">
                    <button type="button" onClick={() => setAuthView('login')} className="text-brand-charcoal/60 text-sm hover:text-brand-charcoal flex items-center justify-center gap-1"><ArrowLeft size={14}/> Back to Login</button>
                </div>
              </form>
          )}
        </div>
      </div>
  );

  return (
    <div className="min-h-screen bg-brand-ivory flex font-sans text-brand-charcoal/80">
      
      {/* SIDEBAR */}
      <div className="w-64 bg-white border-r border-brand-olive/20 p-6 flex flex-col fixed h-full z-20 overflow-y-auto">
         <div className="mb-8">
            <h1 className="text-xl font-bold text-brand-charcoal">Organic <span className="text-brand-olive">Panel</span></h1>
            <div className="text-xs text-brand-charcoal/60 mt-1">{adminProfile.name}</div>
            <div className="text-[10px] text-brand-olive uppercase tracking-wide">{adminProfile.role.replace('_', ' ')}</div>
         </div>
         
         <nav className="space-y-1 flex-1">
            {(adminProfile.role === 'SUPER_ADMIN' || adminProfile.role === 'SALES') && (
                <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'orders' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <LayoutDashboard size={18} /> Orders
                </button>
            )}
            {(adminProfile.role === 'SUPER_ADMIN' || adminProfile.role === 'ACCOUNTS') && (
                <button onClick={() => setActiveTab('accounts')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'accounts' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <PieChartIcon size={18} /> Accounts
                </button>
            )}
            {adminProfile.role === 'SUPER_ADMIN' && (
                <>
                <button onClick={() => setActiveTab('marketing')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'marketing' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <MessageSquare size={18} /> Marketing
                </button>
                <button onClick={() => setActiveTab('coupons')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'coupons' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Tag size={18} /> Coupons
                </button>
                <button onClick={() => setActiveTab('affiliates')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'affiliates' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Share2 size={18} /> Affiliates
                </button>
                <button onClick={() => setActiveTab('products')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'products' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Package size={18} /> Products & Upsells
                </button>
                <button onClick={() => setActiveTab('messages')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'messages' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Mail size={18} /> Success Messages
                </button>
                <button onClick={() => setActiveTab('automation')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'automation' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Zap size={18} /> Automation
                </button>
                <button onClick={() => setActiveTab('team')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'team' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Users size={18} /> Team
                </button>
                <button onClick={() => setActiveTab('api')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'api' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Code size={18} /> API & Docs
                </button>
                <button onClick={() => setActiveTab('settings')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'settings' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                    <Settings size={18} /> Settings
                </button>
                </>
            )}
            <button onClick={() => setActiveTab('profile')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition ${activeTab === 'profile' ? 'bg-brand-olive/10 text-brand-olive' : 'hover:bg-brand-cream'}`}>
                <Shield size={18} /> Profile
            </button>
         </nav>
         <button onClick={() => fetch('/api/admin.php?action=logout').then(() => window.location.reload()).catch(() => showToast('Error', 'error'))} className="flex items-center gap-3 px-4 py-3 text-red-400 hover:text-brand-charcoal transition text-sm">
            <LogOut size={18} /> Logout
         </button>
      </div>

      <div className="flex-1 ml-64 p-8 overflow-y-auto">
        
        {/* ORDERS TAB */}
        {activeTab === 'orders' && (adminProfile.role === 'SUPER_ADMIN' || adminProfile.role === 'SALES') && (
            <div className="space-y-6 animate-fade-in-up">
                
                {/* Filters */}
                <div className="bg-white p-6 rounded-xl border border-brand-olive/20">
                    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
                        <div className="relative flex-1 max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-charcoal/60" size={16} />
                            <input type="text" placeholder="Search by Order ID, Name, Phone, Email..." className="w-full bg-brand-ivory border border-brand-olive/20 rounded-lg pl-10 py-2 text-brand-charcoal" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="flex flex-wrap gap-2 items-center">
                             <div className="flex gap-1 mr-2">
                                 <button onClick={() => setPresetDate(0, setOrderDateRange)} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal/80 px-2 py-1 rounded text-[10px] transition">Today</button>
                                 <button onClick={() => setPresetDate(7, setOrderDateRange)} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal/80 px-2 py-1 rounded text-[10px] transition">7d</button>
                                 <button onClick={() => setPresetDate(30, setOrderDateRange)} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal/80 px-2 py-1 rounded text-[10px] transition">30d</button>
                             </div>
                             <input type="date" className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs" value={orderDateRange.start} onChange={e => setOrderDateRange({...orderDateRange, start: e.target.value})} />
                             <input type="date" className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs" value={orderDateRange.end} onChange={e => setOrderDateRange({...orderDateRange, end: e.target.value})} />
                             <select className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs" value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                                 <option value="ALL">All Status</option><option value="PAID">Paid</option><option value="PENDING">Pending</option>
                             </select>
                             <select className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs" value={orderGatewayFilter} onChange={e => setOrderGatewayFilter(e.target.value)}>
                                 <option value="ALL">All Gateways</option><option value="bkash">bKash</option><option value="ssl">SSLCommerz</option>
                             </select>
                             <button onClick={() => {setOrderDateRange({start:'',end:''}); setOrderStatusFilter('ALL'); setOrderGatewayFilter('ALL'); setSearchTerm('')}} className="text-brand-olive text-xs ml-2 hover:underline">Reset</button>
                             <button onClick={fetchOrders} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal p-2 rounded transition ml-2" title="Refresh Data">
                                <RefreshCw size={14} className={isDataLoading ? 'animate-spin' : ''} />
                             </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-brand-ivory p-4 rounded-lg border border-brand-olive/20">
                            <p className="text-xs text-brand-charcoal/60 uppercase">Paid Orders</p>
                            <h3 className="text-xl font-bold text-brand-leaf">{orderStats.paid}</h3>
                        </div>
                        <div className="bg-brand-ivory p-4 rounded-lg border border-brand-olive/20">
                            <p className="text-xs text-brand-charcoal/60 uppercase">Pending Orders</p>
                            <h3 className="text-xl font-bold text-brand-brown">{orderStats.pending}</h3>
                        </div>
                        <div className="bg-brand-ivory p-4 rounded-lg border border-brand-olive/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><DollarSign size={32} className="text-brand-olive" /></div>
                            <p className="text-xs text-brand-charcoal/60 uppercase">Total Revenue</p>
                            <h3 className="text-xl font-bold text-brand-olive">৳{orderStats.revenue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-brand-ivory p-4 rounded-lg border border-brand-olive/20 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-2 opacity-10"><Clock size={32} className="text-orange-500" /></div>
                            <p className="text-xs text-brand-charcoal/60 uppercase">Total Pending</p>
                            <h3 className="text-xl font-bold text-brand-brown">৳{orderStats.pending_amount.toLocaleString()}</h3>
                        </div>
                        <div className="bg-brand-ivory p-4 rounded-lg border border-brand-olive/20 flex items-center justify-center">
                            <button onClick={downloadOrdersCSV} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal w-full h-full rounded flex items-center justify-center gap-2 text-sm font-bold transition border border-brand-olive/20">
                                <Download size={16} /> Export CSV
                            </button>
                        </div>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden shadow-xl flex flex-col min-h-[400px]">
                    <div className="overflow-x-auto flex-1">
                        <table className="w-full text-left text-sm text-brand-charcoal/70">
                            <thead className="bg-brand-ivory text-slate-200">
                                <tr>
                                    <th className="px-6 py-4">Order Info</th>
                                    <th className="px-6 py-4">Customer</th>
                                    <th className="px-6 py-4">Amount</th>
                                    <th className="px-6 py-4">Coupon</th>
                                    <th className="px-6 py-4">Gateway</th>
                                    <th className="px-6 py-4">Trx</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4 text-center">Follow-up</th>
                                    <th className="px-6 py-4 text-center">DL</th>
                                    <th className="px-6 py-4 text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-olive/10">
                            {isDataLoading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        <td className="px-6 py-4"><div className="h-4 bg-brand-cream rounded w-16 mb-2"></div><div className="h-3 bg-brand-cream rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-brand-cream rounded w-32 mb-2"></div><div className="h-3 bg-brand-cream rounded w-24"></div></td>
                                        <td className="px-6 py-4"><div className="h-4 bg-brand-cream rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-brand-cream rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-3 bg-brand-cream rounded w-20"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-brand-cream rounded w-16"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-brand-cream rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-brand-cream rounded w-12 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-6 bg-brand-cream rounded w-8 mx-auto"></div></td>
                                        <td className="px-6 py-4"><div className="h-8 bg-brand-cream rounded w-16 ml-auto"></div></td>
                                    </tr>
                                ))
                            ) : orders.length > 0 ? orders.map(order => (
                                <tr key={order.id} className="hover:bg-brand-cream/50 transition">
                                    <td className="px-6 py-4">
                                        <span className="font-mono text-brand-olive">#{order.id}</span>
                                        <div className="text-[10px] text-brand-charcoal/60 mt-1">{new Date(order.payment_date || order.created_at).toLocaleString()}</div>
                                    </td>
                                    <td className="px-6 py-4"><div className="text-brand-charcoal font-bold">{order.name}</div><div className="text-xs">{order.phone}</div><div className="text-[10px] text-brand-charcoal/60">{order.email}</div></td>
                                    <td className="px-6 py-4">৳{order.amount}</td>
                                    <td className="px-6 py-4">
                                        {order.coupon_code ? (
                                            <div>
                                                <span className="bg-purple-500/20 text-brand-sage px-2 py-1 rounded text-[10px] font-mono font-bold uppercase border border-purple-500/30">{order.coupon_code}</span>
                                                <div className="text-[10px] text-brand-leaf mt-1">-৳{order.discount_amount}</div>
                                            </div>
                                        ) : <span className="text-slate-600 text-xs">-</span>}
                                    </td>
                                    <td className="px-6 py-4"><span className="px-2 py-1 bg-brand-cream rounded text-[10px] border border-brand-olive/20 uppercase">{order.gateway}</span></td>
                                    <td className="px-6 py-4">
                                        <div className="font-mono text-[10px] text-brand-charcoal/70 max-w-[100px] truncate" title={order.transaction_id}>
                                            {order.transaction_id || '-'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${order.status === 'PAID' ? 'bg-green-500/20 text-brand-leaf' : 'bg-orange-500/20 text-brand-brown'}`}>{order.status}</span></td>
                                    <td className="px-6 py-4 text-center">
                                        {order.status === 'PENDING' ? (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.last_followup_level > 0 ? 'bg-indigo-500/20 text-indigo-400' : 'bg-brand-cream text-brand-charcoal/60'}`}>
                                                Level {order.last_followup_level || 0}
                                            </span>
                                        ) : order.status === 'PAID' ? (
                                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.last_paid_followup_level > 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-brand-cream text-brand-charcoal/60'}`}>
                                                Level {order.last_paid_followup_level || 0}
                                            </span>
                                        ) : '-'}
                                    </td>
                                    <td className="px-6 py-4 text-center"><span className="bg-cyan-900/30 text-brand-olive px-2 py-0.5 rounded-full text-xs font-bold">{order.download_count}</span></td>
                                    <td className="px-6 py-4 text-right"><button onClick={() => { setSelectedOrder(order); setCrmForm({...order}); }} className="bg-brand-cream text-brand-olive px-3 py-1 rounded text-xs font-bold border border-brand-olive/20 hover:bg-cyan-900/20">Edit</button></td>
                                </tr>
                            )) : (
                                <tr><td colSpan={10} className="text-center py-12 text-brand-charcoal/60">No orders found matching filters.</td></tr>
                            )}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="bg-brand-ivory p-4 border-t border-brand-olive/20 flex items-center justify-between text-sm">
                            <div className="text-brand-charcoal/60">
                                Showing {totalOrders === 0 ? 0 : ((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalOrders)} of {totalOrders} entries
                            </div>
                            <div className="flex gap-1">
                                <button 
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
                                    disabled={currentPage === 1}
                                    className="px-3 py-1 bg-white border border-brand-olive/20 rounded text-brand-charcoal/80 disabled:opacity-50 hover:bg-brand-cream transition"
                                >
                                    Prev
                                </button>
                                <div className="px-3 py-1 bg-white border border-brand-olive/20 rounded text-brand-olive font-bold">
                                    {currentPage} / {totalPages}
                                </div>
                                <button 
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
                                    disabled={currentPage === totalPages}
                                    className="px-3 py-1 bg-white border border-brand-olive/20 rounded text-brand-charcoal/80 disabled:opacity-50 hover:bg-brand-cream transition"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        )}

        {/* COUPONS TAB */}
        {activeTab === 'coupons' && adminProfile.role === 'SUPER_ADMIN' && (
            <div className="space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-brand-charcoal flex items-center gap-2"><Tag className="text-brand-olive"/> Coupon Management</h3>
                    <div className="flex gap-2">
                        <button onClick={() => setIsCouponSettingsOpen(true)} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 border border-brand-olive/20">
                            <Settings size={16} /> Settings
                        </button>
                        <button onClick={() => { setCouponForm({ code: '', type: 'fixed', amount: '', expiry_date: '', usage_limit: '', status: 'ACTIVE' }); setIsCouponModalOpen(true); }} className="bg-brand-olive hover:bg-brand-leaf text-brand-ivory px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2">
                            <Tag size={16} /> Create Coupon
                        </button>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden">
                    <table className="w-full text-left text-sm text-brand-charcoal/70">
                        <thead className="bg-brand-ivory text-slate-200">
                            <tr>
                                <th className="px-6 py-4">Code</th>
                                <th className="px-6 py-4">Discount</th>
                                <th className="px-6 py-4">Expiry</th>
                                <th className="px-6 py-4">Usage</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-brand-olive/10">
                            {coupons.map(coupon => (
                                <tr key={coupon.id} className="hover:bg-brand-cream/50">
                                    <td className="px-6 py-4 font-mono font-bold text-brand-charcoal">{coupon.code}</td>
                                    <td className="px-6 py-4">
                                        {coupon.type === 'fixed' ? `৳${coupon.amount}` : `${coupon.amount}%`}
                                    </td>
                                    <td className="px-6 py-4">
                                        {coupon.expiry_date ? new Date(coupon.expiry_date).toLocaleDateString() : 'No Expiry'}
                                    </td>
                                    <td className="px-6 py-4">
                                        {coupon.usage_count} / {coupon.usage_limit == -1 ? '∞' : coupon.usage_limit}
                                    </td>
                                    <td className="px-6 py-4">
                                        <button onClick={() => toggleCoupon(coupon.id, coupon.status)} className={`px-2 py-1 rounded text-[10px] font-bold ${coupon.status === 'ACTIVE' ? 'bg-green-500/20 text-brand-leaf' : 'bg-red-500/20 text-red-400'}`}>
                                            {coupon.status}
                                        </button>
                                    </td>
                                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                                        <button onClick={() => { setCouponForm(coupon); setIsCouponModalOpen(true); }} className="p-2 bg-brand-cream rounded hover:bg-brand-cream text-brand-olive"><Edit size={14}/></button>
                                        <button onClick={() => deleteCoupon(coupon.id)} className="p-2 bg-brand-cream rounded hover:bg-brand-cream text-red-400"><Trash2 size={14}/></button>
                                    </td>
                                </tr>
                            ))}
                            {coupons.length === 0 && <tr><td colSpan={6} className="text-center py-8">No coupons found.</td></tr>}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {/* Coupon Settings Modal */}
        {isCouponSettingsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-ivory/80 backdrop-blur-sm">
                <div className="bg-white border border-brand-olive/20 rounded-xl w-full max-w-md overflow-hidden animate-fade-in-up">
                    <div className="p-6 border-b border-brand-olive/20 flex justify-between items-center">
                        <h3 className="text-xl font-bold text-brand-charcoal">Coupon Settings</h3>
                        <button onClick={() => setIsCouponSettingsOpen(false)} className="text-brand-charcoal/70 hover:text-brand-charcoal"><X size={20}/></button>
                    </div>
                    <form onSubmit={saveCouponSettings} className="p-6 space-y-4">
                        <div>
                            <label className="block text-brand-charcoal/70 text-xs mb-2">Enable Countdown Timer</label>
                            <select 
                                className="w-full bg-brand-ivory border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive"
                                value={couponSettings.coupon_timer_enabled}
                                onChange={e => setCouponSettings({...couponSettings, coupon_timer_enabled: e.target.value})}
                            >
                                <option value="1">Enabled</option>
                                <option value="0">Disabled</option>
                            </select>
                            <p className="text-[10px] text-brand-charcoal/60 mt-1">Shows a countdown timer after applying a coupon to create urgency.</p>
                        </div>
                        <div>
                            <label className="block text-brand-charcoal/70 text-xs mb-2">Timer Duration (Seconds)</label>
                            <input 
                                type="number" 
                                className="w-full bg-brand-ivory border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive"
                                value={couponSettings.coupon_timer_duration}
                                onChange={e => setCouponSettings({...couponSettings, coupon_timer_duration: e.target.value})}
                            />
                        </div>
                        <div className="pt-4 flex justify-end gap-3">
                            <button type="button" onClick={() => setIsCouponSettingsOpen(false)} className="px-4 py-2 rounded-lg text-brand-charcoal/70 hover:text-brand-charcoal hover:bg-brand-cream transition">Cancel</button>
                            <button type="submit" className="px-6 py-2 rounded-lg bg-brand-olive hover:bg-brand-leaf text-brand-ivory font-bold transition">Save Settings</button>
                        </div>
                    </form>
                </div>
            </div>
        )}

        {/* AFFILIATES TAB */}
        {activeTab === 'affiliates' && adminProfile.role === 'SUPER_ADMIN' && (
            <AdminAffiliates showToast={showToast} />
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && adminProfile.role === 'SUPER_ADMIN' && (
            <div className="space-y-8 animate-fade-in-up">
                
                {/* Main eBook Section */}
                <div className="bg-white rounded-xl border border-brand-olive/20 p-8">
                    <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><Package className="text-brand-olive"/> Main Product (eBook)</h3>
                    <div className="bg-brand-ivory border border-brand-olive/20 rounded-xl p-6">
                        {products.find(p => p.type === 'main') ? (
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="text-brand-charcoal font-bold text-lg">{products.find(p => p.type === 'main').name}</h4>
                                    <p className="text-brand-charcoal/60 text-sm mt-1">
                                        Price: ৳{products.find(p => p.type === 'main').price}
                                        {products.find(p => p.type === 'main').regular_price && (
                                            <span className="line-through text-slate-600 ml-2">৳{products.find(p => p.type === 'main').regular_price}</span>
                                        )}
                                        {products.find(p => p.type === 'main').page_count && (
                                            <span className="text-brand-charcoal/70 ml-4">Pages: {products.find(p => p.type === 'main').page_count}</span>
                                        )}
                                    </p>
                                    {products.find(p => p.type === 'main').file_url && (
                                        <a href={products.find(p => p.type === 'main').file_url} target="_blank" rel="noreferrer" className="text-brand-olive text-xs mt-2 inline-block hover:underline">View File</a>
                                    )}
                                </div>
                                <button 
                                    onClick={() => { setProductForm(products.find(p => p.type === 'main')); setIsProductModalOpen(true); }} 
                                    className="bg-brand-cream text-brand-olive px-4 py-2 rounded font-bold border border-brand-olive/20 hover:bg-brand-cream"
                                >
                                    Edit Product
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-8">
                                <p className="text-brand-charcoal/60 mb-4">No main product configured.</p>
                                <button 
                                    onClick={() => { setProductForm({ type: 'main', name: 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট', price: '199', status: 'ACTIVE', page_count: '১৩৫+' }); setIsProductModalOpen(true); }} 
                                    className="bg-brand-olive hover:bg-brand-leaf text-brand-ivory px-6 py-2 rounded-lg font-bold"
                                >
                                    Configure Main Product
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Upsells Section */}
                <div className="space-y-6">
                    <div className="flex justify-between items-center">
                        <h3 className="text-xl font-bold text-brand-charcoal flex items-center gap-2"><TrendingUp className="text-green-500"/> Order Bumps / Upsells</h3>
                        <button 
                            onClick={() => { setProductForm({ type: 'upsell', name: '', price: '', image_url: '', file_url: '', description: '', status: 'ACTIVE', page_count: '১৩৫+' }); setIsProductModalOpen(true); }} 
                            className="bg-green-600 hover:bg-green-500 text-brand-charcoal px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
                        >
                            <Package size={16} /> Add Upsell Item
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {products.filter(p => p.type === 'upsell').map(product => (
                            <div key={product.id} className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden group hover:border-brand-olive/30 transition-colors">
                                <div className="aspect-video bg-brand-ivory relative">
                                    {product.image_url ? (
                                        <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600"><Package size={32}/></div>
                                    )}
                                    <div className="absolute top-2 right-2">
                                        <span className={`px-2 py-1 rounded text-[10px] font-bold ${product.status === 'ACTIVE' ? 'bg-green-500/20 text-brand-leaf' : 'bg-red-500/20 text-red-400'}`}>
                                            {product.status}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="text-brand-charcoal font-bold">{product.name}</h4>
                                        <div className="text-right">
                                            <span className="text-brand-olive font-bold block">৳{product.price}</span>
                                            {product.regular_price && (
                                                <span className="text-brand-charcoal/60 text-[10px] line-through block">৳{product.regular_price}</span>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-brand-charcoal/60 text-xs line-clamp-2 mb-4 h-8">{product.description}</p>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setProductForm(product); setIsProductModalOpen(true); }} className="flex-1 bg-brand-cream text-brand-olive py-2 rounded text-xs font-bold hover:bg-brand-cream">Edit</button>
                                        <button onClick={() => deleteProduct(product.id)} className="px-3 bg-brand-cream text-red-400 rounded hover:bg-brand-cream"><Trash2 size={14}/></button>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {products.filter(p => p.type === 'upsell').length === 0 && (
                            <div className="col-span-full text-center py-12 text-brand-charcoal/60 bg-white/50 rounded-xl border border-brand-olive/20 border-dashed">
                                No upsell items found. Add one to increase AOV!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* ACCOUNTS TAB (Replaces Reports - Client Side accurate calculation) */}
        {activeTab === 'accounts' && (
            <div className="space-y-6 animate-fade-in-up">
                
                {/* Header & Controls */}
                <div className="bg-white p-6 rounded-xl border border-brand-olive/20 flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h3 className="text-xl font-bold text-brand-charcoal flex items-center gap-2">
                           <Briefcase className="text-brand-olive" size={24}/> Accounts Overview
                        </h3>
                        <p className="text-brand-charcoal/60 text-xs mt-1">Real-time financial data analytics</p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2 items-center">
                         <div className="flex gap-1 mr-2">
                             <button onClick={() => setPresetDate(0, setAccountDateRange)} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal/80 px-2 py-1 rounded text-[10px] transition">Today</button>
                             <button onClick={() => setPresetDate(7, setAccountDateRange)} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal/80 px-2 py-1 rounded text-[10px] transition">7d</button>
                             <button onClick={() => setPresetDate(30, setAccountDateRange)} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal/80 px-2 py-1 rounded text-[10px] transition">30d</button>
                         </div>
                         <select className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs" value={accountStatusFilter} onChange={e => setAccountStatusFilter(e.target.value)}>
                             <option value="PAID">Confirmed (Paid)</option>
                             <option value="PENDING">Pending</option>
                             <option value="ALL">All Records</option>
                         </select>
                         <input type="date" className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs" value={accountDateRange.start} onChange={e => setAccountDateRange({...accountDateRange, start: e.target.value})} />
                         <input type="date" className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs" value={accountDateRange.end} onChange={e => setAccountDateRange({...accountDateRange, end: e.target.value})} />
                         
                         {/* CSV Export */}
                         <button 
                            onClick={downloadReportCSV} 
                            className="bg-green-600 px-4 py-1 rounded text-brand-charcoal text-xs font-bold flex items-center gap-2 hover:bg-green-500 transition"
                         >
                             <FileSpreadsheet size={14} /> Export CSV
                         </button>
                    </div>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white p-6 rounded-xl border border-brand-olive/20 relative overflow-hidden group hover:border-brand-olive/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><DollarSign size={64} /></div>
                        <p className="text-brand-charcoal/60 text-xs uppercase mb-1 font-bold tracking-wider">Total Revenue</p>
                        <h3 className="text-3xl font-bold text-brand-charcoal">৳{accountData.summary.totalRevenue.toLocaleString()}</h3>
                        <div className={`text-xs mt-2 flex items-center gap-1 font-bold ${accountData.summary.revenueGrowth >= 0 ? 'text-brand-leaf' : 'text-red-400'}`}>
                            {accountData.summary.revenueGrowth >= 0 ? <TrendingUp size={12}/> : <TrendingUp size={12} className="rotate-180"/>} 
                            {Math.abs(accountData.summary.revenueGrowth).toFixed(1)}% vs prev period
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-brand-olive/20 relative overflow-hidden group hover:border-brand-olive/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><PieChartIcon size={64} /></div>
                        <p className="text-brand-charcoal/60 text-xs uppercase mb-1 font-bold tracking-wider">Avg. Order Value</p>
                        <h3 className="text-3xl font-bold text-brand-olive">৳{accountData.summary.aov}</h3>
                        <div className="text-xs text-brand-charcoal/60 mt-2">Per confirmed order</div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-brand-olive/20 relative overflow-hidden group hover:border-brand-olive/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Check size={64} /></div>
                        <p className="text-brand-charcoal/60 text-xs uppercase mb-1 font-bold tracking-wider">Total Sales Count</p>
                        <h3 className="text-3xl font-bold text-brand-sage">{accountData.summary.totalCount}</h3>
                        <div className={`text-xs mt-2 flex items-center gap-1 font-bold ${accountData.summary.countGrowth >= 0 ? 'text-brand-leaf' : 'text-red-400'}`}>
                            {accountData.summary.countGrowth >= 0 ? <ArrowUpRight size={12}/> : <ArrowUpRight size={12} className="rotate-90"/>} 
                            {Math.abs(accountData.summary.countGrowth).toFixed(1)}% vs prev period
                        </div>
                    </div>
                    {/* New Conversion/Ratio Card */}
                    <div className="bg-white p-6 rounded-xl border border-brand-olive/20 relative overflow-hidden group hover:border-brand-olive/30 transition-colors">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity"><Activity size={64} /></div>
                        <p className="text-brand-charcoal/60 text-xs uppercase mb-1 font-bold tracking-wider">Conversion Rate</p>
                        <h3 className="text-3xl font-bold text-yellow-400">
                            {accountData.summary.totalCount > 0 
                                ? ((accountData.summary.totalCount / (orders.length || 1)) * 100).toFixed(1) 
                                : 0}%
                        </h3>
                        <div className="text-xs text-brand-charcoal/60 mt-2">Paid vs Total Orders</div>
                    </div>
                </div>

                {/* Main Graph: Revenue Trend (Custom Stable SVG) */}
                <div className="bg-white rounded-xl border border-brand-olive/20 p-6 h-[320px]">
                    <h4 className="text-brand-charcoal font-bold mb-6 flex items-center gap-2"><TrendingUp size={18} className="text-brand-olive"/> Daily Revenue Trend</h4>
                    <div className="h-[240px] w-full">
                        <SimpleAreaChart data={accountData.daily} />
                    </div>
                </div>

                {/* Secondary Charts: Gateway & Status (Custom Stable HTML/CSS) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Gateway Bar Chart */}
                    <div className="bg-white rounded-xl border border-brand-olive/20 p-6 h-[300px]">
                        <h4 className="text-brand-charcoal font-bold mb-4 flex items-center gap-2"><CreditCard size={18} className="text-pink-500"/> Payment Gateways (Paid)</h4>
                        <div className="h-full pb-8">
                             <SimpleBarChart data={accountData.gateways} colorClass="bg-pink-500" />
                        </div>
                    </div>

                    {/* Status Bar Chart */}
                    <div className="bg-white rounded-xl border border-brand-olive/20 p-6 h-[300px]">
                        <h4 className="text-brand-charcoal font-bold mb-4 flex items-center gap-2"><Briefcase size={18} className="text-purple-500"/> Order Status Distribution</h4>
                        <div className="h-full pb-8">
                             <SimpleBarChart data={accountData.statuses} colorClass="bg-purple-500" />
                        </div>
                    </div>
                </div>

                {/* Recent Transactions Table (New Feature) */}
                <div className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden">
                    <div className="p-6 border-b border-brand-olive/20 flex justify-between items-center">
                        <h4 className="text-brand-charcoal font-bold flex items-center gap-2"><FileSpreadsheet size={18} className="text-green-500"/> Recent Transactions</h4>
                        <button onClick={() => setActiveTab('orders')} className="text-xs text-brand-olive hover:underline">View All Orders</button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-brand-charcoal/70">
                            <thead className="bg-brand-ivory text-slate-200">
                                <tr>
                                    <th className="px-6 py-3">Date</th>
                                    <th className="px-6 py-3">Customer</th>
                                    <th className="px-6 py-3">Amount</th>
                                    <th className="px-6 py-3">Coupon</th>
                                    <th className="px-6 py-3">Gateway</th>
                                    <th className="px-6 py-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-olive/10">
                                {accountData.recentTransactions.length > 0 ? accountData.recentTransactions.map(t => (
                                    <tr key={t.id} className="hover:bg-brand-cream/50 transition">
                                        <td className="px-6 py-3 font-mono text-xs">
                                            {new Date(t.status === 'PAID' ? (t.payment_date || t.created_at) : t.created_at).toLocaleDateString()}
                                            <div className="text-[10px] text-slate-600">{new Date(t.status === 'PAID' ? (t.payment_date || t.created_at) : t.created_at).toLocaleTimeString()}</div>
                                        </td>
                                        <td className="px-6 py-3">
                                            <div className="text-brand-charcoal font-bold text-xs">{t.name}</div>
                                            <div className="text-[10px]">{t.phone}</div>
                                        </td>
                                        <td className="px-6 py-3 font-bold text-brand-charcoal">৳{t.amount}</td>
                                        <td className="px-6 py-3">
                                            {t.coupon_code ? (
                                                <span className="text-[10px] font-mono text-brand-sage font-bold uppercase">{t.coupon_code} (-৳{t.discount_amount})</span>
                                            ) : <span className="text-slate-600 text-[10px]">-</span>}
                                        </td>
                                        <td className="px-6 py-3 uppercase text-xs">{t.gateway}</td>
                                        <td className="px-6 py-3">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${t.status === 'PAID' ? 'bg-green-500/20 text-brand-leaf' : 'bg-orange-500/20 text-brand-brown'}`}>{t.status}</span>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan={6} className="text-center py-8 text-brand-charcoal/60">No recent transactions found.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        )}


        {/* TEAM TAB (Fixed) */}
        {activeTab === 'team' && adminProfile.role === 'SUPER_ADMIN' && (
             <div className="space-y-8 animate-fade-in-up">
                 <div className="bg-white p-6 rounded-xl border border-brand-olive/20">
                     <h3 className="text-lg font-bold text-brand-charcoal mb-4">Add Team Member</h3>
                     <form onSubmit={(e) => { e.preventDefault(); fetch('/api/admin.php?action=create_admin', { method: 'POST', body: JSON.stringify(newAdminForm) }).then(() => { showToast('Invited'); fetchAdmins(); }).catch(() => showToast('Error', 'error')); }} className="flex gap-4 items-end">
                         <div className="flex-1"><label className="block text-xs text-brand-charcoal/60 mb-1">Name</label><input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal" value={newAdminForm.name} onChange={e => setNewAdminForm({...newAdminForm, name: e.target.value})}/></div>
                         <div className="flex-1"><label className="block text-xs text-brand-charcoal/60 mb-1">Email</label><input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal" value={newAdminForm.email} onChange={e => setNewAdminForm({...newAdminForm, email: e.target.value})}/></div>
                         <div className="w-32"><label className="block text-xs text-brand-charcoal/60 mb-1">Role</label><select className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal" value={newAdminForm.role} onChange={e => setNewAdminForm({...newAdminForm, role: e.target.value})}><option value="SALES">Sales</option><option value="ACCOUNTS">Accounts</option><option value="SUPER_ADMIN">Admin</option></select></div>
                         <button className="bg-brand-olive text-brand-ivory px-4 py-2 rounded font-bold h-[42px]">Invite</button>
                     </form>
                 </div>
                 <div className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden">
                     <table className="w-full text-left text-sm text-brand-charcoal/70">
                         <thead className="bg-brand-ivory text-slate-200"><tr><th className="px-6 py-4">Name</th><th className="px-6 py-4">Role</th><th className="px-6 py-4">Status</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
                         <tbody className="divide-y divide-brand-olive/10">
                             {admins.map(a => (
                                 <tr key={a.id}>
                                     <td className="px-6 py-4"><div className="font-bold text-brand-charcoal">{a.name}</div><div className="text-xs">{a.email}</div></td>
                                     <td className="px-6 py-4"><span className="bg-brand-cream px-2 py-1 rounded text-xs">{a.role}</span></td>
                                     <td className="px-6 py-4"><span className="text-brand-leaf text-xs">{a.status}</span></td>
                                     <td className="px-6 py-4 text-right">{a.id !== adminProfile.id && <button onClick={() => fetch('/api/admin.php?action=delete_admin', {method:'POST', body: JSON.stringify({id:a.id})}).then(fetchAdmins).catch(() => showToast('Error', 'error'))} className="text-red-500"><Trash2 size={16}/></button>}</td>
                                 </tr>
                             ))}
                         </tbody>
                     </table>
                 </div>
             </div>
        )}

        {/* API & KEYS TAB (With Documentation) */}
        {activeTab === 'api' && adminProfile.role === 'SUPER_ADMIN' && (
             <div className="space-y-8 animate-fade-in-up">
                 <div className="bg-white p-6 rounded-xl border border-brand-olive/20">
                     <h3 className="text-lg font-bold text-brand-charcoal mb-4">API Documentation</h3>
                     <div className="space-y-6 text-brand-charcoal/70 text-sm">
                         <div>
                             <p className="mb-2"><strong className="text-brand-charcoal">Endpoint Base URL:</strong> <code className="bg-brand-ivory px-2 py-1 rounded">https://organic.shehzin.com/api/v1.php</code></p>
                             <p><strong className="text-brand-charcoal">Authentication:</strong> Send your API Key in the header <code>X-API-KEY</code>.</p>
                         </div>
                         <div className="border-t border-brand-olive/20 pt-4">
                             <strong className="text-brand-olive block mb-2">1. Get Orders</strong>
                             <code className="block bg-brand-ivory p-3 rounded mb-2 text-xs">GET /api/v1.php?endpoint=orders&page=1&limit=20&status=PAID</code>
                             <p>Returns a paginated list of orders. Optional params: <code>status</code> (PAID, PENDING).</p>
                         </div>
                         <div className="border-t border-brand-olive/20 pt-4">
                             <strong className="text-brand-olive block mb-2">2. Get Sales Report</strong>
                             <code className="block bg-brand-ivory p-3 rounded mb-2 text-xs">GET /api/v1.php?endpoint=sales_report&start_date=2023-01-01&end_date=2023-01-31</code>
                             <p>Returns daily revenue data for the specified date range.</p>
                         </div>
                     </div>
                 </div>

                 <div className="bg-white p-6 rounded-xl border border-brand-olive/20">
                     <h3 className="text-lg font-bold text-brand-charcoal mb-4">Generate Key</h3>
                     <div className="flex gap-4">
                         <input placeholder="Client Name" className="bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal flex-1" value={newClientName} onChange={e => setNewClientName(e.target.value)}/>
                         <button onClick={generateApiKey} className="bg-green-600 text-brand-charcoal px-4 rounded font-bold">Generate</button>
                     </div>
                 </div>

                 <div className="bg-white rounded-xl border border-brand-olive/20 p-6">
                     <h3 className="text-brand-charcoal font-bold mb-4">Active API Keys</h3>
                     {apiKeys.map(k => (
                         <div key={k.id} className="flex justify-between items-center border-b border-brand-olive/20 py-3 last:border-0">
                             <div><p className="font-bold text-brand-charcoal">{k.client_name}</p><p className="font-mono text-xs text-brand-charcoal/60">{k.api_key}</p></div>
                             <button onClick={() => fetch('/api/admin.php?action=revoke_api_key', {method:'POST', body: JSON.stringify({id: k.id})}).then(fetchApiKeys).catch(() => showToast('Error', 'error'))} className="text-red-500 text-sm">Revoke</button>
                         </div>
                     ))}
                 </div>
             </div>
        )}

        {/* SETTINGS (Expanded with Gateways, SMTP & SMS & TRACKING) */}
        {activeTab === 'settings' && adminProfile.role === 'SUPER_ADMIN' && (
            <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
                 
                 {/* Schema Fix Button */}
                 <div className="bg-white p-6 rounded-xl border border-brand-olive/20 flex items-center justify-between">
                     <div>
                        <h3 className="text-lg font-bold text-brand-charcoal flex items-center gap-2"><Database size={18} className="text-red-500"/> System Health & Setup</h3>
                        <p className="text-brand-charcoal/70 text-xs mt-1">Run this to fix database issues, add missing columns, or update database connection.</p>
                     </div>
                     <div className="flex gap-2">
                         <a href="/api/setup.php" target="_blank" rel="noreferrer" className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal font-bold py-2 px-4 rounded border border-brand-olive/20 transition text-sm flex items-center gap-2">
                             <Settings size={16} /> Database Setup Wizard
                         </a>
                         <button onClick={updateDatabase} className="bg-brand-cream hover:bg-brand-cream text-brand-charcoal font-bold py-2 px-4 rounded border border-brand-olive/20 transition text-sm flex items-center gap-2">
                            <RefreshCw size={16} /> Fix Database & Update Schema
                         </button>
                     </div>
                 </div>

                 {/* Product Pricing */}
                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-brand-charcoal">General Settings</h3>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                             <label className="text-xs text-brand-charcoal/60 block mb-2">Site Favicon</label>
                             <div className="flex items-center gap-4">
                                 {config.favicon_url ? (
                                     <img src={config.favicon_url} alt="Favicon" className="w-10 h-10 rounded bg-brand-cream p-1 border border-brand-olive/20 object-contain" />
                                 ) : (
                                     <div className="w-10 h-10 rounded bg-brand-cream border border-brand-olive/20 flex items-center justify-center text-brand-charcoal/60 text-xs">No Icon</div>
                                 )}
                                 <label className="cursor-pointer bg-brand-cream hover:bg-brand-cream text-brand-charcoal px-3 py-2 rounded text-xs flex items-center gap-2 border border-brand-olive/20">
                                     <UploadCloud size={14}/> Upload Favicon
                                     <input type="file" className="hidden" accept="image/x-icon,image/png,image/jpeg,image/svg+xml" onChange={handleFaviconUpload} />
                                 </label>
                             </div>
                             <p className="text-[10px] text-brand-charcoal/60 mt-2">Recommended: 32x32 PNG or ICO. Click "Save Configuration" below to apply.</p>
                         </div>
                     </div>
                 </div>

                 {/* Payment Gateways */}
                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><CreditCard size={20} className="text-pink-500"/> Payment Gateways</h3>
                     
                     <div className="space-y-6">
                         {/* bKash */}
                         <div className="p-4 border border-brand-olive/20 rounded-lg bg-brand-ivory/50">
                             <div className="flex justify-between items-center mb-4">
                                <h4 className="text-pink-500 font-bold">bKash Merchant</h4>
                                <select className="bg-white border border-brand-olive/20 text-brand-charcoal text-xs rounded px-2 py-1" value={config.bkash_mode || 'live'} onChange={e => setConfig({...config, bkash_mode: e.target.value})}>
                                    <option value="live">Live</option>
                                    <option value="sandbox">Sandbox</option>
                                </select>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div><label className="text-xs text-brand-charcoal/60 block mb-1">App Key</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.bkash_app_key || ''} onChange={e => setConfig({...config, bkash_app_key: e.target.value})}/></div>
                                 <div><label className="text-xs text-brand-charcoal/60 block mb-1">App Secret</label><input type="password" className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.bkash_app_secret || ''} onChange={e => setConfig({...config, bkash_app_secret: e.target.value})}/></div>
                                 <div><label className="text-xs text-brand-charcoal/60 block mb-1">Username</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.bkash_username || ''} onChange={e => setConfig({...config, bkash_username: e.target.value})}/></div>
                                 <div><label className="text-xs text-brand-charcoal/60 block mb-1">Password</label><input type="password" className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.bkash_password || ''} onChange={e => setConfig({...config, bkash_password: e.target.value})}/></div>
                             </div>
                         </div>

                         {/* SSLCommerz */}
                         <div className="p-4 border border-brand-olive/20 rounded-lg bg-brand-ivory/50">
                             <div className="flex justify-between items-center mb-4">
                                <h4 className="text-blue-500 font-bold">SSLCommerz</h4>
                                <select className="bg-white border border-brand-olive/20 text-brand-charcoal text-xs rounded px-2 py-1" value={config.ssl_mode || 'live'} onChange={e => setConfig({...config, ssl_mode: e.target.value})}>
                                    <option value="live">Live</option>
                                    <option value="sandbox">Sandbox</option>
                                </select>
                             </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                 <div><label className="text-xs text-brand-charcoal/60 block mb-1">Store ID</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.ssl_store_id || ''} onChange={e => setConfig({...config, ssl_store_id: e.target.value})}/></div>
                                 <div><label className="text-xs text-brand-charcoal/60 block mb-1">Store Password</label><input type="password" className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.ssl_store_pass || ''} onChange={e => setConfig({...config, ssl_store_pass: e.target.value})}/></div>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Tracking & Analytics (NEW) */}
                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><Activity size={20} className="text-purple-500"/> Tracking & Analytics</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">Google Analytics 4 (Measurement ID)</label><input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" placeholder="G-XXXXXXXXXX" value={config.ga4_id || ''} onChange={e => setConfig({...config, ga4_id: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">Google Tag Manager (Container ID)</label><input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" placeholder="GTM-XXXXXXX" value={config.gtm_id || ''} onChange={e => setConfig({...config, gtm_id: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">Facebook Pixel ID</label><input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" placeholder="1234567890" value={config.fb_pixel_id || ''} onChange={e => setConfig({...config, fb_pixel_id: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">Facebook Access Token (CAPI)</label><input type="password" className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" placeholder="EAA..." value={config.fb_access_token || ''} onChange={e => setConfig({...config, fb_access_token: e.target.value})}/></div>
                     </div>
                 </div>

                 {/* SMTP Settings */}
                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><Server size={20} className="text-green-500"/> Email SMTP Config</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">SMTP Host</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.smtp_host || ''} onChange={e => setConfig({...config, smtp_host: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">SMTP Port</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.smtp_port || ''} onChange={e => setConfig({...config, smtp_port: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">SMTP Email/User</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.smtp_user || ''} onChange={e => setConfig({...config, smtp_user: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">SMTP Password</label><input type="password" className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.smtp_pass || ''} onChange={e => setConfig({...config, smtp_pass: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">Sender Name</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.smtp_from_name || ''} onChange={e => setConfig({...config, smtp_from_name: e.target.value})}/></div>
                     </div>
                 </div>

                 {/* SMS Settings (NEW) */}
                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><MessageSquare size={20} className="text-brand-brown"/> SMS Configuration (BulkSMSBD)</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">API Key</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.sms_api_key || ''} onChange={e => setConfig({...config, sms_api_key: e.target.value})}/></div>
                         <div><label className="text-xs text-brand-charcoal/60 block mb-1">Sender ID</label><input className="w-full bg-white border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" value={config.sms_sender_id || ''} onChange={e => setConfig({...config, sms_sender_id: e.target.value})}/></div>
                     </div>
                 </div>

                 {/* OTO Settings (NEW) */}
                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-brand-charcoal flex items-center gap-2"><Zap size={20} className="text-indigo-500"/> One-Time Offer (OTO) Settings</h3>
                         <div className="flex items-center gap-2">
                             <label className="text-sm text-brand-charcoal/70">Enable OTO</label>
                             <button 
                                 onClick={() => setConfig({...config, oto_enabled: config.oto_enabled === '1' ? '0' : '1'})}
                                 className={`w-12 h-6 rounded-full transition-colors relative ${config.oto_enabled === '1' ? 'bg-indigo-500' : 'bg-slate-700'}`}
                             >
                                 <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.oto_enabled === '1' ? 'left-7' : 'left-1'}`}></div>
                             </button>
                         </div>
                     </div>
                     <div className="space-y-4">
                         <div>
                             <label className="text-xs text-brand-charcoal/60 block mb-1">OTO Image URL</label>
                             <input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" placeholder="https://example.com/image.jpg" value={config.oto_image_url || ''} onChange={e => setConfig({...config, oto_image_url: e.target.value})}/>
                         </div>
                         <div>
                             <label className="text-xs text-brand-charcoal/60 block mb-1">OTO Copy (HTML Supported)</label>
                             <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-3 text-brand-charcoal h-24 font-mono text-xs" placeholder="<p>Special offer text here...</p>" value={config.oto_copy || ''} onChange={e => setConfig({...config, oto_copy: e.target.value})}></textarea>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                             <div>
                                 <label className="text-xs text-brand-charcoal/60 block mb-1">Coupon Code</label>
                                 <input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs font-mono uppercase" placeholder="SPECIAL50" value={config.oto_coupon_code || ''} onChange={e => setConfig({...config, oto_coupon_code: e.target.value})}/>
                             </div>
                             <div>
                                 <label className="text-xs text-brand-charcoal/60 block mb-1">Offer Link (URL)</label>
                                 <input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" placeholder="https://example.com/checkout" value={config.oto_link || ''} onChange={e => setConfig({...config, oto_link: e.target.value})}/>
                             </div>
                         </div>
                     </div>
                 </div>

                 {/* Social Proof Settings (NEW) */}
                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <div className="flex justify-between items-center mb-6">
                         <h3 className="text-xl font-bold text-brand-charcoal flex items-center gap-2"><Users size={20} className="text-emerald-500"/> Social Proof Popups</h3>
                         <div className="flex gap-4">
                             <div className="flex items-center gap-2">
                                 <label className="text-sm text-brand-charcoal/70">Dummy Data</label>
                                 <button 
                                     onClick={() => setConfig({...config, social_proof_dummy_enabled: config.social_proof_dummy_enabled === '1' ? '0' : '1'})}
                                     className={`w-12 h-6 rounded-full transition-colors relative ${config.social_proof_dummy_enabled === '1' ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                 >
                                     <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.social_proof_dummy_enabled === '1' ? 'left-7' : 'left-1'}`}></div>
                                 </button>
                             </div>
                             <div className="flex items-center gap-2">
                                 <label className="text-sm text-brand-charcoal/70">Enable Popups</label>
                                 <button 
                                     onClick={() => setConfig({...config, social_proof_enabled: config.social_proof_enabled === '1' ? '0' : '1'})}
                                     className={`w-12 h-6 rounded-full transition-colors relative ${config.social_proof_enabled === '1' ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                 >
                                     <div className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${config.social_proof_enabled === '1' ? 'left-7' : 'left-1'}`}></div>
                                 </button>
                             </div>
                         </div>
                     </div>
                     
                     {config.social_proof_enabled === '1' && (
                        <div className="space-y-4 animate-fade-in-up">
                            <div className="flex items-center justify-between bg-brand-ivory p-3 rounded border border-brand-olive/20">
                                <div>
                                    <label className="text-sm text-brand-charcoal/80 font-medium">Show Dummy Data</label>
                                    <p className="text-xs text-brand-charcoal/60">If enabled, fake orders will be shown mixed with real orders.</p>
                                </div>
                                <button 
                                    onClick={() => setConfig({...config, social_proof_dummy_enabled: config.social_proof_dummy_enabled === '1' ? '0' : '1'})}
                                    className={`w-10 h-5 rounded-full transition-colors relative ${config.social_proof_dummy_enabled === '1' ? 'bg-emerald-500' : 'bg-slate-700'}`}
                                >
                                    <div className={`w-3 h-3 rounded-full bg-white absolute top-1 transition-transform ${config.social_proof_dummy_enabled === '1' ? 'left-6' : 'left-1'}`}></div>
                                </button>
                            </div>

                            <div>
                                <label className="text-xs text-brand-charcoal/60 block mb-1">Message Templates (Randomly Selected)</label>
                                <div className="space-y-2">
                                    {(() => {
                                        let templates: string[] = [];
                                        try {
                                            const parsed = JSON.parse(config.social_proof_templates || '[]');
                                            if (Array.isArray(parsed)) {
                                                templates = parsed;
                                            }
                                        } catch (e) {
                                            templates = [];
                                        }
                                        if (templates.length === 0 && config.social_proof_msg) {
                                            templates = [config.social_proof_msg];
                                        }
                                        
                                        return (
                                            <>
                                                {templates.map((template, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input 
                                                            className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" 
                                                            value={template} 
                                                            onChange={e => {
                                                                const newTemplates = [...templates];
                                                                newTemplates[index] = e.target.value;
                                                                setConfig({...config, social_proof_templates: JSON.stringify(newTemplates)});
                                                            }}
                                                        />
                                                        <button 
                                                            onClick={() => {
                                                                const newTemplates = templates.filter((_, i) => i !== index);
                                                                setConfig({...config, social_proof_templates: JSON.stringify(newTemplates)});
                                                            }}
                                                            className="text-red-500 hover:text-red-400 p-2"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                ))}
                                                <button 
                                                    onClick={() => {
                                                        const newTemplates = [...templates, ''];
                                                        setConfig({...config, social_proof_templates: JSON.stringify(newTemplates)});
                                                    }}
                                                    className="text-xs text-brand-olive hover:text-cyan-300 flex items-center gap-1 mt-2"
                                                >
                                                    + Add Variation
                                                </button>
                                            </>
                                        );
                                    })()}
                                </div>
                                <p className="text-[10px] text-brand-charcoal/60 mt-2">Use <code>{'{name}'}</code> for customer name and <code>{'{location}'}</code> for random BD district (in Bengali).</p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-brand-charcoal/60 block mb-1">Initial Delay (Seconds)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" 
                                        value={config.social_proof_delay || 5} 
                                        onChange={e => setConfig({...config, social_proof_delay: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-brand-charcoal/60 block mb-1">Display Duration (Seconds)</label>
                                    <input 
                                        type="number" 
                                        className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" 
                                        value={config.social_proof_duration || 5} 
                                        onChange={e => setConfig({...config, social_proof_duration: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>
                     )}
                 </div>

                 {/* Save Button */}
                 <div className="flex justify-between items-center sticky bottom-6 z-10 bg-brand-ivory/80 backdrop-blur p-4 rounded-xl border border-brand-olive/20">
                    <button 
                        onClick={updateDatabase}
                        className="text-xs text-brand-charcoal/60 hover:text-brand-charcoal underline"
                    >
                        Update Database Schema
                    </button>
                    <button onClick={updateConfig} className="bg-brand-olive hover:bg-brand-leaf text-brand-ivory font-bold py-3 px-8 rounded-xl shadow-xl flex items-center gap-2 transform transition hover:scale-105">
                        <Save size={20} /> Save Configuration
                    </button>
                 </div>
            </div>
        )}

        {/* OTHER TABS (Marketing, Automation, Profile - Cleaned) */}
        {activeTab === 'marketing' && adminProfile.role === 'SUPER_ADMIN' && (
             <div className="max-w-2xl mx-auto bg-white rounded-xl border border-brand-olive/20 p-8 animate-fade-in-up">
                <h3 className="text-xl font-bold text-brand-charcoal mb-6">Bulk Marketing</h3>
                <div className="space-y-4">
                    <select className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-3 text-brand-charcoal" value={bulkForm.target_status} onChange={e => setBulkForm({...bulkForm, target_status: e.target.value})}><option value="PENDING">Pending</option><option value="PAID">Paid</option><option value="ALL">Everyone</option></select>
                    <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-3 text-brand-charcoal h-32" placeholder="Message..." value={bulkForm.message} onChange={e => setBulkForm({...bulkForm, message: e.target.value})}></textarea>
                    <button 
                        disabled={isBulkSending}
                        onClick={async () => { 
                            if(confirm('Send?')) {
                                setIsBulkSending(true);
                                try {
                                    await fetch('/api/admin.php?action=bulk_send', {method:'POST', body: JSON.stringify(bulkForm)});
                                    showToast('Messages Sent Successfully');
                                    setBulkForm({ target_status: 'PENDING', type: 'sms', message: '', subject: '' });
                                } catch (e) {
                                    showToast('Failed to send messages', 'error');
                                } finally {
                                    setIsBulkSending(false);
                                }
                            } 
                        }} 
                        className="w-full bg-brand-olive hover:bg-brand-leaf disabled:opacity-50 text-brand-ivory font-bold py-3 rounded transition flex items-center justify-center gap-2"
                    >
                        {isBulkSending ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                        {isBulkSending ? 'Sending...' : 'Send Bulk Message'}
                    </button>
                </div>
             </div>
        )}

        {activeTab === 'messages' && adminProfile.role === 'SUPER_ADMIN' && (
             <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                 <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-brand-charcoal">Success Messages</h3>
                    <button onClick={() => {
                        setConfig({
                            ...config,
                            success_email_subject: 'Download Your অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট eBook',
                            success_email_body: '',
                            success_sms_content: 'Your ebook order is approved! Check email for download link. Help: https://m.me/learningbangladesh71 - Shehzin.com'
                        });
                        alert('Reset to Defaults. Click Save to apply.');
                    }} className="bg-brand-cream text-brand-olive px-4 py-2 rounded font-bold border border-brand-olive/20 hover:bg-brand-cream">Reset to Defaults</button>
                 </div>

                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><Mail size={20} className="text-green-500"/> Email Configuration</h3>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs text-brand-charcoal/60 mb-1">Email Subject</label>
                             <input className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-3 text-brand-charcoal" value={config.success_email_subject || ''} onChange={e => setConfig({...config, success_email_subject: e.target.value})} />
                         </div>
                         <div>
                             <label className="block text-xs text-brand-charcoal/60 mb-1">Email Body (HTML Supported)</label>
                             <div className="text-[10px] text-brand-charcoal/60 mb-2">Available Placeholders: <code>{'{name}'}</code>, <code>{'{order_id}'}</code>, <code>{'{download_link}'}</code>, <code>{'{site_url}'}</code>. Leave empty to use system default template.</div>
                             <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-3 text-brand-charcoal h-64 font-mono text-xs" value={config.success_email_body || ''} onChange={e => setConfig({...config, success_email_body: e.target.value})}></textarea>
                         </div>
                     </div>
                 </div>

                 <div className="bg-white p-8 rounded-xl border border-brand-olive/20">
                     <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><MessageSquare size={20} className="text-brand-brown"/> SMS Configuration</h3>
                     <div className="space-y-4">
                         <div>
                             <label className="block text-xs text-brand-charcoal/60 mb-1">SMS Content</label>
                             <div className="text-[10px] text-brand-charcoal/60 mb-2">Available Placeholders: <code>{'{name}'}</code>, <code>{'{order_id}'}</code>, <code>{'{download_link}'}</code>, <code>{'{site_url}'}</code></div>
                             <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-3 text-brand-charcoal h-24" value={config.success_sms_content || ''} onChange={e => setConfig({...config, success_sms_content: e.target.value})}></textarea>
                         </div>
                     </div>
                 </div>

                 <div className="flex justify-end sticky bottom-6 z-10">
                    <button onClick={updateConfig} className="bg-brand-olive hover:bg-brand-leaf text-brand-ivory font-bold py-3 px-8 rounded-xl shadow-xl flex items-center gap-2 transform transition hover:scale-105">
                        <Save size={20} /> Save Messages
                    </button>
                 </div>
             </div>
        )}

        {activeTab === 'automation' && adminProfile.role === 'SUPER_ADMIN' && (
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-2xl font-bold text-brand-charcoal">Funnel Automation</h3>
                    <div className="flex gap-2">
                        <button onClick={loadOrganicDefaults} className="bg-brand-cream text-brand-olive px-4 py-2 rounded font-bold border border-brand-olive/20 hover:bg-brand-cream">Reset to Organic Defaults</button>
                        <button onClick={() => { if(confirm('Run?')) fetch('/api/admin.php?action=run_automation').then(()=>showToast('Done')).catch(() => showToast('Error', 'error')); }} className="bg-red-600 text-brand-charcoal px-4 py-2 rounded font-bold flex items-center gap-2"><Zap size={16}/> Run Now</button>
                    </div>
                </div>

                <div className="flex gap-4 border-b border-brand-olive/20 mb-6">
                    <button onClick={() => setAutomationTab('pending')} className={`pb-2 px-4 font-bold border-b-2 transition ${automationTab === 'pending' ? 'border-brand-olive text-brand-olive' : 'border-transparent text-brand-charcoal/60 hover:text-brand-charcoal/80'}`}>Pending Orders (Recovery)</button>
                    <button onClick={() => setAutomationTab('paid')} className={`pb-2 px-4 font-bold border-b-2 transition ${automationTab === 'paid' ? 'border-brand-olive text-brand-olive' : 'border-transparent text-brand-charcoal/60 hover:text-brand-charcoal/80'}`}>Paid Orders (Upsell)</button>
                </div>

                  {/* Automation Settings */}
                  {automationTab === 'pending' ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {['day1', 'day3', 'day5'].map((day, idx) => (
                              <div key={day} className="bg-white border border-brand-olive/20 rounded-xl p-6">
                                  <h4 className="text-brand-charcoal font-bold mb-4 flex justify-between items-center">
                                      <span>Step {idx+1}</span>
                                      <span className="text-xs text-brand-charcoal/60 font-normal">({day})</span>
                                  </h4>
                                  <div className="mb-4">
                                      <label className="block text-xs text-brand-charcoal/60 mb-1">Delay (Hours after Order)</label>
                                      <input 
                                          type="number" 
                                          className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" 
                                          placeholder="e.g. 1, 24, 72" 
                                          value={automationConfig[day]?.delay || ''} 
                                          onChange={e => setAutomationConfig({...automationConfig, [day]: {...automationConfig[day], delay: e.target.value}})} 
                                      />
                                  </div>
                                  <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs h-20 mb-2" placeholder="SMS Content" value={automationConfig[day]?.sms || ''} onChange={e => setAutomationConfig({...automationConfig, [day]: {...automationConfig[day], sms: e.target.value}})}></textarea>
                                  <input type="text" className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs mb-2" placeholder="Email Subject" value={automationConfig[day]?.email_subject || ''} onChange={e => setAutomationConfig({...automationConfig, [day]: {...automationConfig[day], email_subject: e.target.value}})} />
                                  <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs h-28" placeholder="Email Body (HTML)" value={automationConfig[day]?.email_body || ''} onChange={e => setAutomationConfig({...automationConfig, [day]: {...automationConfig[day], email_body: e.target.value}})}></textarea>
                              </div>
                          ))}
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {['paid_level1', 'paid_level2', 'paid_level3'].map((level, idx) => (
                              <div key={level} className="bg-white border border-brand-olive/20 rounded-xl p-6">
                                  <h4 className="text-brand-charcoal font-bold mb-4">
                                      {idx === 0 ? 'Level 1' : idx === 1 ? 'Level 2' : 'Level 3'}
                                  </h4>
                                  <div className="mb-4">
                                      <label className="block text-xs text-brand-charcoal/60 mb-1">Delay (Hours after Order)</label>
                                      <input 
                                          type="number" 
                                          className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs" 
                                          placeholder="e.g. 24" 
                                          value={automationConfig[level]?.delay || ''} 
                                          onChange={e => setAutomationConfig({...automationConfig, [level]: {...automationConfig[level], delay: e.target.value}})} 
                                      />
                                  </div>
                                  <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs h-20 mb-2" placeholder="SMS Content" value={automationConfig[level]?.sms || ''} onChange={e => setAutomationConfig({...automationConfig, [level]: {...automationConfig[level], sms: e.target.value}})}></textarea>
                                  <input type="text" className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs mb-2" placeholder="Email Subject" value={automationConfig[level]?.email_subject || ''} onChange={e => setAutomationConfig({...automationConfig, [level]: {...automationConfig[level], email_subject: e.target.value}})} />
                                  <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded p-2 text-brand-charcoal text-xs h-28" placeholder="Email Body (HTML)" value={automationConfig[level]?.email_body || ''} onChange={e => setAutomationConfig({...automationConfig, [level]: {...automationConfig[level], email_body: e.target.value}})}></textarea>
                              </div>
                          ))}
                      </div>
                  )}

                  <button onClick={() => fetch('/api/admin.php?action=save_automation_settings', {method:'POST', body: JSON.stringify(automationConfig)}).then(()=>showToast('Saved')).catch(() => showToast('Error', 'error'))} className="bg-green-600 text-brand-charcoal px-6 py-2 rounded font-bold float-right">Save Config</button>
                  
                  <div className="mt-12 pt-12 border-t border-brand-olive/20">
                      <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
                          <h3 className="text-xl font-bold text-brand-charcoal">Automation Logs</h3>
                          <div className="flex flex-wrap gap-2 items-center">
                              <select 
                                  className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs"
                                  value={logFilters.status}
                                  onChange={e => { setLogFilters({...logFilters, status: e.target.value}); setLogPage(1); }}
                              >
                                  <option value="ALL">All Status</option>
                                  <option value="SENT">Sent</option>
                                  <option value="FAILED">Failed</option>
                              </select>
                              <input 
                                  type="date" 
                                  className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs"
                                  value={logFilters.start_date}
                                  onChange={e => { setLogFilters({...logFilters, start_date: e.target.value}); setLogPage(1); }}
                              />
                              <input 
                                  type="date" 
                                  className="bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal text-xs"
                                  value={logFilters.end_date}
                                  onChange={e => { setLogFilters({...logFilters, end_date: e.target.value}); setLogPage(1); }}
                              />
                              <button onClick={fetchAutomationLogs} className="bg-brand-cream text-brand-olive px-3 py-1 rounded text-xs font-bold border border-brand-olive/20 hover:bg-brand-cream flex items-center gap-2"><RefreshCw size={14}/> Refresh</button>
                          </div>
                      </div>
                      <div className="bg-white rounded-xl border border-brand-olive/20 overflow-hidden">
                          <table className="w-full text-left text-sm text-brand-charcoal/70">
                              <thead className="bg-brand-ivory text-slate-200">
                                  <tr>
                                      <th className="px-6 py-4">Time</th>
                                      <th className="px-6 py-4">Order</th>
                                      <th className="px-6 py-4">Type</th>
                                      <th className="px-6 py-4">Message</th>
                                      <th className="px-6 py-4">Status</th>
                                  </tr>
                              </thead>
                              <tbody className="divide-y divide-brand-olive/10">
                                  {automationLogs.length > 0 ? automationLogs.map(log => (
                                      <tr key={log.id} className="hover:bg-brand-cream/50 transition">
                                          <td className="px-6 py-4 whitespace-nowrap">{new Date(log.created_at).toLocaleString()}</td>
                                          <td className="px-6 py-4">
                                              <div className="font-bold text-brand-charcoal">{log.name}</div>
                                              <div className="text-xs">{log.phone}</div>
                                          </td>
                                          <td className="px-6 py-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${log.action_type === 'SMS' ? 'bg-blue-900/30 text-brand-olive' : 'bg-purple-900/30 text-brand-sage'}`}>{log.action_type}</span></td>
                                          <td className="px-6 py-4 text-xs max-w-xs truncate" title={log.message}>{log.message}</td>
                                          <td className="px-6 py-4">
                                              <span className={`px-2 py-1 rounded text-[10px] font-bold ${log.status === 'SENT' ? 'bg-green-900/30 text-brand-leaf' : 'bg-red-900/30 text-red-400'}`}>{log.status}</span>
                                          </td>
                                      </tr>
                                  )) : (
                                      <tr><td colSpan={5} className="text-center py-12 text-brand-charcoal/60">No logs found.</td></tr>
                                  )}
                              </tbody>
                          </table>
                          
                          {/* Pagination Controls */}
                          <div className="bg-brand-ivory p-4 border-t border-brand-olive/20 flex justify-between items-center">
                              <button 
                                  disabled={logPage === 1}
                                  onClick={() => setLogPage(p => Math.max(1, p - 1))}
                                  className="px-3 py-1 bg-brand-cream rounded text-xs text-brand-charcoal disabled:opacity-50 hover:bg-brand-cream"
                              >
                                  Previous
                              </button>
                              <span className="text-xs text-brand-charcoal/70">Page {logPage} of {logTotalPages}</span>
                              <button 
                                  disabled={logPage === logTotalPages}
                                  onClick={() => setLogPage(p => Math.min(logTotalPages, p + 1))}
                                  className="px-3 py-1 bg-brand-cream rounded text-xs text-brand-charcoal disabled:opacity-50 hover:bg-brand-cream"
                              >
                                  Next
                              </button>
                          </div>
                      </div>
                  </div>
            </div>
        )}

        {activeTab === 'profile' && (
            <div className="max-w-xl mx-auto space-y-8 animate-fade-in-up">
                 <div className="bg-white rounded-xl border border-brand-olive/20 p-8 text-center">
                     <div className="w-20 h-20 bg-brand-olive/20 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-olive font-bold text-2xl">{adminProfile.name.charAt(0)}</div>
                     <h2 className="text-2xl font-bold text-brand-charcoal">{adminProfile.name}</h2>
                     <p className="text-brand-olive font-medium mt-1">{adminProfile.role.replace('_', ' ')}</p>
                     <p className="text-brand-charcoal/60 text-sm mt-1">{adminProfile.email}</p>
                 </div>
                 <div className="bg-white rounded-xl border border-brand-olive/20 p-8">
                     <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2"><Lock size={20}/> Change Password</h3>
                     <div className="space-y-4">
                         <div><label className="block text-sm text-brand-charcoal/70 mb-2">New Password</label><input type="password" placeholder="Enter new password" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={profileForm.password} onChange={e => setProfileForm({password: e.target.value})} /></div>
                         <button onClick={async () => { if(!profileForm.password) return; try { await fetch('/api/admin.php?action=update_profile', { method: 'POST', body: JSON.stringify(profileForm) }); showToast('Password Updated'); setProfileForm({password: ''}); } catch (e) { showToast('Error', 'error'); } }} className="w-full bg-brand-olive text-brand-ivory font-bold py-3 rounded-lg hover:bg-brand-leaf">Update Password</button>
                     </div>
                 </div>
            </div>
        )}

      </div>
      
      {/* COUPON MODAL */}
      {isCouponModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-brand-olive/20 w-full max-w-md p-6 animate-fade-in-up">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-brand-charcoal">{couponForm.id ? 'Edit Coupon' : 'Create Coupon'}</h3>
                    <button onClick={() => setIsCouponModalOpen(false)} className="text-brand-charcoal/70 hover:text-brand-charcoal"><X size={20}/></button>
                </div>
                <form onSubmit={saveCoupon} className="space-y-4">
                    <div>
                        <label className="block text-xs text-brand-charcoal/70 mb-1">Coupon Code</label>
                        <input type="text" required className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal font-mono uppercase" placeholder="SUMMER2024" value={couponForm.code} onChange={e => setCouponForm({...couponForm, code: e.target.value})} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Type</label>
                            <select className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={couponForm.type} onChange={e => setCouponForm({...couponForm, type: e.target.value})}>
                                <option value="fixed">Fixed Amount (৳)</option>
                                <option value="percent">Percentage (%)</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Amount</label>
                            <input type="number" required className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" placeholder="50" value={couponForm.amount} onChange={e => setCouponForm({...couponForm, amount: e.target.value})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Expiry Date (Optional)</label>
                            <input type="date" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={couponForm.expiry_date || ''} onChange={e => setCouponForm({...couponForm, expiry_date: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Usage Limit (-1 for ∞)</label>
                            <input type="number" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={couponForm.usage_limit} onChange={e => setCouponForm({...couponForm, usage_limit: e.target.value})} />
                        </div>
                    </div>
                    <button className="w-full bg-brand-olive hover:bg-brand-leaf text-brand-ivory font-bold py-3 rounded-lg mt-4">Save Coupon</button>
                </form>
            </div>
        </div>
      )}

      {/* PRODUCT MODAL */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-white rounded-xl border border-brand-olive/20 w-full max-w-lg p-6 animate-fade-in-up max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-brand-charcoal">{productForm.id ? 'Edit Product' : 'Add Product'}</h3>
                    <button onClick={() => setIsProductModalOpen(false)} className="text-brand-charcoal/70 hover:text-brand-charcoal"><X size={20}/></button>
                </div>
                <form onSubmit={saveProduct} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Product Name</label>
                            <input type="text" required className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Type</label>
                            <select className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={productForm.type} onChange={e => setProductForm({...productForm, type: e.target.value})}>
                                <option value="upsell">Upsell / Order Bump</option>
                                <option value="main">Main Product</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Price (৳)</label>
                            <input type="number" required className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Regular Price (৳) - Optional</label>
                            <input type="number" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={productForm.regular_price || ''} onChange={e => setProductForm({...productForm, regular_price: e.target.value})} placeholder="Crossed out price" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="block text-xs text-brand-charcoal/70 mb-1">Description / Copy</label>
                        <textarea className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal h-20 text-xs" placeholder="Short persuasive copy for the bump offer..." value={productForm.description || ''} onChange={e => setProductForm({...productForm, description: e.target.value})}></textarea>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Product Image</label>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-brand-cream hover:bg-brand-cream text-brand-charcoal px-3 py-2 rounded text-xs flex items-center gap-2 border border-brand-olive/20">
                                    <UploadCloud size={14}/> Upload
                                    <input type="file" className="hidden" accept="image/*" onChange={e => handleFileUpload(e, 'image_url')} />
                                </label>
                                {productForm.image_url && <span className="text-brand-leaf text-[10px]">Uploaded</span>}
                            </div>
                            <input type="text" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal/60 text-[10px] mt-1" placeholder="Or Image URL" value={productForm.image_url || ''} onChange={e => setProductForm({...productForm, image_url: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Product File (PDF)</label>
                            <div className="flex items-center gap-2">
                                <label className="cursor-pointer bg-brand-cream hover:bg-brand-cream text-brand-charcoal px-3 py-2 rounded text-xs flex items-center gap-2 border border-brand-olive/20">
                                    <UploadCloud size={14}/> Upload PDF
                                    <input type="file" className="hidden" accept=".pdf" onChange={e => handleFileUpload(e, 'file_url')} />
                                </label>
                                {productForm.file_url && <span className="text-brand-leaf text-[10px]">Uploaded</span>}
                            </div>
                            <input type="text" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-2 py-1 text-brand-charcoal/60 text-[10px] mt-1" placeholder="Or File URL" value={productForm.file_url || ''} onChange={e => setProductForm({...productForm, file_url: e.target.value})} />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-brand-charcoal/70 mb-1">Status</label>
                            <select className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={productForm.status} onChange={e => setProductForm({...productForm, status: e.target.value})}>
                                <option value="ACTIVE">Active</option>
                                <option value="INACTIVE">Inactive</option>
                            </select>
                        </div>
                        {productForm.type === 'main' && (
                            <div>
                                <label className="block text-xs text-brand-charcoal/70 mb-1">Page Count (e.g. ১৩৫+)</label>
                                <input type="text" className="w-full bg-brand-ivory border border-brand-olive/20 rounded px-4 py-2 text-brand-charcoal" value={productForm.page_count || ''} onChange={e => setProductForm({...productForm, page_count: e.target.value})} placeholder="১৩৫+" />
                            </div>
                        )}
                    </div>

                    <button className="w-full bg-brand-olive hover:bg-brand-leaf text-brand-ivory font-bold py-3 rounded-lg mt-4">Save Product</button>
                </form>
            </div>
        </div>
      )}

      {/* ORDER MODAL (RESTORED ALL FIELDS) */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}></div>
            <div className="relative w-full max-w-2xl bg-white h-full shadow-2xl border-l border-brand-olive/20 overflow-y-auto animate-float-in-right">
                 <div className="p-6 border-b border-brand-olive/20 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
                     <div><h3 className="text-xl font-bold text-brand-charcoal">Order #{selectedOrder.id}</h3><span className="text-xs text-brand-charcoal/60">{new Date(selectedOrder.payment_date || selectedOrder.created_at).toLocaleString()}</span></div>
                     <button onClick={() => setSelectedOrder(null)}><X className="text-brand-charcoal/70 hover:text-brand-charcoal" /></button>
                 </div>
                 <div className="p-8 space-y-6">
                      <div className="bg-brand-ivory p-6 rounded-xl border border-brand-olive/20 grid grid-cols-2 gap-4">
                          {/* Status & Gateway */}
                          <div>
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Status</label>
                              <select className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm" value={crmForm.status} onChange={e => setCrmForm({...crmForm, status: e.target.value})}>
                                  <option value="PENDING">PENDING</option>
                                  <option value="PAID">PAID</option>
                                  <option value="CANCELLED">CANCELLED</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Gateway</label>
                              <div className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm font-mono uppercase">{crmForm.gateway}</div>
                          </div>

                          {/* Personal Info */}
                          <div className="col-span-2"><h4 className="text-brand-charcoal font-bold border-b border-brand-olive/20 pb-2 mt-2 mb-2 flex items-center gap-2"><Users size={16}/> Customer Info</h4></div>
                          
                          <div>
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Name</label>
                              <input className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm" value={crmForm.name || ''} onChange={e => setCrmForm({...crmForm, name: e.target.value})}/>
                          </div>
                          <div>
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Phone</label>
                              <input className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm" value={crmForm.phone || ''} onChange={e => setCrmForm({...crmForm, phone: e.target.value})}/>
                          </div>
                          <div className="col-span-2">
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Email</label>
                              <input className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm" value={crmForm.email || ''} onChange={e => setCrmForm({...crmForm, email: e.target.value})}/>
                          </div>

                          {/* Extra Details */}
                          <div>
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Profession</label>
                              <input className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm" placeholder="e.g. Engineer" value={crmForm.profession || ''} onChange={e => setCrmForm({...crmForm, profession: e.target.value})}/>
                          </div>
                          <div>
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Age</label>
                              <input type="number" className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm" placeholder="e.g. 28" value={crmForm.age || ''} onChange={e => setCrmForm({...crmForm, age: e.target.value})}/>
                          </div>
                          <div className="col-span-2">
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Location</label>
                              <input className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full text-sm" placeholder="e.g. Dhaka" value={crmForm.location || ''} onChange={e => setCrmForm({...crmForm, location: e.target.value})}/>
                          </div>

                          {/* Notes */}
                          <div className="col-span-2">
                              <label className="block text-xs text-brand-charcoal/60 mb-1">Admin Notes</label>
                              <textarea className="bg-white border border-brand-olive/20 text-brand-charcoal rounded p-2 w-full h-24 text-sm" placeholder="Internal notes..." value={crmForm.admin_notes || ''} onChange={e => setCrmForm({...crmForm, admin_notes: e.target.value})}></textarea>
                          </div>
                          
                          <button onClick={saveOrderDetails} className="col-span-2 bg-brand-olive text-brand-ivory font-bold py-3 rounded-lg hover:bg-brand-leaf transition shadow-lg mt-2">Save Changes</button>
                      </div>

                      <div className="border-t border-brand-olive/20 pt-6">
                          <h4 className="text-brand-charcoal font-bold mb-4">Quick Actions</h4>
                          <div className="flex gap-4 mb-4">
                              <button onClick={() => {if(confirm('Resend Email?')) fetch('/api/admin.php?action=resend_notification', {method:'POST', body:JSON.stringify({order_id:selectedOrder.id, type:'email'})}).then(res=>res.json()).then(d=>showToast(d.success?'Email Sent':'Failed','success')).catch(()=>showToast('Error','error'))}} className="flex-1 bg-brand-cream p-3 rounded-lg text-brand-charcoal/80 hover:text-brand-charcoal flex justify-center items-center gap-2 border border-brand-olive/20 transition hover:bg-brand-cream"><Mail size={18}/> Resend Email</button>
                              <button onClick={() => {if(confirm('Resend SMS?')) fetch('/api/admin.php?action=resend_notification', {method:'POST', body:JSON.stringify({order_id:selectedOrder.id, type:'sms'})}).then(res=>res.json()).then(d=>showToast(d.success?'SMS Sent':'Failed','success')).catch(()=>showToast('Error','error'))}} className="flex-1 bg-brand-cream p-3 rounded-lg text-brand-charcoal/80 hover:text-brand-charcoal flex justify-center items-center gap-2 border border-brand-olive/20 transition hover:bg-brand-cream"><Smartphone size={18}/> Resend SMS</button>
                              <a href={`/api/download.php?order_id=${selectedOrder.id}`} target="_blank" rel="noreferrer" className="flex-1 bg-brand-cream p-3 rounded-lg text-brand-charcoal/80 hover:text-brand-charcoal flex justify-center items-center gap-2 border border-brand-olive/20 transition hover:bg-brand-cream"><Download size={18}/> Download PDF</a>
                          </div>
                          <div className="bg-white p-4 rounded-xl border border-brand-olive/20">
                               <label className="text-xs text-brand-charcoal/60 mb-2 block">Send Custom SMS</label>
                               <textarea className="w-full bg-white border border-brand-olive/20 rounded p-3 text-brand-charcoal text-sm h-20 mb-3 focus:border-brand-olive transition outline-none" placeholder="Type message..." value={customMsgForm.message} onChange={e => setCustomMsgForm({...customMsgForm, message: e.target.value})}></textarea>
                               <button onClick={() => fetch('/api/admin.php?action=send_custom_message', {method:'POST', body:JSON.stringify({...customMsgForm, order_id:selectedOrder.id})}).then(res=>res.json()).then(d=>showToast(d.success?'Message Sent':'Failed', d.success?'success':'error')).catch(()=>showToast('Error','error'))} className="bg-white text-black px-4 py-2 rounded text-xs font-bold hover:bg-slate-200 transition">Send SMS</button>
                          </div>
                      </div>
                 </div>
            </div>
        </div>
      )}

    </div>
  );
};

const AdminDashboard: React.FC = () => {
    return (
        <ToastProvider>
            <AdminDashboardContent />
        </ToastProvider>
    );
};

export default AdminDashboard;