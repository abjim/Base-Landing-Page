import React from 'react';
import { Quote, Star, User } from 'lucide-react';

const reviews = [
  {
    name: "আয়েশা সিদ্দিকা",
    role: "বিউটি এন্টারপ্রেনার",
    text: "আগে শুধু অন্যের প্রোডাক্ট কিনে বিক্রি করতাম, লাভ তেমন হতো না। এই বইয়ের 'সিক্রেট ফর্মুলা' ফলো করে এখন আমি নিজের ব্র্যান্ডের প্রোডাক্ট বানাচ্ছি।",
    bg: "bg-brand-olive/20"
  },
  {
    name: "সাদিয়া আফরিন",
    role: "অনলাইন সেলার",
    text: "কেমিক্যাল প্রোডাক্ট বিক্রি করে কাস্টমারদের অনেক কমপ্লেইন শুনতাম। বইয়ের গাইডলাইন ফলো করে ১০০% অর্গানিক প্রোডাক্ট তৈরি করে এখন কাস্টমাররা অনেক খুশি।",
    bg: "bg-brand-leaf/20"
  },
  {
    name: "তাসনিম রহমান",
    role: "স্টুডেন্ট ও উদ্যোক্তা",
    text: "পড়াশোনার পাশাপাশি কিছু করতে চাচ্ছিলাম। এই ব্লুপ্রিন্ট আমাকে জিরো-কস্ট মার্কেটিং এবং এআই দিয়ে ব্র্যান্ডিং করতে অনেক সাহায্য করেছে।",
    bg: "bg-brand-brown/20"
  }
];

const Testimonials: React.FC = () => {
  return (
    <section className="py-24 bg-brand-ivory relative">
      <div className="container mx-auto px-4 relative z-10">
        
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-5xl font-bold text-brand-charcoal mb-4">
            পাঠকরা কী বলছেন?
          </h2>
          <p className="text-brand-charcoal/70 text-lg max-w-2xl mx-auto">
            যারা <span className="text-brand-olive font-bold">অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট</span> পড়ে নিজেদের জীবন বদলে ফেলেছেন।
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
           {reviews.map((review, idx) => (
             <div key={idx} className="bg-white p-8 rounded-2xl border border-brand-olive/10 hover:border-brand-olive/30 transition-all duration-300 relative group shadow-sm hover:shadow-md hover:-translate-y-1">
                <Quote className="absolute top-6 right-6 text-brand-olive/10 group-hover:text-brand-olive/20 transition-colors" size={40} />
                
                <div className="flex gap-1 text-brand-brown mb-4">
                  {[...Array(5)].map((_, i) => <Star key={i} size={14} fill="currentColor" />)}
                </div>

                <blockquote className="text-brand-charcoal/80 leading-relaxed mb-8 relative z-10 text-sm italic">
                  "{review.text}"
                </blockquote>
                
                <div className="flex items-center gap-4 border-t border-brand-olive/10 pt-6">
                   <div className="relative">
                     <div className={`w-12 h-12 rounded-full ${review.bg} flex items-center justify-center border border-brand-olive/20 relative z-10`}>
                        <User className="text-brand-charcoal/50" size={24} />
                     </div>
                   </div>
                   <div>
                      <h4 className="text-brand-charcoal font-bold text-sm">{review.name}</h4>
                      <p className="text-brand-charcoal/50 text-xs">{review.role}</p>
                   </div>
                </div>
             </div>
           ))}
        </div>

      </div>
    </section>
  );
};

export default Testimonials;