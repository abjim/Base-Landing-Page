import React from 'react';
import { ArrowRight } from 'lucide-react';

const ChapterTeaser: React.FC = () => {
  return (
    <section id="chapters" className="py-24 bg-brand-cream border-t border-brand-olive/10">
      <div className="container mx-auto px-4">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-brand-charcoal mb-4 font-serif">
            বইয়ের ভেতরে <span className="text-brand-olive italic">কী আছে?</span>
          </h2>
          <p className="text-brand-charcoal/60">অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট এর অধ্যায়গুলোর এক ঝলক</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {/* Chapter 1 */}
            <div className="bg-white p-6 rounded-2xl border border-brand-olive/10 hover:border-brand-olive/30 transition-colors group shadow-sm shadow-brand-olive/5">
               <div className="text-4xl font-black text-brand-olive/10 group-hover:text-brand-olive/20 mb-2 transition-colors font-serif">01</div>
               <h3 className="text-xl font-bold text-brand-charcoal mb-2">উদ্যোক্তা হওয়ার প্রথম ধাপ</h3>
               <p className="text-brand-charcoal/70 text-sm">মাইন্ডসেট ও প্রস্তুতি: কীভাবে শুরু করবেন এবং কেন হারবাল প্রোডাক্টের ব্যবসাতেই সম্ভাবনা বেশি।</p>
            </div>

            {/* Chapter 2 */}
            <div className="bg-white p-6 rounded-2xl border border-brand-olive/10 hover:border-brand-olive/30 transition-colors group shadow-sm shadow-brand-olive/5">
               <div className="text-4xl font-black text-brand-olive/10 group-hover:text-brand-olive/20 mb-2 transition-colors font-serif">02</div>
               <h3 className="text-xl font-bold text-brand-charcoal mb-2">ভেষজ উপাদান পরিচিতি</h3>
               <p className="text-brand-charcoal/70 text-sm">কাঁচামাল সোর্সিং: ১০০% খাঁটি ভেষজ পাউডার, কোল্ড-প্রেসড অয়েল বা এসেনশিয়াল অয়েল চিনে নেওয়ার কৌশল।</p>
            </div>

            {/* Chapter 3 */}
            <div className="bg-white p-6 rounded-2xl border border-brand-olive/10 hover:border-brand-olive/30 transition-colors group shadow-sm shadow-brand-olive/5">
               <div className="text-4xl font-black text-brand-olive/10 group-hover:text-brand-olive/20 mb-2 transition-colors font-serif">03</div>
               <h3 className="text-xl font-bold text-brand-charcoal mb-2">সিক্রেট ফর্মুলা</h3>
               <p className="text-brand-charcoal/70 text-sm">৫টি সিগনেচার প্রোডাক্ট তৈরির পদ্ধতি: ম্যাজিক হারবাল হেয়ার অয়েল, ফেস প্যাক, লিপবাম, পেইন রিলিফ অয়েল এবং মসকিউটো রিপেলেন্ট।</p>
            </div>

            {/* Chapter 4 */}
            <div className="bg-white p-6 rounded-2xl border border-brand-olive/10 hover:border-brand-olive/30 transition-colors group shadow-sm shadow-brand-olive/5">
               <div className="text-4xl font-black text-brand-olive/10 group-hover:text-brand-olive/20 mb-2 transition-colors font-serif">04</div>
               <h3 className="text-xl font-bold text-brand-charcoal mb-2">এআই (AI) এর জাদুতে ব্র্যান্ডিং</h3>
               <p className="text-brand-charcoal/70 text-sm">কীভাবে এআই ব্যবহার করে আপনার ব্র্যান্ডের নাম মানুষের মুখে মুখে ছড়াবেন এবং জিরো-কস্ট মার্কেটিং করবেন।</p>
            </div>

            {/* Chapter 5 */}
            <div className="bg-white p-6 rounded-2xl border border-brand-olive/10 hover:border-brand-olive/30 transition-colors group shadow-sm shadow-brand-olive/5">
               <div className="text-4xl font-black text-brand-olive/10 group-hover:text-brand-olive/20 mb-2 transition-colors font-serif">05</div>
               <h3 className="text-xl font-bold text-brand-charcoal mb-2">বিজনেস অটোমেশন</h3>
               <p className="text-brand-charcoal/70 text-sm">ভাইব কোডিং (Vibe Coding) দিয়ে নিজের ডিজিটাল সাম্রাজ্য নিজেই গড়ুন।</p>
            </div>

             {/* Chapter 6 */}
             <div className="bg-brand-olive p-6 rounded-2xl shadow-lg shadow-brand-olive/20 transform md:scale-105">
               <div className="text-4xl font-black text-white/20 mb-2 font-serif">06</div>
               <h3 className="text-xl font-bold text-white mb-2">এআই এবং ভবিষ্যতের প্রস্তুতি</h3>
               <p className="text-white/90 text-sm">টেকনোলজিকে ভয় না পেয়ে কীভাবে এআই-কে নিজের অ্যাসিস্ট্যান্ট বানিয়ে ১০ গুণ প্রোডাক্টিভ হবেন।</p>
               <div className="mt-4 flex items-center gap-2 text-white text-xs font-bold uppercase tracking-wider">
                  আরও অনেক কিছু <ArrowRight size={14}/>
               </div>
            </div>
        </div>
      </div>
    </section>
  );
};

export default ChapterTeaser;