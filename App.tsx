import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import PainPoints from './components/PainPoints';
import Features from './components/Features';
import ChapterTeaser from './components/ChapterTeaser';
import BookPreview from './components/BookPreview';
import Testimonials from './components/Testimonials';
import Pricing from './components/Pricing';
import FAQ from './components/FAQ';
import Footer from './components/Footer';
import Button from './components/Button';
import FloatingCTA from './components/FloatingCTA';
import PaymentModal from './components/PaymentModal';
import AdminDashboard from './components/AdminDashboard';
import AdminSetup from './components/AdminSetup';
import SuccessPage from './components/SuccessPage';
import Roadmap from './components/Roadmap';
import SecretGroup from './components/SecretGroup';
import RefundPolicy from './components/RefundPolicy';
import { toBengaliNumber } from './utils';
import SocialProofPopup from './components/SocialProofPopup';

import Login from './components/Login';
import Dashboard from './components/Dashboard';
import ForgotPassword from './components/ForgotPassword';
import ErrorBoundary from './components/ErrorBoundary';

// Declare global types for analytics
declare global {
  interface Window {
    dataLayer: any[];
    gtag: (...args: any[]) => void;
    fbq: any;
    _fbq: any;
  }
}

// Helper to inject scripts dynamically
const loadScripts = async (): Promise<any> => {
    try {
        const res = await fetch('/api/get_public_settings.php');
        const text = await res.text();

        // Safety check: If PHP returns raw code (starts with <) or HTML error, abort.
        if (text.trim().startsWith('<')) {
            console.warn("Analytics: Backend API not responding with JSON (Raw PHP/HTML detected). Tracking disabled.");
            return {}; // Default fallback
        }

        const settings = JSON.parse(text);
        
        // Set Favicon
        if (settings.favicon_url) {
            let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'icon';
                document.head.appendChild(link);
            }
            link.href = settings.favicon_url;
        }

        // 1. Google Tag Manager
        if(settings.gtm_id) {
            (function(w: any,d: any,s: any,l: any,i: any){w[l]=w[l]||[];w[l].push({'gtm.start':
            new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
            j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
            'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer', settings.gtm_id);
        }

        // 2. Google Analytics 4
        if(settings.ga4_id) {
            const script = document.createElement('script') as HTMLScriptElement;
            script.async = true;
            script.src = `https://www.googletagmanager.com/gtag/js?id=${settings.ga4_id}`;
            document.head.appendChild(script);

            window.dataLayer = window.dataLayer || [];
            window.gtag = function(...args: any[]){ window.dataLayer.push(arguments); };
            window.gtag('js', new Date());
            window.gtag('config', settings.ga4_id);
        }

        // 3. Facebook Pixel
        if(settings.fb_pixel_id) {
             (function(f: any,b: any,e: any,v: any,n?: any,t?: any,s?: any)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)})(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              
              window.fbq('init', settings.fb_pixel_id); 
              window.fbq('track', 'PageView');
        }

        return settings;

    } catch (e) {
        console.error("Failed to load tracking scripts", e);
        return {};
    }
};

// Wrapper for the landing page content
const LandingPage: React.FC<{ onOpenModal: () => void, price: number, regularPrice: number | null, isModalOpen: boolean, pageCount: string }> = ({ onOpenModal, price, regularPrice, isModalOpen, pageCount }) => {
  return (
    <>
      <Navbar onOpenModal={onOpenModal} />
      <Hero onOpenModal={onOpenModal} price={price} regularPrice={regularPrice} pageCount={pageCount} />
      <PainPoints />
      <Features onOpenModal={onOpenModal} />
      <Roadmap onOpenModal={onOpenModal} />
      <ChapterTeaser />
      <BookPreview onOpenModal={onOpenModal} pageCount={pageCount} />
      <SecretGroup onOpenModal={onOpenModal} price={price} />
      <Testimonials />
      <Pricing onOpenModal={onOpenModal} price={price} regularPrice={regularPrice} />
      <RefundPolicy price={price} />
      <FAQ />
      <Footer />
      <FloatingCTA onOpenModal={onOpenModal} price={price} regularPrice={regularPrice} />
      <SocialProofPopup isModalOpen={isModalOpen} />
      
      {/* Sticky Mobile CTA Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-3 bg-white/95 backdrop-blur-xl border-t border-brand-olive/10 md:hidden z-40 safe-area-inset-bottom shadow-[0_-10px_40px_rgba(85,107,47,0.1)]">
        <div className="flex items-center justify-between gap-4 max-w-md mx-auto">
           <div className="flex flex-col">
             {regularPrice && (
                 <span className="text-[10px] text-brand-charcoal/50 line-through leading-none">৳{toBengaliNumber(regularPrice)}</span>
             )}
             <span className="text-2xl font-black text-brand-charcoal leading-tight">৳{toBengaliNumber(price)}</span>
           </div>
           <div className="flex-1 max-w-[200px]">
             <Button 
                text="এখনই কিনুন" 
                fullWidth 
                pulsing 
                className="!py-3 !px-4 !text-base !rounded-xl bg-brand-olive hover:bg-brand-leaf text-white shadow-lg shadow-brand-olive/20 border-0" 
                onClick={onOpenModal} 
             />
           </div>
        </div>
      </div>
      <div className="h-24 md:hidden"></div>
    </>
  );
};

const ScrollToTop = () => {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
};

const App: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [price, setPrice] = useState(199);
  const [regularPrice, setRegularPrice] = useState<number | null>(null);
  const [pageCount, setPageCount] = useState('১৩৫+');

  // Load Tracking Scripts Once on Mount
  useEffect(() => {
      // Affiliate Tracking
      const params = new URLSearchParams(window.location.search);
      const refCode = params.get('ref');
      if (refCode) {
          localStorage.setItem('affiliate_ref', refCode);
          // Track Click
          fetch('/api/affiliate/track_click.php', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ code: refCode, ip: 'client-side-ip-placeholder' }) // IP handled by server usually, but sending placeholder
          }).catch(err => console.error("Tracking error", err));
      }

      loadScripts();

      // Fetch main product price and regular price
      fetch('/api/get_public_products.php')
        .then(res => res.json())
        .then(data => {
            const mainP = (data.products || []).find((p: any) => p.type === 'main' && p.status === 'ACTIVE');
            if (mainP) {
                if (mainP.price) setPrice(Number(mainP.price));
                if (mainP.regular_price) setRegularPrice(Number(mainP.regular_price));
                if (mainP.page_count) setPageCount(mainP.page_count);
            }
        })
        .catch(err => console.error("Error fetching products", err));
  }, []);

  return (
    <Router>
      <ScrollToTop />
      <div className="min-h-screen bg-brand-ivory text-brand-charcoal font-sans selection:bg-brand-olive selection:text-white">
        <Routes>
          <Route path="/" element={<LandingPage onOpenModal={() => setIsModalOpen(true)} price={price} regularPrice={regularPrice} isModalOpen={isModalOpen} pageCount={pageCount} />} />
          <Route path="/success" element={<SuccessPage />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/admin-setup" element={<AdminSetup />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ErrorBoundary>
              <Dashboard />
            </ErrorBoundary>
          } />
          <Route path="/forgot-password" element={<ForgotPassword />} />
        </Routes>
        
        <PaymentModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} price={price} />
      </div>
    </Router>
  );
};

export default App;