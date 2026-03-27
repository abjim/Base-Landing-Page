import React from 'react';
import { Flag, Star, Trophy, ArrowDown, Leaf } from 'lucide-react';
import Button from './Button';

interface RoadmapProps {
  onOpenModal?: () => void;
}

const Roadmap: React.FC<RoadmapProps> = ({ onOpenModal }) => {
  const levels = [
    { title: "ব্র্যান্ড মাইন্ডসেট (Brand Mindset)", days: "সপ্তাহ ১", desc: "কীভাবে শুরু করবেন এবং কেন হারবাল প্রোডাক্টের ব্যবসাতেই সম্ভাবনা বেশি।", color: "border-brand-olive text-brand-olive" },
    { title: "কাঁচামাল সোর্সিং (Sourcing)", days: "সপ্তাহ ২", desc: "১০০% খাঁটি ভেষজ পাউডার, কোল্ড-প্রেসড অয়েল বা এসেনশিয়াল অয়েল চিনে নেওয়ার কৌশল।", color: "border-brand-leaf text-brand-leaf" },
    { title: "প্রোডাক্ট তৈরি (Product Making)", days: "সপ্তাহ ৩", desc: "৫টি সিগনেচার প্রোডাক্ট তৈরির পদ্ধতি: ম্যাজিক হারবাল হেয়ার অয়েল, ফেস প্যাক, লিপবাম, পেইন রিলিফ অয়েল এবং মসকিউটো রিপেলেন্ট।", color: "border-brand-brown text-brand-brown" },
    { title: "ব্র্যান্ডিং ও মার্কেটিং (Branding & Marketing)", days: "সপ্তাহ ৪", desc: "কীভাবে এআই ব্যবহার করে আপনার ব্র্যান্ডের নাম মানুষের মুখে মুখে ছড়াবেন এবং জিরো-কস্ট মার্কেটিং করবেন।", color: "border-brand-sage text-brand-olive" },
    { title: "বিজনেস অটোমেশন (Business Automation)", days: "বোনাস", desc: "ভাইব কোডিং (Vibe Coding) দিয়ে নিজের ডিজিটাল সাম্রাজ্য নিজেই গড়ুন।", color: "border-brand-clay text-brand-brown" }
  ];

  return (
    <section id="roadmap" className="py-24 bg-brand-ivory relative">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-16">
          <span className="text-brand-olive font-bold uppercase tracking-widest text-xs mb-2 block flex items-center justify-center gap-1"><Leaf size={14}/> অ্যাকশন প্ল্যান</span>
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-charcoal mb-6">
            সাফল্যের <span className="text-brand-olive font-serif italic">প্র্যাকটিক্যাল রোডম্যাপ</span>
          </h2>
          <p className="text-brand-charcoal/70 max-w-2xl mx-auto">
            বই পড়ে বসে থাকলে হবে না। আমরা আপনাকে একটি কমপ্লিট অ্যাকশন প্ল্যান দিচ্ছি। এই স্টেপগুলো ফলো করে আজই নিজের জীবন বদলানো শুরু করুন।
          </p>
        </div>

        <div className="max-w-4xl mx-auto relative">
           {/* Vertical Line */}
           <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-brand-olive/20 transform -translate-x-1/2 hidden md:block"></div>
           
           <div className="space-y-8 relative">
              {levels.map((level, idx) => (
                <div key={idx} className={`flex flex-col md:flex-row items-center gap-6 ${idx % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                   
                   {/* Content Side */}
                   <div className="w-full md:w-1/2">
                      <div className={`bg-white p-6 rounded-2xl border-l-4 ${level.color} shadow-sm hover:shadow-md transition-all group`}>
                         <div className="flex justify-between items-start mb-2">
                            <span className={`text-xs font-bold px-2 py-1 rounded bg-brand-cream uppercase ${level.color.split(' ')[1]}`}>{level.days}</span>
                            {idx === levels.length - 1 ? <Trophy size={20} className="text-brand-brown" /> : <Star size={16} className="text-brand-olive/40 group-hover:text-brand-olive transition-colors" />}
                         </div>
                         <h3 className="text-xl font-bold text-brand-charcoal mb-1">{level.title}</h3>
                         <p className="text-brand-charcoal/70 text-sm">{level.desc}</p>
                      </div>
                   </div>

                   {/* Center Point */}
                   <div className="absolute left-4 md:left-1/2 transform -translate-x-1/2 w-8 h-8 rounded-full bg-brand-cream border-4 border-white flex items-center justify-center z-10 shadow-sm">
                      <div className={`w-2 h-2 rounded-full ${idx === levels.length - 1 ? 'bg-brand-brown animate-pulse' : 'bg-brand-olive'}`}></div>
                   </div>

                   {/* Empty Side for layout balance */}
                   <div className="w-full md:w-1/2 hidden md:block"></div>
                </div>
              ))}
           </div>
           
           <div className="mt-16 text-center">
              <Button 
                text="আজই শুরু করতে চাই" 
                className="bg-brand-olive hover:bg-brand-leaf text-white border-0 !py-4 !px-8 text-lg shadow-md" 
                pulsing 
                onClick={onOpenModal} 
              />
           </div>

        </div>

      </div>
    </section>
  );
};

export default Roadmap;