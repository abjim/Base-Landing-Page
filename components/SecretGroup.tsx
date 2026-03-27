import React from 'react';
import Button from './Button';
import { Users, MessageCircle, Heart, Leaf } from 'lucide-react';
import { toBengaliNumber } from '../utils';

interface SecretGroupProps {
  onOpenModal?: () => void;
  price: number;
}

const SecretGroup: React.FC<SecretGroupProps> = ({ onOpenModal, price }) => {
  return (
    <section id="community" className="py-24 bg-brand-ivory relative overflow-hidden">
      <div className="container mx-auto px-4 relative z-10">
        
        <div className="flex flex-col lg:flex-row items-center gap-16">
           
           <div className="w-full lg:w-1/2">
               <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-olive/10 text-brand-olive font-bold text-xs uppercase tracking-wider mb-6">
                 <Users size={14} /> কমিউনিটি বোনাস
              </div>
               <h2 className="text-3xl lg:text-5xl font-bold text-brand-charcoal mb-6 font-serif">
                সঠিক গাইডলাইন ছাড়া একা একা অর্গানিক ব্র্যান্ড তৈরি করতে গেলে <br/> <span className="text-brand-olive italic">হতাশ হয়ে যাবেন!</span>
              </h2>
              <p className="text-brand-charcoal/70 text-lg leading-relaxed mb-8">
                বইটি কেনার সাথে সাথেই আপনি পাবেন আমাদের <strong>এক্সক্লুসিভ কমিউনিটি</strong>-এ লাইফটাইম এক্সেস। যেখানে আমাদের মেম্বাররা তাদের লার্নিং শেয়ার করে।
              </p>
              
              <div className="space-y-6 mb-10">
                 <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-olive/10 flex items-center justify-center text-brand-olive shrink-0">
                       <MessageCircle size={24} />
                    </div>
                    <div>
                       <h4 className="text-brand-charcoal font-bold text-lg">কমিউনিটি সাপোর্ট</h4>
                       <p className="text-brand-charcoal/60 text-sm">গ্রুপে আমাদের অনেক মেম্বার আছে, যারা আমাদের প্ল্যাটফর্মের বিভিন্ন কোর্স করেছে, ইবুক কিনেছে, নতুন ব্যবসা গড়েছে... এই পুরো মেম্বারদের থেকেও আপনি প্রতিনিয়ত শিখবেন ও সাপোর্ট পাবেন।</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-full bg-brand-leaf/10 flex items-center justify-center text-brand-leaf shrink-0">
                       <Heart size={24} />
                    </div>
                    <div>
                       <h4 className="text-brand-charcoal font-bold text-lg">কমিউনিটি গাইডেন্স</h4>
                       <p className="text-brand-charcoal/60 text-sm">আমাদের কমিউনিটিতে সবাই একে অপরকে সাহায্য করে। আপনি আপনার নতুন ব্যবসার আইডিয়া বা প্ল্যান শেয়ার করতে পারবেন এবং অন্যদের থেকে ফিডব্যাক পাবেন।</p>
                    </div>
                 </div>
              </div>

              <Button 
                text={`গ্রুপে জয়েন করুন (${toBengaliNumber(price)} টাকায়)`}
                className="bg-brand-olive hover:bg-brand-leaf text-white border-0 !px-8 shadow-lg shadow-brand-olive/20"
                onClick={onOpenModal}
              />
              <p className="text-brand-charcoal/50 text-xs mt-3 ml-2">* বইটি কিনলেই গ্রুপের লিংক পাবেন।</p>
           </div>

           <div className="w-full lg:w-1/2 relative">
               {/* Phone Mockup or Group Screenshot representation */}
               <div className="relative mx-auto w-[300px] h-[600px] bg-white rounded-[3rem] border-8 border-brand-cream shadow-2xl overflow-hidden">
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-6 bg-brand-cream rounded-b-xl z-20"></div>
                  
                  {/* Mock Chat Interface */}
                  <div className="w-full h-full bg-brand-ivory pt-12 px-4 pb-4 overflow-hidden flex flex-col gap-4">
                      {/* Post 1 */}
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-brand-olive/5 animate-fade-in-up">
                         <div className="flex gap-2 items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-brand-olive/20"></div>
                            <div>
                               <div className="w-24 h-2 bg-brand-cream rounded"></div>
                               <div className="w-12 h-1.5 bg-brand-cream/50 rounded mt-1"></div>
                            </div>
                         </div>
                         <div className="w-full h-24 bg-brand-cream rounded mb-2"></div>
                         <div className="w-full h-2 bg-brand-cream rounded"></div>
                      </div>

                      {/* Post 2 (Community Member) */}
                      <div className="bg-white p-3 rounded-xl border border-brand-olive/20 shadow-sm animate-fade-in-up" style={{animationDelay: '0.2s'}}>
                         <div className="flex gap-2 items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-brand-olive flex items-center justify-center text-xs font-bold text-white">OS</div>
                            <div>
                               <p className="text-brand-charcoal text-xs font-bold">Learning Bangladesh</p>
                               <p className="text-[10px] text-brand-charcoal/50">Community</p>
                            </div>
                         </div>
                         <p className="text-brand-charcoal/70 text-xs mb-2">আজকের টিপস: কীভাবে ১০০% খাঁটি অর্গানিক প্রোডাক্ট তৈরি করবেন। আমাদের নতুন গাইডলাইনটা দেখে নিন...</p>
                         <div className="w-full h-24 bg-brand-cream rounded flex items-center justify-center text-brand-olive relative overflow-hidden">
                             <div className="absolute inset-0 bg-brand-olive/5"></div>
                             <span className="relative z-10 text-xs font-bold text-brand-olive/60">Video Preview</span>
                         </div>
                      </div>

                      {/* Post 3 */}
                      <div className="bg-white p-3 rounded-xl shadow-sm border border-brand-olive/5 animate-fade-in-up" style={{animationDelay: '0.4s'}}>
                         <div className="flex gap-2 items-center mb-2">
                            <div className="w-8 h-8 rounded-full bg-brand-leaf/20"></div>
                            <div className="flex-1">
                               <div className="w-20 h-2 bg-brand-cream rounded"></div>
                            </div>
                         </div>
                         <div className="w-3/4 h-2 bg-brand-cream rounded mb-1"></div>
                         <div className="w-1/2 h-2 bg-brand-cream rounded"></div>
                      </div>
                  </div>

                  {/* Gradient Overlay */}
                  <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-white to-transparent z-10"></div>
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-max">
                     <span className="bg-brand-olive text-white text-xs px-3 py-1 rounded-full shadow-lg">Joined 65k+ Members</span>
                  </div>
               </div>
           </div>

        </div>

      </div>
    </section>
  );
};

export default SecretGroup;