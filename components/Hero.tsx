import React from 'react';
import Button from './Button';
import { Bot, Sparkles, BookOpen, Leaf } from 'lucide-react';
import { toBengaliNumber } from '../utils';

interface HeroProps {
  onOpenModal: () => void;
  price: number;
  regularPrice?: number | null;
  pageCount?: string;
}

const Hero: React.FC<HeroProps> = ({ onOpenModal, price, regularPrice, pageCount = '১৩৫+' }) => {
  
  return (
    <section id="hero" className="relative pt-36 pb-20 overflow-hidden min-h-screen flex items-center bg-brand-ivory">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-grid opacity-30 -z-20"></div>
      <div className="absolute top-[-10%] right-[-5%] w-[600px] h-[600px] bg-brand-sage/10 rounded-full blur-[120px] -z-10 animate-pulse-slow"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[500px] h-[500px] bg-brand-cream/50 rounded-full blur-[120px] -z-10"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-20">
          
          <div className="w-full lg:w-3/5 text-center lg:text-left z-20">
            {/* Warning Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-olive/10 border border-brand-olive/20 backdrop-blur-sm mb-8 mx-auto lg:mx-0 animate-fade-in-up">
               <Leaf size={14} className="text-brand-olive animate-pulse" />
               <span className="text-xs text-brand-olive font-bold uppercase tracking-wider">কেমিক্যাল থেকে অর্গানিক সাফল্যের যাত্রা</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold leading-[1.1] mb-6 text-brand-charcoal tracking-tight">
              রান্নাঘরের সাধারণ উপাদান দিয়ে শুরু করুন <br/>
              <span className="text-brand-olive">
                নিজের প্রফিটেবল 'অর্গানিক' ব্র্যান্ড!
              </span>
            </h1>
            
            <p className="text-lg lg:text-2xl text-brand-charcoal/70 leading-relaxed mb-8 max-w-2xl mx-auto lg:mx-0 font-medium">
              অল্প বাজেটে, ঘরের কোণে ছোট্ট সেটআপ, আর সঠিক গাইডলাইন দিয়ে অর্গানিক স্কিন কেয়ার বিজনেস শুরু করার প্র্যাক্টিক্যাল বাংলা ebook।
            </p>

            {/* High Converting CTA Area */}
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center lg:justify-start mb-12">
              <div className="flex flex-col items-center w-full sm:w-auto">
                <Button 
                  text={`${toBengaliNumber(price)} টাকায় ডাউনলোড করুন`}
                  pulsing 
                  className="bg-brand-olive hover:bg-brand-leaf shadow-brand-olive/20 shadow-2xl !px-10 !py-4 !rounded-full min-h-[70px] border-0 w-full sm:w-auto text-lg md:text-xl text-white font-bold" 
                  onClick={onOpenModal}
                />
                {regularPrice && (
                    <span className="text-[10px] md:text-xs font-normal text-brand-charcoal/50 mt-2 uppercase tracking-widest">রেগুলার প্রাইস {toBengaliNumber(regularPrice)} টাকা</span>
                )}
              </div>
              <div className="text-left hidden sm:block">
                 <div className="text-brand-brown flex gap-0.5 text-xs mb-1">
                    {'★★★★★'.split('').map((s, i) => <span key={i}>★</span>)}
                 </div>
                 <p className="text-brand-charcoal/60 text-xs font-medium">১ লাখ লার্নার+রিডার আস্থা রাখছেন!</p>
              </div>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap justify-center lg:justify-start gap-4 md:gap-8 text-xs md:text-sm text-brand-charcoal/60 font-semibold border-t border-brand-olive/10 pt-8">
               <div className="flex items-center gap-2"><Sparkles size={16} className="text-brand-brown"/> Instant Access</div>
               <div className="flex items-center gap-2"><BookOpen size={16} className="text-brand-olive"/> {pageCount} পৃষ্ঠা (PDF)</div>
               <div className="flex items-center gap-2"><Bot size={16} className="text-brand-sage"/> কমিউনিটি গ্রুপ এক্সেস</div>
            </div>
          </div>

          {/* Book Cover Image with Effects */}
          <div className="w-full lg:w-2/5 relative flex justify-center pb-12 lg:pb-0 z-10">
             <div className="relative animate-float perspective-1000 group">
                {/* Glow behind book */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-brand-sage/20 blur-[60px] rounded-full"></div>
                
                {/* Book Container */}
                <div className="relative w-[260px] sm:w-[320px] aspect-[1/1.5] transform rotate-y-6 transition-transform duration-500 group-hover:rotate-y-0 group-hover:scale-105 z-20">
                   <img 
                     src="https://organic.shehzin.com/uploads/1.jpg" 
                     alt="অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট Cover" 
                     referrerPolicy="no-referrer"
                     className="w-full h-full object-cover rounded-r-xl rounded-l-sm shadow-[0_20px_50px_-12px_rgba(85,107,47,0.3)] border-l-[3px] border-brand-cream"
                   />
                   
                   {/* Floating Elements */}
                   <div className="absolute -top-4 -right-4 bg-brand-cream text-brand-olive text-xs font-bold px-4 py-2 rounded-full shadow-lg transform rotate-6 animate-bounce border border-brand-olive/20">
                     New Release ✨
                   </div>
                   
                   <div className="absolute -bottom-6 -left-6 bg-white text-brand-charcoal p-3 rounded-xl shadow-xl border border-brand-olive/10 flex items-center gap-3 animate-pulse-slow">
                      <div className="bg-brand-cream rounded-full p-1.5"><Leaf size={16} className="text-brand-olive"/></div>
                      <div>
                        <p className="text-[10px] text-brand-charcoal/60 font-bold">Organic</p>
                        <p className="text-xs font-bold">Blueprint</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default Hero;