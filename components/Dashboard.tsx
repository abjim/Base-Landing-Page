import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, LogOut, User, ChevronRight, LayoutGrid, Clock, Menu, X, Loader2, AlertCircle, DollarSign } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ProfileSettings from './ProfileSettings';
import AffiliatePanel from './AffiliatePanel';

// Lazy load PDFReader to prevent issues with worker loading on initial render
const PDFReader = React.lazy(() => import('./PDFReader'));

interface LibraryItem {
  id: string;
  name: string;
  type: 'ebook' | 'bonus';
  download_url: string;
  order_date: string;
  cover_image?: string;
  description?: string;
}

interface ReadingProgress {
  current_page: number;
  total_pages: number;
  last_read_at: string;
}

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [library, setLibrary] = useState<LibraryItem[]>([]);
  const [progressMap, setProgressMap] = useState<Record<string, ReadingProgress>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBook, setSelectedBook] = useState<LibraryItem | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'library' | 'profile' | 'affiliate'>('library');
  
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored ? JSON.parse(stored) : {};
    } catch (e) {
      console.error("Failed to parse user from localStorage", e);
      return {};
    }
  });

  // Update user state when profile is updated
  const handleProfileUpdate = (updatedUser: any) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  };

  // Fetch Data
  useEffect(() => {
    const fetchData = async () => {
      let token;
      try {
        token = localStorage.getItem('authToken');
      } catch (e) {
        console.error("LocalStorage access failed", e);
        setError("Unable to access local storage. Please disable private mode or enable cookies.");
        setLoading(false);
        return;
      }

      if (!token) {
        navigate('/login');
        return;
      }

      try {
        // 1. Fetch Library
        const libRes = await fetch('/api/my_library.php', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!libRes.ok) {
            throw new Error(`HTTP error! status: ${libRes.status}`);
        }

        const libData = await libRes.json();

        if (libData.status !== 'success') {
          if (libData.message === 'Unauthorized' || libData.message === 'Invalid Token') {
            localStorage.removeItem('authToken');
            navigate('/login');
            return;
          }
          throw new Error(libData.message || 'Failed to load library');
        }

        setLibrary(libData.library || []);

        // 2. Fetch Progress
        const progRes = await fetch('/api/get_progress.php', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (progRes.ok) {
            const progData = await progRes.json();
            if (progData.status === 'success' && Array.isArray(progData.progress)) {
              const map: Record<string, ReadingProgress> = {};
              progData.progress.forEach((p: any) => {
                map[p.book_id] = {
                  current_page: parseInt(p.current_page),
                  total_pages: parseInt(p.total_pages),
                  last_read_at: p.last_read_at
                };
              });
              setProgressMap(map);
            }
        }

      } catch (err: any) {
        console.error("Dashboard Error:", err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleProgressUpdate = async (page: number, total: number) => {
    if (!selectedBook) return;

    // Optimistic update
    setProgressMap(prev => ({
      ...prev,
      [selectedBook.id]: {
        current_page: page,
        total_pages: total,
        last_read_at: new Date().toISOString()
      }
    }));

    // API Call
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/save_progress.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          book_id: selectedBook.id,
          current_page: page,
          total_pages: total
        })
      });
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  // Calculate overall stats
  const totalBooks = library.length;
  const booksStarted = Object.keys(progressMap).length;
  
  // Find most recently read book
  const lastReadBookId = Object.keys(progressMap).sort((a, b) => {
    return new Date(progressMap[b].last_read_at).getTime() - new Date(progressMap[a].last_read_at).getTime();
  })[0];
  
  const lastReadBook = library.find(b => b.id === lastReadBookId);

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-ivory flex items-center justify-center">
        <Loader2 className="animate-spin text-brand-olive" size={48} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-ivory flex items-center justify-center text-brand-charcoal p-4">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
             <AlertCircle className="text-red-500" size={32} />
          </div>
          <h2 className="text-xl font-bold text-brand-charcoal mb-2">Something went wrong</h2>
          <p className="text-brand-charcoal/70 mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-6 py-2 bg-brand-olive hover:bg-brand-leaf text-white rounded-lg font-medium transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-ivory text-brand-charcoal font-bengali flex overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-brand-charcoal/50 z-40 md:hidden backdrop-blur-sm"
          />
        )}
      </AnimatePresence>

      {/* Sidebar Navigation */}
      <motion.aside 
        className={`fixed md:relative z-50 w-72 h-full bg-brand-cream border-r border-brand-olive/10 flex flex-col transition-transform duration-300 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        <div className="p-6 border-b border-brand-olive/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-olive rounded-xl flex items-center justify-center shadow-lg shadow-brand-olive/20">
              <BookOpen className="text-white" size={20} />
            </div>
            <span className="font-bold text-xl text-brand-charcoal tracking-tight">PB Reader</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-brand-charcoal/50 hover:text-brand-charcoal">
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <div className="px-4 py-2 text-xs font-semibold text-brand-charcoal/40 uppercase tracking-wider">Menu</div>
          <button 
            onClick={() => { setActiveTab('library'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border ${activeTab === 'library' ? 'bg-brand-olive/10 text-brand-olive border-brand-olive/20' : 'text-brand-charcoal/60 hover:bg-brand-olive/5 hover:text-brand-olive border-transparent'}`}
          >
            <LayoutGrid size={20} />
            <span className="font-medium">My Library</span>
          </button>
          <button 
            onClick={() => { setActiveTab('profile'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border ${activeTab === 'profile' ? 'bg-brand-olive/10 text-brand-olive border-brand-olive/20' : 'text-brand-charcoal/60 hover:bg-brand-olive/5 hover:text-brand-olive border-transparent'}`}
          >
            <User size={20} />
            <span className="font-medium">Profile</span>
          </button>
          <button 
            onClick={() => { setActiveTab('affiliate'); setIsSidebarOpen(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors border ${activeTab === 'affiliate' ? 'bg-brand-olive/10 text-brand-olive border-brand-olive/20' : 'text-brand-charcoal/60 hover:bg-brand-olive/5 hover:text-brand-olive border-transparent'}`}
          >
            <DollarSign size={20} />
            <span className="font-medium">Affiliate Program</span>
          </button>
        </nav>

        <div className="p-4 border-t border-brand-olive/10">
          <div className="flex items-center gap-3 px-4 py-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-white border border-brand-olive/10 flex items-center justify-center text-brand-charcoal/40 overflow-hidden">
               <User size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-brand-charcoal truncate">{user.name || 'User'}</p>
              <p className="text-xs text-brand-charcoal/50 truncate">{user.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-sm font-medium transition-colors border border-red-200"
          >
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Mobile Header */}
        <header className="md:hidden h-16 bg-brand-cream border-b border-brand-olive/10 flex items-center justify-between px-4 z-30">
          <button onClick={() => setIsSidebarOpen(true)} className="text-brand-charcoal/50 hover:text-brand-charcoal">
            <Menu size={24} />
          </button>
          <span className="font-bold text-lg text-brand-charcoal">
            {activeTab === 'library' ? 'My Library' : activeTab === 'profile' ? 'Profile' : 'Affiliate Program'}
          </span>
          <div className="w-8" /> {/* Spacer */}
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 pb-24">
          <div className="max-w-5xl mx-auto space-y-8">
            
            {activeTab === 'profile' ? (
              <ProfileSettings user={user} onUpdate={handleProfileUpdate} />
            ) : activeTab === 'affiliate' ? (
              <AffiliatePanel user={user} onUpdateUser={handleProfileUpdate} />
            ) : (
              <>
                {/* Welcome Section */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-3xl font-bold text-brand-charcoal mb-1">Welcome back, {user.name?.split(' ')[0] || 'Reader'} 👋</h1>
                    <p className="text-brand-charcoal/70">You have {totalBooks} books in your library.</p>
                  </div>
                  
                  {/* Stats Cards */}
                  <div className="flex gap-4">
                    <div className="bg-white border border-brand-olive/20 rounded-xl p-4 min-w-[140px] shadow-sm">
                      <p className="text-xs text-brand-charcoal/50 uppercase tracking-wider mb-1">Books Owned</p>
                      <p className="text-2xl font-bold text-brand-charcoal">{totalBooks}</p>
                    </div>
                    <div className="bg-white border border-brand-olive/20 rounded-xl p-4 min-w-[140px] shadow-sm">
                      <p className="text-xs text-brand-charcoal/50 uppercase tracking-wider mb-1">In Progress</p>
                      <p className="text-2xl font-bold text-brand-olive">{booksStarted}</p>
                    </div>
                  </div>
                </div>

                {/* Continue Reading Section */}
                {lastReadBook && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative overflow-hidden rounded-2xl bg-white border border-brand-olive/20 p-6 md:p-8 shadow-xl shadow-brand-olive/5"
                  >
                    <div className="absolute top-0 right-0 p-4 opacity-[0.03] text-brand-olive">
                      <BookOpen size={200} />
                    </div>
                    
                    <div className="relative z-10 flex flex-col md:flex-row gap-6 md:gap-8 items-start md:items-center">
                      {/* Book Cover Placeholder */}
                      <div className="w-24 h-36 md:w-32 md:h-48 bg-brand-ivory rounded-lg shadow-md flex-shrink-0 flex items-center justify-center border border-brand-olive/10 overflow-hidden relative">
                         {lastReadBook.cover_image ? (
                           <img src={lastReadBook.cover_image} alt={lastReadBook.name} className="w-full h-full object-cover" />
                         ) : (
                           <div className="w-full h-full bg-brand-cream flex items-center justify-center">
                             <BookOpen className="text-brand-olive/20" size={40} />
                           </div>
                         )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-2 py-1 bg-brand-olive/10 text-brand-olive text-xs font-bold rounded-full border border-brand-olive/20 flex items-center gap-1">
                            <Clock size={12} /> Continue Reading
                          </span>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-bold text-brand-charcoal mb-2 leading-tight">{lastReadBook.name}</h2>
                        <p className="text-brand-charcoal/70 mb-6 line-clamp-2">Pick up where you left off. You are currently on page {progressMap[lastReadBook.id]?.current_page} of {progressMap[lastReadBook.id]?.total_pages}.</p>
                        
                        <div className="flex items-center gap-4">
                          <button 
                            onClick={() => setSelectedBook(lastReadBook)}
                            className="px-6 py-3 bg-brand-olive hover:bg-brand-leaf text-white rounded-xl font-bold transition-all shadow-md shadow-brand-olive/20 flex items-center gap-2 group"
                          >
                            <span>Resume Reading</span>
                            <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                          </button>
                          <div className="flex-1 max-w-[200px] h-2 bg-brand-ivory rounded-full overflow-hidden border border-brand-olive/10">
                            <div 
                              className="h-full bg-brand-olive rounded-full" 
                              style={{ width: `${(progressMap[lastReadBook.id]?.current_page / progressMap[lastReadBook.id]?.total_pages) * 100}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* All Books Grid */}
                <div>
                  <h3 className="text-xl font-bold text-brand-charcoal mb-6 flex items-center gap-2">
                    <LayoutGrid size={20} className="text-brand-olive" />
                    Your Collection
                  </h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {library.map((book) => {
                      const progress = progressMap[book.id];
                      const percent = progress ? Math.round((progress.current_page / progress.total_pages) * 100) : 0;

                      return (
                        <motion.div 
                          key={book.id}
                          whileHover={{ y: -5 }}
                          className="bg-white border border-brand-olive/20 rounded-xl overflow-hidden hover:border-brand-olive/50 transition-all group flex flex-col shadow-sm hover:shadow-md"
                        >
                          <div className={`h-64 relative bg-brand-ivory overflow-hidden group-hover:opacity-90 transition-opacity`}>
                            {book.cover_image ? (
                              <img src={book.cover_image} alt={book.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className={`w-full h-full ${book.type === 'ebook' ? 'bg-brand-cream' : 'bg-brand-sage/10'} flex items-center justify-center`}>
                                <div className="w-24 h-32 bg-white rounded shadow-sm border border-brand-olive/10 flex items-center justify-center transform group-hover:scale-105 transition-transform duration-300">
                                   <BookOpen className={book.type === 'ebook' ? "text-brand-olive/30" : "text-brand-sage/40"} size={32} />
                                </div>
                              </div>
                            )}
                            
                            {book.type === 'bonus' && (
                              <span className="absolute top-3 right-3 bg-brand-sage/20 text-brand-sage text-[10px] font-bold px-2 py-1 rounded border border-brand-sage/30 z-10">BONUS</span>
                            )}
                            
                            {/* Overlay on hover */}
                            <div className="absolute inset-0 bg-brand-charcoal/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                               <button 
                                onClick={() => setSelectedBook(book)}
                                className="px-4 py-2 bg-brand-olive text-white rounded-lg font-bold text-sm hover:bg-brand-leaf transition-colors shadow-lg"
                              >
                                Read Now
                              </button>
                            </div>
                          </div>
                          
                          <div className="p-5 flex-1 flex flex-col">
                            <h4 className="font-bold text-brand-charcoal mb-2 line-clamp-2 min-h-[3rem]">{book.name}</h4>
                            
                            {progress ? (
                              <div className="mt-auto">
                                <div className="flex justify-between text-xs text-brand-charcoal/60 mb-1">
                                  <span>{percent}% Complete</span>
                                  <span>{progress.current_page}/{progress.total_pages}</span>
                                </div>
                                <div className="h-1.5 bg-brand-ivory rounded-full overflow-hidden border border-brand-olive/10">
                                  <div className="h-full bg-brand-olive rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                                </div>
                              </div>
                            ) : (
                              <div className="mt-auto pt-2">
                                 <p className="text-xs text-brand-charcoal/40">Not started yet</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {library.length === 0 && !loading && (
                    <div className="text-center py-20 bg-white/50 rounded-2xl border border-brand-olive/20 border-dashed">
                      <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-olive/10">
                        <BookOpen className="text-brand-olive/50" size={32} />
                      </div>
                      <h3 className="text-xl font-bold text-brand-charcoal mb-2">Your library is empty</h3>
                      <p className="text-brand-charcoal/60">It looks like you haven't purchased any books yet.</p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      {/* PDF Reader Modal */}
      {selectedBook && (
        <React.Suspense fallback={
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-charcoal/80 backdrop-blur-sm">
            <Loader2 className="animate-spin text-brand-olive" size={48} />
          </div>
        }>
          <PDFReader 
            url={selectedBook.download_url} 
            initialPage={progressMap[selectedBook.id]?.current_page || 1}
            title={selectedBook.name}
            onClose={() => setSelectedBook(null)}
            onProgressUpdate={handleProgressUpdate}
          />
        </React.Suspense>
      )}
    </div>
  );
};

export default Dashboard;
