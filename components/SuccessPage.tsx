import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Download, CheckCircle, Home, Users, Copy, ExternalLink } from 'lucide-react';

const SuccessPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [otoSettings, setOtoSettings] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const trackedRef = useRef(false); // To prevent double tracking in Strict Mode

  const orderId = searchParams.get('order_id');

  useEffect(() => {
    // Fetch OTO Settings
    fetch('/api/get_public_settings.php')
      .then(res => res.json())
      .then(data => {
        if (data.oto_enabled === '1') {
          setOtoSettings(data);
        }
      })
      .catch(err => console.error("Failed to load OTO settings", err));

    if (orderId) {
        // Verify payment status from backend
        fetch(`/api/check_status.php?order_id=${orderId}`)
            .then(res => res.json())
            .then(data => {
                if (data.status === 'PAID') {
                    setDownloadUrl(data.download_link);
                    const amount = parseFloat(data.amount) || 199.00;
                    
                    // Track Purchase Event (Only once)
                    if (!trackedRef.current) {
                        trackedRef.current = true;
                        
                        // Facebook Pixel Purchase (With Event ID for Deduplication)
                        if (typeof window.fbq === 'function') {
                            window.fbq(
                                'track', 
                                'Purchase', 
                                {
                                    value: amount,
                                    currency: 'BDT',
                                    content_name: 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট (eBook)',
                                    content_ids: ['ZERO-EBOOK-01'],
                                    content_type: 'product',
                                    order_id: orderId
                                }, 
                                { eventID: orderId } // Critical for CAPI Deduplication
                            );
                        }

                        // GA4 Purchase
                        if (typeof window.gtag === 'function') {
                            window.gtag('event', 'purchase', {
                                transaction_id: orderId,
                                value: amount,
                                currency: 'BDT',
                                items: [{
                                    item_name: 'অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট (eBook)',
                                    item_id: 'ZERO-EBOOK-01',
                                    price: amount,
                                    quantity: 1
                                }]
                            });
                        }
                    }

                } else {
                    setError('Payment not verified or pending.');
                }
                setLoading(false);
            })
            .catch(() => {
                setError('Failed to verify order.');
                setLoading(false);
            });
    } else {
        setLoading(false);
        setError('Invalid Order ID');
    }
  }, [orderId]);

  const handleCopyCoupon = () => {
    if (otoSettings?.oto_coupon_code) {
      navigator.clipboard.writeText(otoSettings.oto_coupon_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-brand-ivory flex flex-col items-center justify-center p-4 py-12 font-bengali">
      <div className="bg-white max-w-lg w-full p-8 rounded-3xl text-center border border-brand-olive/20 shadow-xl shadow-brand-olive/5 border-t-4 border-t-brand-olive mb-8">
        
        {loading ? (
            <div className="animate-pulse flex flex-col items-center">
                <div className="w-16 h-16 bg-brand-cream rounded-full mb-4"></div>
                <div className="h-6 w-32 bg-brand-cream rounded mb-2"></div>
                <div className="h-4 w-48 bg-brand-cream rounded"></div>
            </div>
        ) : error ? (
            <div>
                <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-3xl">⚠️</span>
                </div>
                <h1 className="text-2xl font-bold text-brand-charcoal mb-2">Something went wrong!</h1>
                <p className="text-brand-charcoal/70 mb-8">{error}</p>
                <Link to="/" className="text-brand-olive hover:underline">Return Home</Link>
            </div>
        ) : (
            <div>
                <div className="w-20 h-20 bg-brand-olive/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-brand-olive/30 shadow-lg shadow-brand-olive/20">
                    <CheckCircle className="text-brand-olive w-10 h-10" />
                </div>
                
                <h1 className="text-3xl font-bold text-brand-charcoal mb-2">Payment Successful!</h1>
                <p className="text-brand-charcoal/70 mb-8">
                    অভিনন্দন! আপনার পেমেন্ট সফল হয়েছে। নিচের বাটনে ক্লিক করে আপনার ফাইলগুলো ডাউনলোড করুন এবং সিক্রেট গ্রুপে জয়েন করুন।
                </p>

                {downloadUrl && (
                    <div className="space-y-4 mb-8">
                      <a 
                          href={downloadUrl} 
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-3 w-full bg-brand-olive text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-brand-olive/30 transition-all transform hover:scale-105 hover:bg-brand-leaf"
                      >
                          <Download size={24} />
                          Access Your Downloads
                      </a>

                      <a 
                          href="https://www.facebook.com/groups/LearningBangladesh71" 
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center justify-center gap-3 w-full bg-brand-sage/20 border border-brand-sage text-brand-olive font-bold py-4 rounded-xl hover:bg-brand-sage/30 transition-all"
                      >
                          <Users size={24} />
                          Join Secret Facebook Group
                      </a>
                    </div>
                )}

                <div className="bg-brand-cream rounded-lg p-4 text-sm text-brand-charcoal/70 mb-6 border border-brand-olive/10">
                    <p>Order ID: <span className="text-brand-charcoal font-mono">{orderId}</span></p>
                    <p className="mt-1">একটি কপি আপনার ইমেইলেও পাঠানো হয়েছে।</p>
                </div>

                <Link to="/" className="inline-flex items-center gap-2 text-brand-charcoal/50 hover:text-brand-olive transition-colors">
                    <Home size={16} /> Back to Home
                </Link>
            </div>
        )}
      </div>

      {/* OTO Section */}
      {!loading && !error && otoSettings && (
        <div className="max-w-lg w-full bg-brand-cream rounded-3xl border border-brand-olive/20 shadow-2xl overflow-hidden animate-fade-in relative">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-brand-olive via-brand-leaf to-brand-sage"></div>
          
          <div className="p-8 text-center">
            <div className="inline-block bg-brand-olive/10 text-brand-olive text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider mb-4 border border-brand-olive/20">
              Special One-Time Offer
            </div>
            
            {otoSettings.oto_image_url && (
              <img 
                src={otoSettings.oto_image_url} 
                alt="Special Offer" 
                className="w-full h-auto rounded-xl mb-6 border border-brand-olive/10 shadow-lg"
              />
            )}
            
            {otoSettings.oto_copy && (
              <div 
                className="text-brand-charcoal/80 mb-6 text-sm leading-relaxed"
                dangerouslySetInnerHTML={{ __html: otoSettings.oto_copy }}
              />
            )}

            {otoSettings.oto_coupon_code && (
              <div className="bg-white border border-brand-olive/20 rounded-xl p-4 mb-6">
                <p className="text-xs text-brand-charcoal/60 mb-2 uppercase tracking-wider">Use this coupon code</p>
                <div 
                  onClick={handleCopyCoupon}
                  className="flex items-center justify-center gap-3 bg-brand-ivory hover:bg-brand-cream py-3 px-4 rounded-lg cursor-pointer transition-colors border border-brand-olive/20 hover:border-brand-olive/50 group"
                >
                  <span className="font-mono text-xl font-bold text-brand-olive tracking-widest">
                    {otoSettings.oto_coupon_code}
                  </span>
                  {copied ? (
                    <span className="text-brand-leaf text-xs font-bold flex items-center gap-1"><CheckCircle size={14}/> Copied!</span>
                  ) : (
                    <Copy size={18} className="text-brand-charcoal/40 group-hover:text-brand-olive transition-colors" />
                  )}
                </div>
              </div>
            )}

            {otoSettings.oto_link && (
              <a 
                href={otoSettings.oto_link}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-center gap-2 w-full bg-brand-olive text-white font-bold py-4 rounded-xl hover:shadow-lg hover:shadow-brand-olive/30 transition-all transform hover:scale-105 hover:bg-brand-leaf"
              >
                Grab This Offer Now <ExternalLink size={18} />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SuccessPage;