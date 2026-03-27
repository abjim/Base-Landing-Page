import React, { useState, useEffect } from 'react';
import { Zap, X, ShoppingBag } from 'lucide-react';
import { toBengaliNumber } from '../utils';

interface FloatingCTAProps {
  onOpenModal: () => void;
  price: number;
  regularPrice?: number | null;
}

const FloatingCTA: React.FC<FloatingCTAProps> = ({ onOpenModal, price, regularPrice }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!isDismissed) setIsVisible(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, [isDismissed]);

  if (isDismissed || !isVisible) return null;

  return (
    <div className="fixed bottom-6 right-6 z-[60] animate-fade-in-up md:block hidden" role="complementary" aria-label="Limited Time Offer">
      <div className="bg-white/95 backdrop-blur-md p-5 rounded-2xl w-[280px] border border-brand-olive/20 shadow-xl shadow-brand-olive/10 relative overflow-hidden group">
        <button 
          onClick={() => setIsDismissed(true)}
          className="absolute top-2 right-2 p-1 text-brand-charcoal/50 hover:text-brand-charcoal transition-colors"
          aria-label="Close offer"
        >
          <X size={16} />
        </button>
        
        <div className="flex gap-4 items-center mb-4">
          <div className="w-14 h-20 bg-brand-cream rounded-md overflow-hidden shrink-0 border border-brand-olive/10 shadow-sm flex items-center justify-center">
             <img 
              src="https://organic.shehzin.com/uploads/1.jpg" 
              alt="অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট eBook Cover" 
              loading="lazy"
              referrerPolicy="no-referrer"
              className="w-full h-full object-contain" 
             />
          </div>
          <div>
            <p className="text-[10px] text-brand-olive font-bold uppercase tracking-wider mb-1">limited offer</p>
            <h4 className="text-brand-charcoal font-bold text-sm leading-tight">অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট (eBook)</h4>
            <div className="flex items-center gap-2 mt-1">
               <span className="text-brand-leaf font-bold">৳{toBengaliNumber(price)}</span>
               {regularPrice && (
                   <span className="text-brand-charcoal/50 text-[10px] line-through">৳{toBengaliNumber(regularPrice)}</span>
               )}
            </div>
          </div>
        </div>
        
        <button 
          onClick={onOpenModal}
          className="w-full py-3 bg-brand-olive hover:bg-brand-leaf rounded-lg text-white font-bold text-sm flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-brand-olive/20"
        >
          <Zap size={14} className="animate-bounce" />
          {toBengaliNumber(price)} টাকায় সংগ্রহ করুন
          <ShoppingBag size={14} />
        </button>
        
        <p className="text-center text-brand-charcoal/50 text-xs mt-3">অফার প্রাইস যেকোনো সময় শেষ হয়ে যাবে!</p>
      </div>
    </div>
  );
};

export default FloatingCTA;