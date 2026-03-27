import React, { useState, useEffect, useCallback } from 'react';
import { Eye, BookOpen, ChevronLeft, ChevronRight, Lock, ArrowRight, Leaf } from 'lucide-react';
import Button from './Button';

const samplePages = [
  "https://organic.shehzin.com/uploads/1.jpg",
  "https://organic.shehzin.com/uploads/2.jpg",
  "https://organic.shehzin.com/uploads/3.jpg",
  "https://organic.shehzin.com/uploads/4.jpg",
  "https://organic.shehzin.com/uploads/5.jpg",
  "https://organic.shehzin.com/uploads/6.jpg",
  "https://organic.shehzin.com/uploads/7.jpg",
  "https://organic.shehzin.com/uploads/8.jpg",
  "https://organic.shehzin.com/uploads/9.jpg",
  "https://organic.shehzin.com/uploads/10.jpg"
];

const chapters = [
  { title: "সূচিপত্র", start: 0, end: 9, locked: false },
  { title: "কোন পণ্য দিয়ে শুরু করবেন", locked: true },
  { title: "কী কী কাঁচামাল লাগবে", locked: true },
  { title: "কম বাজেটে সেটআপ রোডম্যাপ", locked: true },
  { title: "ব্র্যান্ডিং ও প্যাকেজিং নিয়ে ভাবতে শিখবেন", locked: true },
  { title: "বিক্রির প্র্যাক্টিক্যাল ডিরেকশন পাবেন", locked: true },
  { title: "ভুল কমিয়ে দ্রুত শুরু করতে পারবেন", locked: true }
];

interface BookPreviewProps {
  onOpenModal: () => void;
  pageCount?: string;
}

const BookPreview: React.FC<BookPreviewProps> = ({ onOpenModal, pageCount = '১৩৫+' }) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % samplePages.length);
  }, []);

  const handlePrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + samplePages.length) % samplePages.length);
  }, []);

  // Determine current active chapter
  const activeChapterIndex = chapters.findIndex(ch => 
    !ch.locked && currentIndex >= (ch.start || 0) && currentIndex <= (ch.end || 0)
  );

  return (
    <section id="preview" className="py-24 bg-brand-ivory relative overflow-hidden scroll-mt-24">
      <div className="container mx-auto px-4 relative z-10">
        
        <div className="text-center mb-12">
          <div className="inline-block bg-white rounded-full px-4 py-1.5 mb-4 border border-brand-olive/20 shadow-sm">
             <span className="text-brand-olive text-xs font-bold tracking-wide flex items-center gap-2">
               <BookOpen size={14} /> বইয়ের প্রিভিউ
             </span>
          </div>
          <h2 className="text-3xl lg:text-4xl font-bold text-brand-charcoal mb-4">
            সূচীপত্র পড়ে দেখুন—তারপর সিদ্ধান্ত নিন
          </h2>
          <p className="text-brand-charcoal/70 text-sm max-w-2xl mx-auto italic">
            "কিনব নাকি কিনব না"—এই দ্বিধা দূর করার সবচেয়ে ভালো রাস্তা: কনটেন্ট আগে দেখুন। এই ইবুকের প্রথম ১০ পাতা পড়তে পারবেন—হয়তো আপনার মাথায় পরিষ্কার হয়ে যাবে এটা বই না, এটা আপনার মাইন্ডসেট বিল্ডিং ব্লুপ্রিন্ট।
          </p>
        </div>

        <div className="max-w-6xl mx-auto bg-white rounded-3xl overflow-hidden border border-brand-olive/10 shadow-md flex flex-col lg:flex-row">
           
           {/* Left Side: Book Viewer */}
           <div className="w-full lg:w-2/3 p-4 md:p-8 bg-brand-cream relative flex flex-col justify-center items-center">
              
              {/* Navigation Controls */}
              <button 
                onClick={handlePrev} 
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/80 hover:bg-white rounded-full text-brand-charcoal transition backdrop-blur-sm border border-brand-olive/10 shadow-sm"
              >
                <ChevronLeft size={24}/>
              </button>
              
              <button 
                onClick={handleNext} 
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-3 bg-white/80 hover:bg-white rounded-full text-brand-charcoal transition backdrop-blur-sm border border-brand-olive/10 shadow-sm"
              >
                <ChevronRight size={24}/>
              </button>

              {/* Page Counter */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white/90 px-4 py-1 rounded-full text-xs text-brand-charcoal backdrop-blur-md border border-brand-olive/10 z-20 shadow-sm">
                Page {currentIndex + 1} of {samplePages.length}
              </div>

              {/* Image Container */}
              <div className="relative w-full max-w-md aspect-[3/4] shadow-lg rounded-lg overflow-hidden border border-brand-olive/10 bg-white">
                 <img 
                   src={samplePages[currentIndex]} 
                   alt={`Book Page ${currentIndex + 1}`} 
                   className="w-full h-full object-contain"
                 />
              </div>
           </div>

           {/* Right Side: Table of Contents */}
           <div className="w-full lg:w-1/3 bg-white border-l border-brand-olive/10 flex flex-col">
              <div className="p-6 border-b border-brand-olive/10 bg-brand-ivory/50">
                 <h3 className="text-brand-olive font-bold flex items-center gap-2 uppercase tracking-wider text-sm">
                   <BookOpen size={16} /> Table of Contents
                 </h3>
              </div>
              
              <div className="flex-1 overflow-y-auto max-h-[500px] p-4 space-y-1 custom-scrollbar">
                 {chapters.map((chapter, idx) => {
                   const isActive = idx === activeChapterIndex;
                   return (
                     <div 
                       key={idx} 
                       className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                         isActive 
                           ? 'bg-brand-olive/10 text-brand-charcoal border-l-2 border-brand-olive' 
                           : 'text-brand-charcoal/60 hover:bg-brand-cream'
                       }`}
                     >
                        {chapter.locked ? (
                          <Lock size={14} className="shrink-0 opacity-50" />
                        ) : (
                          <div className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-brand-olive shadow-[0_0_8px_rgba(85,107,47,0.4)]' : 'bg-brand-olive/30'}`}></div>
                        )}
                        
                        <span className={`text-sm ${isActive ? 'font-semibold' : 'font-normal'}`}>
                          {chapter.title}
                        </span>
                     </div>
                   );
                 })}
              </div>

              {/* CTA in Sidebar */}
              <div className="p-6 border-t border-brand-olive/10 bg-brand-ivory/50">
                 <div className="text-center mb-4">
                    <p className="text-brand-charcoal/50 text-xs uppercase tracking-widest mb-1">Full Version</p>
                    <h4 className="text-2xl font-bold text-brand-charcoal">{pageCount} পেইজ</h4>
                 </div>
                 <Button 
                   text="আনলক করুন (১৯৯৳)" 
                   fullWidth 
                   className="bg-brand-olive hover:bg-brand-leaf text-white font-bold border-0 shadow-md"
                   onClick={onOpenModal}
                 />
              </div>
           </div>

        </div>

      </div>
    </section>
  );
};

export default BookPreview;