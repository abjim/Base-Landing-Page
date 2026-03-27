import React from 'react';
import { Leaf } from 'lucide-react';

const Author: React.FC = () => {
  return (
    <section id="author" className="py-24 bg-brand-cream relative overflow-hidden scroll-mt-24">
      {/* Subtle Background Pattern */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cream-paper.png')] opacity-30 mix-blend-multiply"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-5xl mx-auto bg-white border border-brand-olive/10 rounded-3xl overflow-hidden flex flex-col md:flex-row items-center shadow-sm">
            
            {/* Image */}
            <div className="w-full md:w-1/3 relative h-[400px] md:h-auto">
                <img 
                    src="https://organic.shehzin.com/uploads/author.jpg" 
                    alt="Rayhan Patowary" 
                    className="w-full h-full object-cover filter sepia-[0.2] hover:sepia-0 transition-all duration-700"
                    onError={(e) => {e.currentTarget.src = 'https://ui-avatars.com/api/?name=Rayhan+Patowary&background=F4F1EA&color=2D3748&size=400'}}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-6">
                    <h3 className="text-2xl font-bold text-white">রায়হান পাটোয়ারী</h3>
                </div>
            </div>

            {/* Content */}
            <div className="w-full md:w-2/3 p-8 md:p-12">
                <span className="text-brand-olive font-bold tracking-widest text-xs uppercase mb-2 block flex items-center gap-1"><Leaf size={14}/> লেখক সম্পর্কে</span>
                <h2 className="text-3xl font-bold text-brand-charcoal mb-6 font-serif italic">
                    আমরা কোনো থিওরিটিক্যাল টিচার নই, প্র্যাকটিক্যাল এক্সপেরিয়েন্স শেয়ার করছি...
                </h2>
                
                <div className="space-y-4 text-brand-charcoal/70 text-sm leading-relaxed">
                    <p>
                        আমি বিশ্বাস করি, সঠিক গাইডলাইন পেলে যে কেউ সফল হতে পারে। এই ইবুকটি কোনো সাধারণ মোটিভেশনাল বই নয়, এটি একটি প্র্যাকটিক্যাল বিজনেস ব্লুপ্রিন্ট।
                    </p>
                    <p>
                        অর্গানিক স্কিন কেয়ার ইন্ডাস্ট্রিতে আমার দীর্ঘদিনের অভিজ্ঞতা এবং সফল ব্র্যান্ড তৈরির সিক্রেটগুলোই এখানে সহজ বাংলায় শেয়ার করা হয়েছে।
                    </p>
                </div>

                <div className="mt-8 pt-8 border-t border-brand-olive/10">
                    <h4 className="text-brand-charcoal font-bold mb-2 text-sm">রায়হান পাটোয়ারী</h4>
                    <p className="text-brand-charcoal/50 text-xs">অর্গানিক স্কিন কেয়ার - বিজনেস ব্লুপ্রিন্ট</p>
                </div>
            </div>

        </div>
      </div>
    </section>
  );
};

export default Author;