import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';

interface Sale {
  name: string;
  created_at: string;
}

interface SocialProofData {
  enabled: boolean;
  sales: Sale[];
  message_templates: string[];
  delay: number;
  duration: number;
}

const BD_LOCATIONS = [
  "ঢাকা", "চট্টগ্রাম", "খুলনা", "রাজশাহী", "সিলেট", "বরিশাল", "রংপুর", "ময়মনসিংহ",
  "কুমিল্লা", "নারায়ণগঞ্জ", "গাজীপুর", "বগুড়া", "কুষ্টিয়া", "যশোর", "কক্সবাজার",
  "ফেনী", "টাঙ্গাইল", "ফরিদপুর", "পাবনা", "নোয়াখালী", "দিনাজপুর", "জামালপুর",
  "ব্রাহ্মণবাড়িয়া", "সিরাজগঞ্জ", "হবিগঞ্জ", "চাঁদপুর", "বাগেরহাট"
];

interface SocialProofPopupProps {
  isModalOpen?: boolean;
}

const SocialProofPopup: React.FC<SocialProofPopupProps> = ({ isModalOpen = false }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [data, setData] = useState<SocialProofData | null>(null);
  const [currentSale, setCurrentSale] = useState<Sale | null>(null);
  const [currentLocation, setCurrentLocation] = useState('');
  const [currentTemplate, setCurrentTemplate] = useState('');
  const [isMobile, setIsMobile] = useState(false);

  // Check for mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Fetch Data
  useEffect(() => {
    fetch('/api/get_public_recent_sales.php')
      .then(res => res.json())
      .then((res: SocialProofData) => {
        if (res.enabled && res.sales && res.sales.length > 0) {
          setData(res);
        }
      })
      .catch(err => console.error("Social Proof Error:", err));
  }, []);

  // Cycle Logic
  useEffect(() => {
    if (!data || !data.enabled || data.sales.length === 0) return;

    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    const showPopup = () => {
      // Pick random sale
      const randomSale = data.sales[Math.floor(Math.random() * data.sales.length)];
      // Pick random location
      const randomLocation = BD_LOCATIONS[Math.floor(Math.random() * BD_LOCATIONS.length)];
      // Pick random template
      const templates = data.message_templates && data.message_templates.length > 0 
        ? data.message_templates 
        : ['{name} from {location} purchased just now'];
      const randomTemplate = templates[Math.floor(Math.random() * templates.length)];
      
      setCurrentSale(randomSale);
      setCurrentLocation(randomLocation);
      setCurrentTemplate(randomTemplate);
      setIsVisible(true);

      // Hide after duration
      timeoutId = setTimeout(() => {
        setIsVisible(false);
      }, data.duration * 1000);
    };

    // Initial Delay
    const initialDelay = setTimeout(() => {
      showPopup();
      // Then cycle every (duration + delay) seconds
      intervalId = setInterval(showPopup, (data.duration + data.delay) * 1000);
    }, data.delay * 1000);

    return () => {
      clearTimeout(initialDelay);
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [data]);

  if (!currentSale || !data) return null;

  // Parse Message
  // Template: "{name} from {location} purchased just now"
  const message = currentTemplate
    .replace('{name}', `<span class="font-bold text-brand-charcoal">${currentSale.name}</span>`)
    .replace('{location}', `<span class="font-semibold text-brand-charcoal/80">${currentLocation}</span>`);

  return (
    <div 
      className={`fixed z-[9999] transition-all duration-500 ease-in-out transform ${
        (isVisible && !isModalOpen) ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0 pointer-events-none'
      } ${
        isMobile 
          ? 'bottom-28 left-4 right-4 mx-auto max-w-[calc(100%-2rem)]' 
          : 'bottom-8 left-8 max-w-sm'
      }`}
    >
      <div className="bg-white/95 backdrop-blur-md border border-brand-olive/20 shadow-xl shadow-brand-olive/5 rounded-2xl p-4 flex items-start gap-4 relative overflow-hidden ring-1 ring-brand-charcoal/5">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-olive to-brand-leaf"></div>
        
        {/* Icon */}
        <div className="flex-shrink-0 bg-brand-olive/10 p-2.5 rounded-full shadow-inner">
          <CheckCircle className="w-5 h-5 text-brand-olive" />
        </div>

        {/* Content */}
        <div className="flex-1 pr-6">
          <div 
            className="text-sm text-brand-charcoal/80 leading-relaxed font-medium"
            dangerouslySetInnerHTML={{ __html: message }}
          />
          <p className="text-[11px] text-brand-charcoal/50 mt-1.5 font-medium flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-leaf animate-pulse"></span>
            যাচাইকৃত অর্ডার • এইমাত্র
          </p>
        </div>

        {/* Close Button */}
        <button 
          onClick={() => setIsVisible(false)}
          className="absolute top-2 right-2 p-1 text-brand-charcoal/30 hover:text-brand-charcoal/60 hover:bg-brand-olive/10 rounded-full transition-all"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export default SocialProofPopup;
