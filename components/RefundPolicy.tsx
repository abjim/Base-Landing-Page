import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { toBengaliNumber } from '../utils';

interface RefundPolicyProps {
  price?: number;
}

const RefundPolicy: React.FC<RefundPolicyProps> = ({ price = 199 }) => {
  return (
    <section className="py-20 bg-brand-ivory border-t border-brand-olive/10">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto bg-brand-cream p-8 md:p-12 rounded-3xl border border-brand-olive/20 text-center relative overflow-hidden shadow-sm">
           
           <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-brand-olive/10 rounded-full blur-3xl"></div>
           <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-brand-leaf/10 rounded-full blur-3xl"></div>

           <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-md border border-brand-olive/10">
              <ShieldCheck className="text-brand-olive" size={40} />
           </div>

           <h2 className="text-2xl md:text-3xl font-bold text-brand-charcoal mb-4">
             ১০০% মানিব্যাক গ্যারান্টি (No Risk)
           </h2>
           
           <p className="text-brand-charcoal/70 leading-relaxed mb-6">
             আমরা আমাদের মেথড নিয়ে এতটাই কনফিডেন্ট যে আপনাকে এই গ্যারান্টি দিচ্ছি। বইটি কেনার পর এবং মেথডগুলো অ্যাপ্লাই করার পর যদি মনে হয় আপনার কোনো উপকার হচ্ছে না, বা এটি আপনার জন্য নয়—আমাদের সাপোর্টে একটা মেইল করবেন।
           </p>
           
           <p className="text-brand-charcoal font-medium text-lg">
             বিনা প্রশ্নে আপনার <span className="text-brand-olive font-bold border-b border-brand-olive">{toBengaliNumber(price)} টাকা ফেরত</span> দেওয়া হবে।
           </p>
           
           <p className="text-brand-charcoal/50 text-sm mt-6">
             আপনার হারানোর কিছু নেই, কিন্তু জেতার আছে একটি সফল মাইন্ডসেট ও সমৃদ্ধ জীবন।
           </p>

        </div>
      </div>
    </section>
  );
};

export default RefundPolicy;