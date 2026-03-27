import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="bg-brand-charcoal text-brand-ivory/60 py-12 border-t border-brand-olive/20">
      <div className="container mx-auto px-4 text-center">
        <p className="text-brand-ivory/80 font-medium mb-6 text-sm">
          বিকাশ, নগদ, রকেট এবং যেকোনো কার্ড দিয়ে পেমেন্ট করা যাবে।
        </p>
        <div className="flex justify-center gap-6 text-xs text-brand-ivory/40">
          <span>&copy; {new Date().getFullYear()} Shehzin Publications - সর্বস্বত্ব সংরক্ষিত।</span>
        </div>
      </div>
    </footer>
  );
};

export default Footer;