import React from 'react';
import { Leaf } from 'lucide-react';

const designs = [
  { title: "উদ্যোক্তা হওয়ার প্রথম ধাপ", image: "https://organic.shehzin.com/uploads/1.jpg" },
  { title: "ভেষজ উপাদান পরিচিতি", image: "https://organic.shehzin.com/uploads/2.jpg" },
  { title: "সিক্রেট ফর্মুলা", image: "https://organic.shehzin.com/uploads/3.jpg" },
  { title: "এআই (AI) এর জাদুতে ব্র্যান্ডিং", image: "https://organic.shehzin.com/uploads/4.jpg" },
  { title: "বিজনেস অটোমেশন", image: "https://organic.shehzin.com/uploads/5.jpg" },
  { title: "সফলতার ব্লু-প্রিন্ট", image: "https://organic.shehzin.com/uploads/6.jpg" },
];

const DesignShowcase: React.FC = () => {
  return (
    <section className="py-24 bg-brand-cream relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("https://www.transparenttextures.com/patterns/cream-paper.png")' }}></div>
      
      <div className="container mx-auto px-4 relative z-10">
        
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-olive/10 border border-brand-olive/20 mb-4">
             <Leaf size={14} className="text-brand-olive" />
             <span className="text-xs text-brand-olive font-bold uppercase tracking-wider">Mindset Showcase</span>
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-charcoal mb-6 font-serif">
            <span className="text-brand-olive italic">সাফল্যের</span> ব্লু-প্রিন্ট
          </h2>
          <p className="text-brand-charcoal/70 max-w-2xl mx-auto">
            মুখের কথায় বিশ্বাস করবেন না, আউটপুট দেখুন। এই সব প্র্যাকটিস সেশন তৈরি করা হয়েছে আমাদের গাইডলাইন ব্যবহার করে।
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
           {designs.map((item, idx) => (
             <div key={idx} className="group relative rounded-2xl overflow-hidden aspect-[9/16] border border-brand-olive/10 bg-white shadow-sm shadow-brand-olive/5">
                {/* Image */}
                <img 
                  src={item.image} 
                  alt={item.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  loading="lazy"
                />
                
                {/* Overlay Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-brand-charcoal/90 via-brand-charcoal/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300"></div>
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-6 transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
                   <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{item.title}</h3>
                   <div className="h-1 w-12 bg-brand-olive rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                </div>

                {/* Top Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md border border-brand-olive/10 px-3 py-1 rounded-full text-[10px] text-brand-olive font-mono opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform -translate-y-2 group-hover:translate-y-0 font-bold">
                   SUCCESSFUL
                </div>
             </div>
           ))}
        </div>

      </div>
    </section>
  );
};

export default DesignShowcase;
