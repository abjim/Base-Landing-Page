import React, { useState, useEffect, useCallback } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { X, ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Loader2, Maximize2, Minimize2, Sun, Moon, Coffee } from 'lucide-react';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Configure PDF worker safely
try {
  if (pdfjs && pdfjs.version) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
  } else {
    // Fallback for some environments or older versions
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@latest/build/pdf.worker.min.mjs`;
  }
} catch (e) {
  console.error("Failed to configure PDF worker", e);
}

interface PDFReaderProps {
  url: string;
  initialPage: number;
  onClose: () => void;
  onProgressUpdate: (page: number, total: number) => void;
  title: string;
}

type Theme = 'dark' | 'light' | 'sepia';

const PDFReader: React.FC<PDFReaderProps> = ({ url, initialPage, onClose, onProgressUpdate, title }) => {
  const [numPages, setNumPages] = useState<number | null>(null);
  const [pageNumber, setPageNumber] = useState(initialPage || 1);
  const [scale, setScale] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [theme, setTheme] = useState<Theme>('dark');

  // Debounce progress update
  useEffect(() => {
    const timer = setTimeout(() => {
      if (numPages) {
        onProgressUpdate(pageNumber, numPages);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [pageNumber, numPages, onProgressUpdate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') changePage(1);
      if (e.key === 'ArrowLeft') changePage(-1);
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [pageNumber, numPages]);

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  const changePage = useCallback((offset: number) => {
    setPageNumber(prev => {
      const newPage = prev + offset;
      if (numPages && (newPage < 1 || newPage > numPages)) return prev;
      return newPage;
    });
  }, [numPages]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const getThemeStyles = () => {
    switch (theme) {
      case 'light': return 'bg-brand-ivory text-brand-charcoal';
      case 'sepia': return 'bg-[#f4ecd8] text-[#5b4636]';
      default: return 'bg-brand-charcoal text-brand-ivory';
    }
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col transition-colors duration-300 ${getThemeStyles()}`}>
      {/* Toolbar */}
      <div className={`h-16 flex items-center justify-between px-4 shadow-xl z-10 border-b ${theme === 'dark' ? 'bg-brand-charcoal/90 border-brand-olive/20' : theme === 'light' ? 'bg-white border-brand-olive/10' : 'bg-[#eaddcf] border-[#d3c4b1]'}`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${theme === 'dark' ? 'hover:bg-brand-olive/20 text-brand-ivory/70 hover:text-brand-charcoal' : 'hover:bg-black/5 text-brand-charcoal/70'}`}
          >
            <X size={24} />
          </button>
          <h2 className="font-medium truncate max-w-[150px] md:max-w-md hidden md:block opacity-90">
            {title}
          </h2>
        </div>

        {/* Page Controls */}
        <div className={`flex items-center gap-2 md:gap-4 rounded-lg p-1 ${theme === 'dark' ? 'bg-brand-olive/20' : 'bg-black/5'}`}>
          <button 
            onClick={() => changePage(-1)} 
            disabled={pageNumber <= 1}
            className="p-1.5 rounded disabled:opacity-30 hover:bg-black/10 transition-colors"
          >
            <ChevronLeft size={20} />
          </button>
          <span className="text-sm font-mono min-w-[80px] text-center opacity-80">
            {pageNumber} / {numPages || '--'}
          </span>
          <button 
            onClick={() => changePage(1)} 
            disabled={pageNumber >= (numPages || 1)}
            className="p-1.5 rounded disabled:opacity-30 hover:bg-black/10 transition-colors"
          >
            <ChevronRight size={20} />
          </button>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1 md:gap-2">
          {/* Theme Toggle */}
          <div className={`flex items-center rounded-lg p-1 mr-2 ${theme === 'dark' ? 'bg-brand-olive/20' : 'bg-black/5'}`}>
            <button onClick={() => setTheme('light')} className={`p-1.5 rounded ${theme === 'light' ? 'bg-white shadow text-orange-500' : 'text-brand-charcoal/50'}`} title="Light Mode"><Sun size={16} /></button>
            <button onClick={() => setTheme('sepia')} className={`p-1.5 rounded ${theme === 'sepia' ? 'bg-[#f4ecd8] shadow text-[#8b6b4e]' : 'text-brand-charcoal/50'}`} title="Sepia Mode"><Coffee size={16} /></button>
            <button onClick={() => setTheme('dark')} className={`p-1.5 rounded ${theme === 'dark' ? 'bg-brand-olive shadow text-brand-ivory' : 'text-brand-charcoal/50'}`} title="Dark Mode"><Moon size={16} /></button>
          </div>

          <button 
            onClick={() => setScale(s => Math.max(0.5, s - 0.1))}
            className="p-2 rounded-full hover:bg-black/5 hidden md:block opacity-70 hover:opacity-100"
          >
            <ZoomOut size={20} />
          </button>
          <button 
            onClick={() => setScale(s => Math.min(2.0, s + 0.1))}
            className="p-2 rounded-full hover:bg-black/5 hidden md:block opacity-70 hover:opacity-100"
          >
            <ZoomIn size={20} />
          </button>
          <button 
            onClick={toggleFullscreen}
            className="p-2 rounded-full hover:bg-black/5 hidden md:block opacity-70 hover:opacity-100"
          >
            {isFullscreen ? <Minimize2 size={20} /> : <Maximize2 size={20} />}
          </button>
        </div>
      </div>

      {/* PDF Content */}
      <div className="flex-1 overflow-auto flex justify-center p-4 md:p-8 relative transition-colors duration-300">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <Loader2 className="animate-spin text-brand-olive" size={48} />
          </div>
        )}
        
        <Document
          file={url}
          onLoadSuccess={onDocumentLoadSuccess}
          loading={
            <div className="flex items-center justify-center h-full">
              <Loader2 className="animate-spin text-brand-olive" size={32} />
            </div>
          }
          error={
            <div className="flex flex-col items-center justify-center h-full text-red-500">
              <p>Failed to load PDF.</p>
              <button onClick={onClose} className="mt-4 text-sm underline">Go Back</button>
            </div>
          }
          className={`shadow-2xl transition-opacity duration-500 ${loading ? 'opacity-0' : 'opacity-100'}`}
        >
          <Page 
            pageNumber={pageNumber} 
            scale={scale} 
            renderTextLayer={false} 
            renderAnnotationLayer={false}
            className="shadow-2xl"
            loading=""
          />
        </Document>
      </div>
    </div>
  );
};

export default PDFReader;
