"use client";

import { useState, useEffect } from "react";
import { ArrowUp, Search, X, Moon, Sun, Menu, MessageSquare, Loader2 } from "lucide-react";

export function GlobalUI() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [showCookie, setShowCookie] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    // UTM tracking
    const urlParams = new URLSearchParams(window.location.search);
    const utmSource = urlParams.get('utm_source');
    if (utmSource) {
      localStorage.setItem('utm_source', utmSource);
    }

    // Cookie consent check
    if (!localStorage.getItem('cookie_consent')) {
      setShowCookie(true);
    }

    // Scroll listener
    const handleScroll = () => {
      const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrolled = (winScroll / height) * 100;
      setScrollProgress(scrolled);
      setShowBackToTop(winScroll > 300);
    };

    window.addEventListener("scroll", handleScroll);
    
    // Command palette listener (Cmd+K)
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowSearch(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    if (newTheme === "light") {
      document.documentElement.classList.add("light");
    } else {
      document.documentElement.classList.remove("light");
    }
  };

  const acceptCookies = () => {
    localStorage.setItem('cookie_consent', 'true');
    setShowCookie(false);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <a href="#main-content" className="skip-to-content no-print">Skip to Content</a>

      {/* Scroll Progress Bar */}
      <div 
        className="fixed top-0 left-0 h-1 bg-emerald-500 z-[99999] no-print transition-all duration-150 ease-out" 
        style={{ width: `${scrollProgress}%` }}
      />

      {/* Floating Action Buttons (Bottom Right) */}
      <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-[90000] no-print">
        {/* Back to Top */}
        <button 
          onClick={scrollToTop}
          className={`p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-zinc-700 transition-all duration-300 hover:bg-zinc-700 hover:scale-110 ${showBackToTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'}`}
          title="Back to Top"
        >
          <ArrowUp size={20} />
        </button>

        {/* Floating Contact */}
        <button 
          className="p-3 bg-blue-600 text-white rounded-full shadow-lg transition-all duration-300 hover:bg-blue-500 hover:scale-110"
          title="Contact Support"
          onClick={() => alert("Support contact initiated.")}
        >
          <MessageSquare size={20} />
        </button>
      </div>

      {/* Fixed UI Controls (Bottom Left) */}
      <div className="fixed bottom-6 left-6 flex gap-3 z-[90000] no-print">
        <button 
          onClick={toggleTheme}
          className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-zinc-700 transition-all hover:bg-zinc-700"
          title="Toggle Theme"
        >
          {theme === "dark" ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        
        <button 
          onClick={() => setShowSearch(true)}
          className="p-3 bg-zinc-800 text-white rounded-full shadow-lg border border-zinc-700 transition-all hover:bg-zinc-700 md:hidden"
          title="Search"
        >
          <Search size={20} />
        </button>
      </div>

      {/* Cookie Banner */}
      {showCookie && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-zinc-900 border-t border-zinc-800 shadow-2xl z-[90000] flex flex-col md:flex-row justify-between items-center gap-4 animate-in slide-in-from-bottom no-print">
          <p className="text-sm text-zinc-300 text-center md:text-left">
            We use cookies to improve your experience. By continuing, you agree to our privacy policy.
          </p>
          <div className="flex gap-3">
            <button onClick={acceptCookies} className="px-4 py-2 bg-emerald-600 text-white font-bold rounded hover:bg-emerald-500 transition-colors">
              Accept
            </button>
            <button onClick={() => setShowCookie(false)} className="px-4 py-2 bg-zinc-800 text-zinc-400 font-bold rounded hover:bg-zinc-700 transition-colors border border-zinc-700">
              Decline
            </button>
          </div>
        </div>
      )}

      {/* Full Site Search Modal */}
      {showSearch && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[99999] flex items-start justify-center pt-20 px-4 animate-in fade-in no-print" onClick={() => setShowSearch(false)}>
          <div className="w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center p-4 border-b border-zinc-800">
              <Search className="text-zinc-500 mr-3" />
              <input 
                type="text" 
                placeholder="Search TLOS..." 
                className="flex-1 bg-transparent border-none text-white focus:outline-none text-lg"
                autoFocus
              />
              <button onClick={() => setShowSearch(false)} className="text-zinc-500 hover:text-white bg-zinc-800 p-1 rounded transition-colors">
                <X size={20} />
              </button>
            </div>
            <div className="p-6 text-center text-zinc-500 text-sm">
              <p>Type to search the market simulation database...</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
