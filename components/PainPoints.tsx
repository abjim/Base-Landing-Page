import React from 'react';
import { TrendingDown, Frown, Factory, ShieldAlert, AlertCircle } from 'lucide-react';

const PainPoints: React.FC = () => {
  const points = [
    {
      title: "কেমিক্যাল লাভার",
      subtitle: "কেমিক্যাল লাভার",
      desc: "যারা কেমিক্যাল প্রসাধনী বিক্রি করে রাতারাতি বড়লোক হতে চান, এই বই তাদের জন্য নয়। ১০০% খাঁটি পণ্য তৈরির মানসিকতা না থাকলে বইটি এড়িয়ে চলুন।",
      icon: <Factory className="text-brand-brown" size={28} />,
      bg: "bg-white",
      border: "border-brand-olive/10"
    },
    {
      title: "অলস উদ্যোক্তা",
      subtitle: "অলস উদ্যোক্তা",
      desc: "যারা নিজের হাতে প্রোডাক্ট তৈরি করতে চান না, শুধু অন্যের প্রোডাক্ট কিনে বিক্রি করতে চান, এই বই তাদের জন্য নয়।",
      icon: <TrendingDown className="text-brand-brown" size={28} />,
      bg: "bg-white",
      border: "border-brand-olive/10"
    },
    {
      title: "শর্টকাট সিকার",
      subtitle: "শর্টকাট সিকার",
      desc: "যারা মনে করেন ব্যবসা মানেই কোনো ম্যাজিক ফর্মুলা বা রাতারাতি বড়লোক হওয়ার উপায়, তাদের জন্য এই বই কোনো কাজে আসবে না।",
      icon: <AlertCircle className="text-brand-brown" size={28} />,
      bg: "bg-white",
      border: "border-brand-olive/10"
    }
  ];

  return (
    <section className="py-24 bg-brand-cream relative overflow-hidden">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white border border-brand-olive/20 text-brand-brown text-xs font-bold uppercase tracking-wider mb-6 shadow-sm">
            <ShieldAlert size={14} /> রিয়েলিটি চেক
          </div>
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-charcoal mb-6 leading-tight">
            কাদের জন্য এই বইটা <br/>
            <span className="text-brand-olive italic font-serif">
               একদমই না?
            </span>
          </h2>
          <p className="text-brand-charcoal/70 text-lg max-w-2xl mx-auto">
             শুরুতেই একটা 'ফিল্টার' দিয়ে দিই। আমি চাই না ভুল মানুষের হাতে এই বইটা পড়ুক। আপনি যদি নিচের ৩টি ক্যাটাগরির কোনো একটিতে পড়েন, তবে দয়া করে এই বইটা এখানেই বন্ধ করুন।
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {points.map((item, idx) => (
            <div key={idx} className={`bg-white p-8 rounded-2xl border ${item.border} hover:border-brand-olive/30 hover:-translate-y-1 transition-all duration-300 group shadow-sm hover:shadow-md`}>
              <div className={`mb-6 ${item.bg} w-16 h-16 rounded-full border border-brand-olive/10 flex items-center justify-center shadow-sm transform group-hover:scale-105 transition-transform`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-charcoal mb-4">{item.subtitle}</h3>
              <p className="text-brand-charcoal/70 text-base leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PainPoints;