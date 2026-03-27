import React, { useState, useEffect } from 'react';
import { X, Lock, CheckCircle, Smartphone, CreditCard, Mail, ArrowRight, Clock } from 'lucide-react';
import { toBengaliNumber } from '../utils';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  price: number;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, price }) => {
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'form' | 'already_paid'>('form');
  const [step, setStep] = useState<'details' | 'upsell'>('details');
  const [resendStatus, setResendStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [showCoupon, setShowCoupon] = useState(false);
  
  // Upsell State
  const [upsells, setUpsells] = useState<any[]>([]);
  const [mainProduct, setMainProduct] = useState<any>(null);
  const [selectedUpsellIds, setSelectedUpsellIds] = useState<number[]>([]);
  const [isFetchingProducts, setIsFetchingProducts] = useState(false);

  // Coupon Timer State
  const [couponTimer, setCouponTimer] = useState<number | null>(null);
  const [timerSettings, setTimerSettings] = useState({ enabled: false, duration: 60 });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gateway: 'bkash',
    coupon_code: '',
    upsell_ids: [] as number[]
  });

  const [couponState, setCouponState] = useState<{
    valid: boolean;
    message: string;
    discount: number;
    finalPrice: number;
    code: string;
  }>({ valid: false, message: '', discount: 0, finalPrice: price, code: '' });

  // Fetch Upsells and Settings on Open
  useEffect(() => {
     const fetchData = async () => {
         if (!isOpen) return;

         console.log('Modal Opened. Fetching products...');
         setIsFetchingProducts(true);

         // Fetch Products
         try {
             const productsRes = await fetch(`/api/get_public_products.php?t=${Date.now()}`);
             const productsData = await productsRes.json();
             console.log('Products fetched:', productsData);
             const activeUpsells = (productsData.products || []).filter((p: any) => p.type === 'upsell' && p.status === 'ACTIVE');
             const mainP = (productsData.products || []).find((p: any) => p.type === 'main' && p.status === 'ACTIVE');
             console.log('Active Upsells:', activeUpsells);
             setUpsells(activeUpsells);
             setMainProduct(mainP);
             setSelectedUpsellIds(activeUpsells.map((u: any) => u.id));
         } catch (err) {
             console.error('Error fetching products:', err);
         }

         // Fetch Settings (Independent)
         try {
             const settingsRes = await fetch(`/api/get_public_settings.php?t=${Date.now()}`);
             const settingsData = await settingsRes.json();
             if (settingsData.coupon_timer_enabled === '1') {
                 setTimerSettings({ enabled: true, duration: parseInt(settingsData.coupon_timer_duration || '60') });
             }
         } catch (err) {
             console.error('Error fetching settings:', err);
         }

         setIsFetchingProducts(false);

         // Reset State
         setCouponState({ valid: false, message: '', discount: 0, finalPrice: price, code: '' });
         setFormData(prev => ({ ...prev, coupon_code: '', upsell_ids: [] }));
         setShowCoupon(false);
         setStep('details');
         setView('form');
         setCouponTimer(null);
     };

     fetchData();
  }, [isOpen, price]);

  // Countdown Timer Logic
  useEffect(() => {
      if (couponTimer !== null && couponTimer > 0) {
          const timerId = setTimeout(() => setCouponTimer(couponTimer - 1), 1000);
          return () => clearTimeout(timerId);
      } else if (couponTimer === 0) {
          // Timer expired logic (optional: remove coupon or just show expired)
      }
  }, [couponTimer]);

  // Calculate Totals
  const upsellTotal = upsells.filter(u => selectedUpsellIds.includes(u.id)).reduce((sum, u) => sum + Number(u.price), 0);
  const upsellRegularTotal = upsells.filter(u => selectedUpsellIds.includes(u.id)).reduce((sum, u) => sum + (Number(u.regular_price) || Number(u.price)), 0);
  
  const subTotal = price + upsellTotal;
  const regularSubTotal = (mainProduct?.regular_price ? Number(mainProduct.regular_price) : price) + upsellRegularTotal;
  const totalDiscount = regularSubTotal - subTotal;
  
  // Re-validate coupon when total changes
  useEffect(() => {
      if (couponState.valid) {
          if (formData.coupon_code) handleApplyCoupon();
      } else {
          setCouponState(prev => ({ ...prev, finalPrice: subTotal }));
      }
  }, [subTotal]);

  const handleApplyCoupon = async () => {
      if(!formData.coupon_code) return;
      setCouponState(prev => ({ ...prev, message: 'Checking...' }));
      
      try {
          const res = await fetch('/api/validate_coupon.php', {
              method: 'POST',
              body: JSON.stringify({ code: formData.coupon_code })
          });
          const data = await res.json();
          
          if(data.valid) {
              let discount = 0;
              if(data.type === 'fixed') discount = Math.round(data.amount);
              else discount = Math.round((subTotal * data.amount) / 100);
              
              const final = Math.max(0, Math.round(subTotal - discount));
              setCouponState({ 
                  valid: true, 
                  message: 'Coupon Applied!', 
                  discount, 
                  finalPrice: final,
                  code: data.code
              });

              // Celebration Effect
              confetti({
                  particleCount: 100,
                  spread: 70,
                  origin: { y: 0.6 }
              });

              // Start Timer if enabled
              if (timerSettings.enabled) {
                  setCouponTimer(timerSettings.duration);
              }

          } else {
              setCouponState({ valid: false, message: data.message || 'Invalid Coupon', discount: 0, finalPrice: subTotal, code: '' });
              setCouponTimer(null);
          }
      } catch(e) {
          setCouponState({ valid: false, message: 'Error checking coupon', discount: 0, finalPrice: subTotal, code: '' });
      }
  };

  // Load from LocalStorage on mount (Updated keys for Organic Blueprint)
  useEffect(() => {
    const savedName = localStorage.getItem('organic_name');
    const savedEmail = localStorage.getItem('organic_email');
    const savedPhone = localStorage.getItem('organic_phone');

    if (savedName || savedEmail || savedPhone) {
      setFormData(prev => ({
        ...prev,
        name: savedName || prev.name,
        email: savedEmail || prev.email,
        phone: savedPhone || prev.phone
      }));
    }
  }, []);

  // Track InitiateCheckout when modal opens
  useEffect(() => {
    if (isOpen) {
      // Reset view to form on reopen
      setView('form'); 
      setResendStatus('idle');

      // Facebook Pixel
      if (typeof window.fbq === 'function') {
        window.fbq('track', 'InitiateCheckout', {
          content_name: 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট (eBook)',
          value: price,
          currency: 'BDT'
        });
      }
      // GA4
      if (typeof window.gtag === 'function') {
        window.gtag('event', 'begin_checkout', {
          currency: 'BDT',
          value: price,
          items: [{
            item_name: 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট (eBook)',
            price: price
          }]
        });
      }
    }
  }, [isOpen]);

  // Save to LocalStorage on change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Auto-save to localStorage (Organic keys)
    if(name === 'name') localStorage.setItem('organic_name', value);
    if(name === 'email') localStorage.setItem('organic_email', value);
    if(name === 'phone') localStorage.setItem('organic_phone', value);
  };

  const handleResendLink = async () => {
    setResendStatus('sending');
    try {
      const response = await fetch('/api/resend_access.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.email, phone: formData.phone }),
      });
      const data = await response.json();
      if(data.status === 'success') {
        setResendStatus('sent');
      } else {
        alert(data.message);
        setResendStatus('idle');
      }
    } catch(e) {
      alert('Network Error');
      setResendStatus('idle');
    }
  };

  if (!isOpen) return null;

  // Step 2: Final Checkout
  const handleFinalCheckout = async (skipUpsells = false) => {
      setLoading(true);
      
      const finalUpsellIds = skipUpsells ? [] : selectedUpsellIds;
      const affiliateCode = localStorage.getItem('affiliate_ref') || '';

      try {
        const response = await fetch('/api/checkout.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...formData, upsell_ids: finalUpsellIds, affiliate_code: affiliateCode }),
        });
  
        const data = await response.json();
  
        if (data.status === 'already_purchased') {
          setLoading(false);
          setView('already_paid');
          return;
        }
  
        if (data.status === 'success') {
          // Track AddPaymentInfo event before redirect
          if (typeof window.gtag === 'function') {
             window.gtag('event', 'add_payment_info', {
               payment_type: formData.gateway,
               value: couponState.valid ? couponState.finalPrice : subTotal,
               currency: 'BDT'
             });
          }
          
          window.location.href = data.redirect_url;
        } else {
          alert('Payment failed: ' + (data.message || 'Unknown error'));
          console.error('Checkout Error:', data);
          setLoading(false);
        }
      } catch (error: any) {
        console.error('Error:', error);
        alert('Network error during checkout. Please try again. ' + (error.message || ''));
        setLoading(false);
      }
  };

  // Step 1: Create Lead
  const handleStep1Submit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (isFetchingProducts) {
          return;
      }

      setLoading(true);
      const affiliateCode = localStorage.getItem('affiliate_ref') || '';

      try {
          const response = await fetch('/api/create_lead.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...formData, affiliate_code: affiliateCode }),
          });
          const data = await response.json();

          if (data.status === 'already_purchased') {
              setLoading(false);
              setView('already_paid');
              return;
          }

          if (data.status === 'success') {
              // Lead created!
              console.log('Lead created. Upsells count:', upsells.length);
              // If upsells exist, go to Step 2
              if (upsells.length > 0) {
                  setStep('upsell');
                  setLoading(false);
              } else {
                  // No upsells, proceed to final checkout
                  handleFinalCheckout();
              }
          } else {
              alert('Error: ' + (data.message || 'Unknown error'));
              console.error('Lead Creation Error:', data);
              setLoading(false);
          }
      } catch (error: any) {
          console.error('Error:', error);
          alert('Network error. Please try again. ' + (error.message || ''));
          setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-brand-charcoal/80 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="relative bg-brand-ivory border border-brand-olive/20 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="bg-brand-cream px-6 py-4 flex justify-between items-center border-b border-brand-olive/10">
           <h3 className="text-lg font-bold text-brand-charcoal">
             {view === 'form' ? 'অর্ডার কনফার্ম করুন' : 'অলরেডি কিনেছেন!'}
           </h3>
           <button onClick={onClose} className="text-brand-charcoal/50 hover:text-brand-charcoal">
             <X size={20} />
           </button>
        </div>

        {view === 'already_paid' ? (
           // ALREADY PAID VIEW
           <div className="p-8 text-center space-y-6">
              <div className="w-20 h-20 bg-brand-olive/10 rounded-full flex items-center justify-center mx-auto border border-brand-olive/20">
                 <CheckCircle className="text-brand-olive" size={40} />
              </div>
              <div>
                <h4 className="text-xl font-bold text-brand-charcoal mb-2">আপনি বইটি আগে কিনেছেন</h4>
                <p className="text-brand-charcoal/70 text-sm">
                   আমাদের রেকর্ডে দেখা যাচ্ছে <strong>{formData.email}</strong> ইমেইল দিয়ে অলরেডি পেমেন্ট করা হয়েছে।
                </p>
              </div>
              
              <div className="bg-brand-cream rounded-xl p-4 border border-brand-olive/10">
                 <p className="text-xs text-brand-charcoal/50 mb-3">ডাউনলোড লিংক হারিয়ে ফেলেছেন?</p>
                 {resendStatus === 'sent' ? (
                   <div className="bg-brand-olive/10 text-brand-olive p-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2">
                      <CheckCircle size={16} /> ইমেইল চেক করুন
                   </div>
                 ) : (
                   <button 
                    onClick={handleResendLink}
                    disabled={resendStatus === 'sending'}
                    className="w-full bg-white hover:bg-brand-ivory text-brand-olive border border-brand-olive/20 py-3 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2"
                   >
                     {resendStatus === 'sending' ? 'পাঠানো হচ্ছে...' : <><Mail size={16} /> ডাউনলোড লিংক ইমেইলে পাঠান</>}
                   </button>
                 )}
              </div>
              
              <button onClick={() => setView('form')} className="text-brand-charcoal/50 text-xs hover:text-brand-charcoal flex items-center justify-center gap-1 mx-auto">
                 না, আমি অন্য নাম্বারে অর্ডার করতে চাই <ArrowRight size={12} />
              </button>
           </div>
        ) : step === 'upsell' ? (
            // UPSELL VIEW (Step 2)
            <div className="p-6 space-y-6 animate-fade-in">
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-brand-olive/10 rounded-full flex items-center justify-center mx-auto text-brand-olive mb-2 animate-pulse">
                        <CheckCircle size={24} />
                    </div>
                    <h3 className="text-xl font-bold text-brand-charcoal font-sans">অর্ডার পেন্ডিং আছে!</h3>
                    <p className="text-brand-charcoal/70 text-sm font-sans">পেমেন্ট করার আগে এই স্পেশাল অফারটি দেখতে পারেন। এটি আপনার লার্নিং জার্নিকে আরও সহজ করবে।</p>
                </div>

                <div className="space-y-3 max-h-[40vh] overflow-y-auto pr-1">
                    {upsells.map(u => (
                        <label key={u.id} className={`relative flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${selectedUpsellIds.includes(u.id) ? 'bg-brand-olive/5 border-brand-olive shadow-lg shadow-brand-olive/5' : 'bg-white border-brand-olive/20 hover:border-brand-olive/40'}`}>
                            <div className="pt-1">
                                <input 
                                    type="checkbox" 
                                    checked={selectedUpsellIds.includes(u.id)}
                                    onChange={() => {
                                        setSelectedUpsellIds(prev => prev.includes(u.id) ? prev.filter(id => id !== u.id) : [...prev, u.id]);
                                    }}
                                    className="w-5 h-5 rounded border-brand-olive/30 text-brand-olive focus:ring-brand-olive bg-white"
                                />
                            </div>
                            {u.image_url && <img src={u.image_url} alt="" className="w-16 h-16 object-cover rounded-lg border border-brand-olive/10" />}
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <span className="text-base font-bold text-brand-charcoal leading-tight font-sans">{u.name}</span>
                                    <div className="text-right">
                                        <span className="text-base font-bold text-brand-olive whitespace-nowrap font-sans block">+৳{toBengaliNumber(u.price)}</span>
                                        {u.regular_price && (
                                            <span className="text-xs text-brand-charcoal/40 line-through block">৳{toBengaliNumber(u.regular_price)}</span>
                                        )}
                                    </div>
                                </div>
                                {u.description && <p className="text-xs text-brand-charcoal/60 mt-1 leading-relaxed font-sans">{u.description}</p>}
                                <div className="mt-2 inline-block bg-brand-olive/10 text-brand-olive text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                                    Special Offer
                                </div>
                            </div>
                        </label>
                    ))}
                </div>

                <div className="space-y-3 pt-2 border-t border-brand-olive/10">
                    {/* Price Breakdown */}
                    <div className="space-y-1 text-sm">
                        <div className="flex justify-between text-brand-charcoal/70">
                            <span>Subtotal</span>
                            <span>৳{toBengaliNumber(price)}</span>
                        </div>
                        {upsellTotal > 0 && (
                            <div className="flex justify-between text-brand-olive">
                                <span>Lifetime Investment</span>
                                <span>+৳{toBengaliNumber(upsellTotal)}</span>
                            </div>
                        )}
                        {totalDiscount > 0 && (
                            <div className="flex justify-between text-brand-leaf font-bold">
                                <span>Total Savings</span>
                                <span>৳{toBengaliNumber(totalDiscount)}</span>
                            </div>
                        )}
                        {couponState.valid && (
                            <div className="flex justify-between text-brand-leaf font-bold">
                                <span>Discount ({couponState.code})</span>
                                <span>-৳{toBengaliNumber(couponState.discount)}</span>
                            </div>
                        )}
                        <div className="flex justify-between text-brand-charcoal font-bold text-lg pt-2 border-t border-brand-olive/10 mt-2">
                            <span>Total</span>
                            <span>৳{toBengaliNumber(couponState.valid ? couponState.finalPrice : subTotal)}</span>
                        </div>
                    </div>

                    {/* Countdown Timer */}
                    {couponTimer !== null && couponTimer > 0 && (
                        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center justify-center gap-2 animate-pulse">
                            <Clock size={16} className="text-red-500" />
                            <span className="text-red-600 font-bold text-sm">Offer expires in {couponTimer}s</span>
                        </div>
                    )}

                    <button 
                        onClick={() => handleFinalCheckout(false)}
                        disabled={loading}
                        className="w-full bg-brand-olive hover:bg-brand-leaf py-4 rounded-xl font-bold text-white text-lg transition-all flex items-center justify-center gap-2 font-sans"
                    >
                        {loading ? 'Processing...' : (
                            <>
                                {selectedUpsellIds.length > 0 ? 'অফার সহ পেমেন্ট করুন' : 'পেমেন্ট করুন'} 
                                <ArrowRight size={18} />
                            </>
                        )}
                    </button>
                    
                    <button 
                        onClick={() => handleFinalCheckout(true)}
                        disabled={loading}
                        className="w-full text-brand-charcoal/50 text-sm hover:text-brand-charcoal transition-colors font-sans"
                    >
                        না, ধন্যবাদ। আমি শুধু ইবুকটি নিব
                    </button>
                </div>
            </div>
        ) : (
           // FORM VIEW
           <form onSubmit={handleStep1Submit} className="p-6 space-y-4">
            
            <div className="bg-brand-olive/10 border border-brand-olive/20 p-3 rounded-lg flex items-center gap-3">
               <CheckCircle className="text-brand-olive shrink-0" size={18} />
               <div>
                  <p className="text-brand-charcoal font-medium text-sm">অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট</p>
                  <p className="text-brand-olive font-bold">
                      Price: ৳{toBengaliNumber(price)}
                      {mainProduct?.regular_price && (
                          <span className="text-brand-charcoal/40 line-through ml-2 text-xs">৳{toBengaliNumber(mainProduct.regular_price)}</span>
                      )}
                  </p>
               </div>
            </div>

            <div className="space-y-3">
               <div>
                 <label className="block text-brand-charcoal/70 text-xs mb-1 ml-1">আপনার নাম</label>
                 <input 
                   type="text" 
                   name="name"
                   required
                   className="w-full bg-white border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive transition-colors"
                   placeholder="Example: Shehzin"
                   value={formData.name}
                   onChange={handleChange}
                 />
               </div>
               
               <div>
                 <label className="block text-brand-charcoal/70 text-xs mb-1 ml-1">ইমেইল (বইয়ের ডাউনলোড লিংক যাবে)</label>
                 <input 
                   type="email" 
                   name="email"
                   required
                   className="w-full bg-white border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive transition-colors"
                   placeholder="name@example.com"
                   value={formData.email}
                   onChange={handleChange}
                 />
               </div>

               <div>
                 <label className="block text-brand-charcoal/70 text-xs mb-1 ml-1">মোবাইল নাম্বার</label>
                 <input 
                   type="tel" 
                   name="phone"
                   required
                   className="w-full bg-white border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive transition-colors"
                   placeholder="017XXXXXXXX"
                   value={formData.phone}
                   onChange={handleChange}
                 />
               </div>

               {/* COUPON INPUT */}
               {showCoupon && (
               <div>
                   <label className="block text-brand-charcoal/70 text-xs mb-1 ml-1">কুপন কোড (যদি থাকে)</label>
                   <div className="flex gap-2">
                       <input 
                           type="text" 
                           name="coupon_code"
                           className="flex-1 bg-white border border-brand-olive/20 rounded-lg px-4 py-3 text-brand-charcoal focus:outline-none focus:border-brand-olive transition-colors uppercase font-mono"
                           placeholder="CODE"
                           value={formData.coupon_code}
                           onChange={handleChange}
                       />
                       <button 
                           type="button"
                           onClick={handleApplyCoupon}
                           className="bg-brand-olive hover:bg-brand-leaf text-white px-4 rounded-lg font-bold text-xs transition"
                       >
                           Apply
                       </button>
                   </div>
                   {couponState.message && (
                       <p className={`text-xs mt-1 ${couponState.valid ? 'text-brand-leaf' : 'text-red-500'}`}>
                           {couponState.message}
                       </p>
                   )}
               </div>
               )}
            </div>

            <div className="pt-2">
              <label className="block text-brand-charcoal/70 text-xs mb-2 ml-1">পেমেন্ট মেথড সিলেক্ট করুন</label>
              <div className="grid grid-cols-2 gap-3">
                 <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-1 transition-all ${formData.gateway === 'bkash' ? 'bg-pink-50 border-pink-500' : 'bg-white border-brand-olive/20 hover:border-brand-olive/40'}`}>
                    <input 
                      type="radio" 
                      name="gateway" 
                      value="bkash" 
                      className="hidden" 
                      checked={formData.gateway === 'bkash'}
                      onChange={() => setFormData({...formData, gateway: 'bkash'})}
                    />
                    <div className="h-8 flex items-center justify-center">
                      <span className="font-bold text-pink-600 text-2xl tracking-wide">bKash</span>
                    </div>
                    <span className="text-xs text-brand-charcoal/60 font-medium">পেমেন্ট</span>
                 </label>

                 <label className={`cursor-pointer border rounded-xl p-3 flex flex-col items-center gap-1 transition-all ${formData.gateway === 'ssl' ? 'bg-blue-50 border-blue-500' : 'bg-white border-brand-olive/20 hover:border-brand-olive/40'}`}>
                    <input 
                      type="radio" 
                      name="gateway" 
                      value="ssl" 
                      className="hidden" 
                      checked={formData.gateway === 'ssl'}
                      onChange={() => setFormData({...formData, gateway: 'ssl'})}
                    />
                    <div className="h-8 flex items-center justify-center">
                      <span className="font-bold text-brand-charcoal text-xl tracking-wide">SSLCommerz</span>
                    </div>
                    <span className="text-[10px] text-brand-charcoal/50 font-medium text-center leading-tight">Cards / Nagad / Rocket</span>
                 </label>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={loading || isFetchingProducts}
              className="w-full bg-brand-olive hover:bg-brand-leaf py-4 rounded-xl font-bold text-white text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>Processing...</>
              ) : isFetchingProducts ? (
                <>Loading Offers...</>
              ) : (
                <>
                   পরবর্তী ধাপ <ArrowRight size={18} />
                </>
              )}
            </button>

            <p className="text-[10px] text-center text-brand-charcoal/50">
              By clicking Next, you agree to our Terms & Conditions.
            </p>
            {!showCoupon && (
              <p 
                onClick={() => setShowCoupon(true)}
                className="text-[10px] text-center text-brand-charcoal/50 mt-1 cursor-pointer hover:text-brand-charcoal/70"
              >
                Click here to apply coupon
              </p>
            )}

          </form>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;