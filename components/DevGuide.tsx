import React, { useState } from 'react';
import { Terminal, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';

const DevGuide: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[100] bg-brand-cream text-brand-charcoal/80 px-4 py-2 rounded-full shadow-lg border border-brand-olive/20 hover:bg-brand-cream transition-colors text-xs font-mono flex items-center gap-2"
      >
        <Terminal size={14} /> Dev Guide
      </button>
    );
  }

  return (
    <section className="bg-brand-ivory text-brand-charcoal/80 py-12 border-t border-brand-olive/20 font-mono text-sm relative">
      <button 
        onClick={() => setIsOpen(false)}
        className="absolute top-4 right-4 p-2 text-brand-charcoal/60 hover:text-brand-charcoal"
      >
        <ChevronDown />
      </button>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex items-center gap-3 mb-8 pb-4 border-b border-brand-olive/20">
          <div className="p-3 bg-blue-500/10 rounded-lg text-brand-olive">
            <Terminal size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-brand-charcoal">Developer & Content Guide</h2>
            <p className="text-brand-charcoal/60">How to manage this landing page</p>
          </div>
        </div>

        <div className="space-y-12">
          
          {/* 1. How to Change Images */}
          <div>
            <h3 className="text-lg font-bold text-brand-charcoal mb-4 flex items-center gap-2">
              <span className="text-orange-500">01.</span> Updating Images
            </h3>
            <p className="mb-4">
              To replace the Author image, Book Cover, or Preview pages, you have two options:
            </p>
            <div className="space-y-4 pl-4 border-l-2 border-brand-olive/20">
              <div>
                <strong className="text-brand-charcoal block mb-1">Option A: Using External URLs (Easiest)</strong>
                <p className="mb-2">Simply find the component file (e.g., `components/Author.tsx`) and replace the `src` URL.</p>
                <div className="bg-white p-4 rounded-lg border border-brand-olive/20 relative group">
                  <code className="text-brand-leaf">src="https://your-hosting.com/image.jpg"</code>
                </div>
              </div>
              <div>
                <strong className="text-brand-charcoal block mb-1">Option B: Using Local Assets</strong>
                <p className="mb-2">Place your images in a `public/assets` folder and reference them.</p>
                <div className="bg-white p-4 rounded-lg border border-brand-olive/20">
                  <code className="text-brand-leaf">src="/assets/my-image.jpg"</code>
                </div>
              </div>
            </div>
          </div>

          {/* 2. Adding Book Preview Pages */}
          <div>
            <h3 className="text-lg font-bold text-brand-charcoal mb-4 flex items-center gap-2">
              <span className="text-orange-500">02.</span> Adding Book Preview Pages
            </h3>
            <p className="mb-4">
              Open the file <code className="bg-brand-cream px-1 rounded text-brand-charcoal">components/BookPreview.tsx</code>. You will see an array named `samplePages`. Add your image URLs there.
            </p>
            <div className="bg-white p-4 rounded-lg border border-brand-olive/20 relative">
              <button 
                onClick={() => copyCode(`const samplePages = [\n  "/images/page-1.jpg",\n  "/images/page-2.jpg",\n  "/images/page-3.jpg"\n];`)}
                className="absolute top-2 right-2 p-2 bg-brand-cream rounded hover:bg-brand-cream transition-colors"
              >
                {copied ? <Check size={14} className="text-green-500"/> : <Copy size={14} />}
              </button>
              <pre className="text-xs overflow-x-auto">
{`// components/BookPreview.tsx

const samplePages = [
  "https://link-to-page-1.jpg", 
  "https://link-to-page-2.jpg",
  "https://link-to-page-3.jpg"
];`}
              </pre>
            </div>
          </div>

          {/* 3. Editing Text */}
          <div>
            <h3 className="text-lg font-bold text-brand-charcoal mb-4 flex items-center gap-2">
              <span className="text-orange-500">03.</span> Editing Text Content
            </h3>
            <p className="mb-4">
              All text is directly inside the React components. 
            </p>
            <ul className="list-disc pl-6 space-y-2 text-brand-charcoal/70">
              <li><strong>Hero Section:</strong> Edit <code className="text-brand-olive">components/Hero.tsx</code></li>
              <li><strong>Features:</strong> Edit <code className="text-brand-olive">components/Features.tsx</code></li>
              <li><strong>Pricing:</strong> Edit <code className="text-brand-olive">components/Pricing.tsx</code></li>
              <li><strong>FAQ:</strong> Edit <code className="text-brand-olive">components/FAQ.tsx</code> (Look for the `faqs` array)</li>
            </ul>
          </div>

        </div>
      </div>
    </section>
  );
};

export default DevGuide;