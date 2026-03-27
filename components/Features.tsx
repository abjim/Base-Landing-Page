import React from 'react';
import { Book, Droplet, Brain, DollarSign, Package, TrendingUp, Leaf, Sparkles } from 'lucide-react';
import Button from './Button';

interface FeaturesProps {
  onOpenModal?: () => void;
}

const Features: React.FC<FeaturesProps> = ({ onOpenModal }) => {
  const features = [
    {
      title: "কোন পণ্য দিয়ে শুরু করবেন",
      desc: "নতুনদের জন্য কোন ধরনের অর্গানিক স্কিন কেয়ার প্রোডাক্ট তুলনামূলক সহজ ও ডিমান্ড ফ্রেন্ডলি হতে পারে—তা বুঝতে সাহায্য করবে।",
      icon: <TrendingUp size={24} />,
      color: "text-brand-olive",
      bg: "bg-brand-olive/10",
      border: "border-brand-olive/20"
    },
    {
      title: "কী কী কাঁচামাল লাগবে",
      desc: "প্রাথমিক ইনগ্রেডিয়েন্টস, সোর্সিং আইডিয়া, আর কীভাবে স্মার্টভাবে শুরু করবেন—তার পরিষ্কার ধারণা পাবেন।",
      icon: <Leaf size={24} />,
      color: "text-brand-leaf",
      bg: "bg-brand-leaf/10",
      border: "border-brand-leaf/20"
    },
    {
      title: "কম বাজেটে সেটআপ রোডম্যাপ",
      desc: "ঘরের ছোট জায়গা, বেসিক টুলস, হাইজিন আর ওয়ার্কেবল প্রসেস—সবকিছু বিগেনারফ্রেন্ডলি ভাবে সাজানোর গাইডলাইন।",
      icon: <Droplet size={24} />,
      color: "text-brand-brown",
      bg: "bg-brand-brown/10",
      border: "border-brand-brown/20"
    },
    {
      title: "ব্র্যান্ডিং ও প্যাকেজিং নিয়ে ভাবতে শিখবেন",
      desc: "শুধু প্রোডাক্ট বানালেই হবে না—কীভাবে সেটাকে ব্র্যান্ড হিসেবে প্রেজেন্ট করবেন, সে দিকেও গাইডেন্স পাবেন।",
      icon: <Sparkles size={24} />,
      color: "text-brand-sage",
      bg: "bg-brand-sage/20",
      border: "border-brand-sage/30"
    },
    {
      title: "বিক্রির প্র্যাক্টিক্যাল ডিরেকশন পাবেন",
      desc: "সোশ্যাল মিডিয়া-তে কীভাবে নিজের প্রোডাক্ট নিয়ে কমিউনিকেট করবেন, শুরুতে কীভাবে অডিয়েন্স টার্গেট করবেন—সেটা বুঝতে পারবেন।",
      icon: <Brain size={24} />,
      color: "text-brand-olive",
      bg: "bg-brand-olive/10",
      border: "border-brand-olive/20"
    },
    {
      title: "ভুল কমিয়ে দ্রুত শুরু করতে পারবেন",
      desc: "এলোমেলো ট্র্যায়াল-এন্ড-ইরোর না করে, একটা গুছানো ফাউন্ডেশন নিয়ে শুরু করার কনফিডেন্স পাবেন।",
      icon: <DollarSign size={24} />,
      color: "text-brand-brown",
      bg: "bg-brand-brown/10",
      border: "border-brand-brown/20"
    }
  ];

  return (
    <section id="features" className="py-24 bg-brand-ivory relative">
      <div className="container mx-auto px-4 relative z-10">
        
        {/* Solution Header */}
        <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-brand-charcoal mb-6">
               বইয়ের ভেতরে <br/> <span className="text-brand-olive border-b-2 border-brand-olive/30 pb-2 font-serif italic">কী আছে?</span>
            </h2>
            <p className="text-brand-charcoal/70 text-lg max-w-2xl mx-auto">
               সাধারণ মোটিভেশনাল কথা দিয়ে বইয়ের পাতা ফিলাপ করা হয় নাই, প্র্যাকটিক্যাল ফ্রেমওয়ার্ক পাবেন এখানে।
            </p>
        </div>

        {/* Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto mb-16">
          {features.map((item, idx) => (
            <div 
              key={idx} 
              className={`p-8 rounded-2xl border ${item.border} bg-white hover:shadow-md hover:-translate-y-1 transition-all duration-300 group`}
            >
              <div className={`w-14 h-14 rounded-full ${item.bg} ${item.color} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`} >
                {item.icon}
              </div>
              <h3 className="text-xl font-bold text-brand-charcoal mb-3">{item.title}</h3>
              <p className="text-brand-charcoal/70 text-sm leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>

        {/* Mid-Section CTA */}
        <div className="max-w-4xl mx-auto bg-brand-cream rounded-3xl p-8 md:p-12 border border-brand-olive/20 text-center relative overflow-hidden shadow-sm">
           <div className="absolute top-0 left-0 w-full h-1 bg-brand-olive"></div>
           <h3 className="text-2xl font-bold text-brand-charcoal mb-6">
              কেমিক্যাল প্রসাধনীর পেছনে না ছুটে, আজই নিজের অর্গানিক ব্র্যান্ড তৈরির যাত্রা শুরু করুন!
           </h3>
           <Button 
             text="বইটি এখনই ডাউনলোড করুন" 
             className="bg-brand-olive text-white hover:bg-brand-leaf border-0 !text-base !py-3 !px-8 shadow-md" 
             pulsing 
             onClick={onOpenModal} 
           />
           <p className="text-brand-charcoal/50 text-xs mt-4">১০০% মানিব্যাক গ্যারান্টি • কোন রিস্ক নেই</p>
        </div>

      </div>
    </section>
  );
};

export default Features;