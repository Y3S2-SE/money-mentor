import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

/**
 * Shared top navbar — matches LandingPage exactly.
 * Hides on scroll-down, reappears on scroll-up.
 * Becomes frosted glass when scrolled past 50px.
 * No active-page highlight; all links render the same.
 */
const PublicNavbar = () => {
  const [isVisible,  setIsVisible]  = useState(true);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    let lastScrollY = window.scrollY;
    const handleScroll = () => {
      const cur = window.scrollY;
      setIsVisible(cur < lastScrollY || cur < 50);
      setIsScrolled(cur > 50);
      lastScrollY = cur;
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      } ${
        isScrolled
          ? 'bg-primary/90 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className={`flex justify-between items-center px-8 md:px-16 w-full max-w-[1920px] mx-auto transition-all duration-300 ${isScrolled ? 'py-4' : 'py-8'}`}>
        <Link to="/" className="text-xl font-bold tracking-tighter text-emerald-50 font-headline">
          MoneyMentor
        </Link>
        <div className="hidden lg:flex gap-12 items-center">
          <Link to="/" className="text-emerald-100/40 hover:text-emerald-100 transition-colors font-label tracking-[0.2em] text-[10px] uppercase font-semibold">Home</Link>
          <Link to="/features" className="text-emerald-100/40 hover:text-emerald-100 transition-colors font-label tracking-[0.2em] text-[10px] uppercase font-semibold">Features</Link>
          <Link to="/contact" className="text-emerald-100/40 hover:text-emerald-100 transition-colors font-label tracking-[0.2em] text-[10px] uppercase font-semibold">Contact</Link>
        </div>
        <div className="flex items-center gap-8">
          <Link to="/auth" className="text-emerald-100/40 hover:text-emerald-100 transition-colors font-label tracking-[0.2em] text-[10px] uppercase font-semibold hidden sm:block">Sign In</Link>
          <Link to="/auth" state={{ isLogin: false }} className="bg-white text-primary px-8 py-3 rounded-full font-label tracking-[0.1em] font-bold text-[11px] uppercase hover:bg-emerald-50 transition-all">Get Started</Link>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
