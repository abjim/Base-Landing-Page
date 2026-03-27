import React, { useState, useEffect } from 'react';
import Button from './Button';
import { Menu, X, Sparkles } from 'lucide-react';

interface NavbarProps {
  onOpenModal: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ onOpenModal }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const element = document.querySelector(href);
    if (element) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      
      setMobileMenuOpen(false);
    }
  };

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'py-3' : 'py-5'}`}>
      <div className={`absolute inset-0 bg-brand-ivory/90 backdrop-blur-xl border-b border-brand-olive/10 transition-opacity ${isScrolled ? 'opacity-100' : 'opacity-0'}`}></div>
      <div className="container mx-auto px-4 relative flex justify-between items-center h-16">
        
        <a 
          href="#hero" 
          onClick={(e) => scrollToSection(e, '#hero')}
          className="flex items-center gap-2 group cursor-pointer shrink-0 py-2"
          aria-label="Home"
        >
          <div className="w-10 h-10 rounded-xl bg-brand-olive flex items-center justify-center font-bold text-white group-hover:scale-110 transition-transform shadow-lg shadow-brand-olive/20">
            <Sparkles size={22} />
          </div>
          <div className="text-xl font-bold text-brand-charcoal tracking-tight leading-none font-sans">
            অর্গানিক স্কিন কেয়ার
            <span className="block text-[10px] font-medium text-brand-leaf tracking-widest uppercase mt-1">বিজনেস ব্লুপ্রিন্ট</span>
          </div>
        </a>

        {/* Desktop Links */}
        <div className="hidden lg:flex items-center justify-center gap-8 flex-1">
           {[
             { name: 'রোডম্যাপ', href: '#roadmap' },
             { name: 'কমিউনিটি', href: '#community' },
             { name: 'প্রিভিউ', href: '#preview' },
             { name: 'প্রাইসিং', href: '#pricing' },
             { name: 'FAQ', href: '#faq' },
           ].map((link) => (
             <a 
               key={link.name}
               href={link.href} 
               onClick={(e) => scrollToSection(e, link.href)}
               className="text-brand-charcoal/80 hover:text-brand-olive text-sm font-bold tracking-wide transition-colors cursor-pointer relative group py-2"
             >
               {link.name}
               <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-brand-olive transition-all duration-300 group-hover:w-full"></span>
             </a>
           ))}
        </div>

        {/* Desktop Button */}
        <div className="hidden md:block shrink-0">
          <Button 
            text="বইটি সংগ্রহ করুন" 
            className="text-sm py-2.5 px-6 !rounded-lg min-h-[44px] bg-brand-olive hover:bg-brand-leaf text-white border-0" 
            pulsing={false}
            onClick={onOpenModal}
          />
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-brand-charcoal p-2 rounded-lg hover:bg-brand-cream transition-colors"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-expanded={mobileMenuOpen}
          aria-label={mobileMenuOpen ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
        >
          {mobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile Menu Dropdown */}
      <div className={`absolute top-full left-0 right-0 bg-brand-ivory border-b border-brand-olive/10 transition-all duration-300 overflow-hidden ${mobileMenuOpen ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}>
        <div className="container mx-auto px-4 py-6 flex flex-col gap-2">
           {[
             { name: 'রোডম্যাপ', href: '#roadmap' },
             { name: 'কমিউনিটি', href: '#community' },
             { name: 'প্রিভিউ', href: '#preview' },
             { name: 'প্রাইসিং', href: '#pricing' },
             { name: 'FAQ', href: '#faq' },
           ].map((link) => (
            <a 
              key={link.name}
              href={link.href} 
              onClick={(e) => scrollToSection(e, link.href)}
              className="text-brand-charcoal hover:text-brand-olive py-4 px-2 block border-b border-brand-cream last:border-0 text-lg font-bold active:bg-brand-cream rounded-lg transition-colors"
            >
              {link.name}
            </a>
          ))}
          <div className="pt-4 pb-2">
            <Button text="বইটি সংগ্রহ করুন" fullWidth className="!py-4 bg-brand-olive text-white border-0" onClick={() => { setMobileMenuOpen(false); onOpenModal(); }} />
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;