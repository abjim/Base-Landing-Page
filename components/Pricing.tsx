import React from 'react';
import Button from './Button';
import { Check, Shield, Leaf } from 'lucide-react';
import { toBengaliNumber } from '../utils';

interface PricingProps {
  onOpenModal: () => void;
  price: number;
  regularPrice?: number | null;
}

const Pricing: React.FC<PricingProps> = ({ onOpenModal, price, regularPrice }) => {
  return (
    <section id="pricing" className="py-24 bg-brand-cream relative overflow-hidden scroll-mt-24">
       {/* Subtle background texture */}
       <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}></div>
       
       <div className="container mx-auto px-4 relative z-10">
        
        <div className="max-w-lg mx-auto relative group">
          
          <div className="relative bg-white rounded-3xl border border-brand-olive/20 p-8 md:p-12 shadow-xl shadow-brand-olive/5">
            
            {/* Header */}
            <div className="text-center border-b border-brand-olive/10 pb-6 mb-8">
               <div className="inline-flex items-center gap-1.5 bg-brand-olive/10 text-brand-olive text-xs font-bold px-3 py-1 rounded-full mb-4">
                  <Leaf size={14} />
                  <span>স্পেশাল অফার</span>
               </div>
               <h3 className="text-3xl font-bold text-brand-charcoal mb-2 font-serif">অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট</h3>
               <p className="text-brand-charcoal/60 text-sm">ইবুক + সাপোর্ট গ্রুপ + লাইফটাইম এক্সেস</p>
            </div>

            {/* Price */}
            <div className="text-center mb-10">
              <div className="flex items-center justify-center gap-3">
                 {regularPrice && (
                     <span className="text-2xl text-brand-charcoal/40 line-through decoration-brand-olive/50 decoration-2">৳{toBengaliNumber(regularPrice)}</span>
                 )}
                 <span className="text-6xl font-black text-brand-charcoal tracking-tighter">৳{toBengaliNumber(price)}</span>
              </div>
              {regularPrice && regularPrice > price && (
                <p className="text-brand-olive text-sm font-bold mt-3 bg-brand-olive/5 inline-block px-4 py-1 rounded-full">
                  আজই সেভ করুন {toBengaliNumber(Math.round(((regularPrice - price) / regularPrice) * 100))}%
                </p>
              )}
            </div>

            {/* Value Stack */}
            <ul className="space-y-4 mb-10">
              {[
                {text: "অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট", val: "মূল্য ৪০০ টাকা"},
                {text: "কমিউনিটি গ্রুপ এক্সেস", val: "মূল্য ১৫০০ টাকা"},
                {text: "লাইফটাইম আপডেট ও সাপোর্ট", val: "অমূল্য"},
                {text: "সিক্রেট ফর্মুলা চেকলিস্ট", val: ""}
              ].map((item, i) => (
                <li key={i} className="flex justify-between items-center text-brand-charcoal/80">
                  <div className="flex items-center gap-3">
                    <div className="w-5 h-5 rounded-full bg-brand-olive/10 flex items-center justify-center text-brand-olive flex-shrink-0">
                        <Check size={14} strokeWidth={3} />
                    </div>
                    <span className="text-sm font-medium">{item.text}</span>
                  </div>
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Button 
                text={`${toBengaliNumber(price)} টাকায় বইটি সংগ্রহ করুন`}
                fullWidth 
                className="mb-4 text-lg py-5 bg-brand-olive hover:bg-brand-leaf text-white shadow-lg shadow-brand-olive/20" 
                onClick={onOpenModal} 
            />
            
            <div className="flex items-center justify-center gap-2 text-xs text-brand-charcoal/50">
               <Shield size={14} className="text-brand-olive" /> ১০০% নিরাপদ পেমেন্ট (bKash/Card)
            </div>

          </div>
        </div>
        
        <div className="mt-12 text-center max-w-xl mx-auto">
           <p className="text-brand-charcoal/70 italic font-serif text-lg">
             "বইটা পড়ার পর মনে হয়েছে—আগে শুধু কেমিক্যাল প্রোডাক্ট বিক্রি করে লাভ খুঁজতাম, কিন্তু কাস্টমার স্যাটিসফ্যাকশন পেতাম না। এই বইয়ের গাইডলাইন ফলো করে এখন আমি নিজের অর্গানিক ব্র্যান্ড তৈরি করেছি। এখন আমি কনফিডেন্টলি আমার ব্যবসা লিড করছি।"
           </p>
           <p className="text-brand-olive font-semibold mt-4">— তানভীর হাসান, <span className="text-brand-charcoal/60 font-normal text-sm">অর্গানিক স্কিনকেয়ার উদ্যোক্তা</span></p>
        </div>

      </div>
    </section>
  );
};

export default Pricing;