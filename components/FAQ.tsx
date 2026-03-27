import React, { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle, Leaf } from 'lucide-react';

const faqs = [
  {
    q: "আমি কি এই বই পড়ে সত্যিই একটি সফল অর্গানিক ব্র্যান্ড তৈরি করতে পারবো?",
    a: "একটি সফল ব্র্যান্ড তৈরি করা রাতারাতি কোনো ম্যাজিক নয়। তবে এই বইতে দেওয়া গাইডলাইন এবং ফর্মুলাগুলো ফলো করলে আপনি খুব সহজেই নিজের অর্গানিক স্কিন কেয়ার ব্র্যান্ড দাঁড় করাতে পারবেন।"
  },
  {
    q: "আমার তো আগে কোনো ব্যবসার অভিজ্ঞতা নেই, আমি কি পারবো?",
    a: "অবশ্যই! এই বইটি এমনভাবে লেখা হয়েছে যাতে একদম বিগিনাররাও বুঝতে পারে। প্রোডাক্ট তৈরি থেকে শুরু করে মার্কেটিং—সবকিছুই খুব সহজ ভাষায় ধাপে ধাপে তুলে ধরা হয়েছে।"
  },
  {
    q: "বইটি কি হার্ডকপি নাকি ইবুক?",
    a: "এটি একটি হাই-কোয়ালিটি PDF ইবুক। পেমেন্ট করার সাথে সাথেই আপনি ডাউনলোডের লিংক পেয়ে যাবেন। মোবাইল, ল্যাপটপ বা ট্যাবে খুব সহজেই পড়তে পারবেন।"
  },
  {
    q: "বইটি পছন্দ না হলে কি রিফান্ড পাবো?",
    a: "জি, ১০০%! আমরা আমাদের কনটেন্টের ভ্যালু সম্পর্কে এতটাই কনফিডেন্ট যে আমরা 'Money Back Guarantee' দিচ্ছি। বইটি পড়ার পর যদি মনে হয় এটি আপনার কোনো উপকারে আসেনি, আমাদের জানালেই বিনা প্রশ্নে আপনার টাকা ফেরত দেওয়া হবে।"
  },
  {
    q: "কমিউনিটি গ্রুপে কী হবে?",
    a: "বইটি কেনার পর আপনি আমাদের এক্সক্লুসিভ কমিউনিটি গ্রুপে জয়েন করতে পারবেন। সেখানে আপনি আপনার প্রোগ্রেস শেয়ার করতে পারবেন, প্রশ্ন করতে পারবেন এবং অন্যদের জার্নি থেকে অনুপ্রাণিত হতে পারবেন।"
  },
  {
    q: "পেমেন্ট করার পর ডাউনলোড লিংক না পেলে কী করবো?",
    a: "টেনশনের কিছু নেই! আমাদের সিস্টেম অটোমেটেড, তাই পেমেন্ট কমপ্লিট হলেই লিংক ইমেইলে চলে যায়। তবুও সমস্যা হলে আমাদের সাপোর্টে নক করলেই দ্রুত সমাধান পাবেন।"
  }
];

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="py-20 bg-brand-ivory scroll-mt-24">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-brand-cream mb-6">
            <Leaf className="text-brand-olive" size={32} />
          </div>
          <h2 className="text-3xl font-bold text-brand-charcoal font-serif">সচরাচর জিজ্ঞাসা (FAQ)</h2>
          <p className="text-brand-charcoal/60 mt-3">আপনার মনে হতে পারে এমন কিছু প্রশ্নের উত্তর</p>
        </div>
        
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={index} className="bg-white rounded-xl border border-brand-olive/10 overflow-hidden transition-all duration-300 hover:border-brand-olive/30 shadow-sm shadow-brand-olive/5">
              <button
                className="w-full flex items-center justify-between p-6 text-left font-semibold text-brand-charcoal hover:bg-brand-cream/50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="text-base md:text-lg pr-4">{faq.q}</span>
                {openIndex === index ? <ChevronUp className="text-brand-olive" size={20} /> : <ChevronDown className="text-brand-charcoal/40" size={20} />}
              </button>
              
              {openIndex === index && (
                <div className="p-6 pt-0 text-brand-charcoal/70 border-t border-brand-olive/5 mt-2 leading-relaxed text-sm md:text-base">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;