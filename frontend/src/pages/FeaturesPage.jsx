import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagneticCursor from '../components/MagneticCursor';
import PublicNavbar from '../components/PublicNavbar';

gsap.registerPlugin(ScrollTrigger);

// All cards share the MoneyMentor green/teal palette — two alternating tones
const G1 = { color: 'from-emerald-950 to-emerald-900', accent: '#6EE7B7' }; // bright mint
const G2 = { color: 'from-[#0a2218] to-emerald-950', accent: '#34D399' }; // deeper emerald
const G3 = { color: 'from-teal-950 to-teal-900', accent: '#5EEAD4' }; // teal
const G4 = { color: 'from-[#072018] to-teal-950', accent: '#2DD4BF' }; // teal-deep

const features = [
  {
    id: 'profile', icon: 'manage_accounts', tag: 'Account', title: 'Profile Management', ...G1,
    items: [
      'Update username and email with uniqueness validation',
      'Secure password change with current-password verification',
      'Automatic token refresh after password update so you stay logged in',
    ],
  },
  {
    id: 'tracker', icon: 'account_balance_wallet', tag: 'Finance', title: 'Income & Expense Tracker', ...G2,
    items: [
      'Log income and expense transactions with category, date, and notes',
      'Monthly dashboard: total income, expenses, net savings, and health score',
      'Six-month trend chart and category-level spending breakdown',
      'Personalised monthly savings goal with on-track detection',
      'AI-generated tips based on your real spending patterns via Google Gemini',
      'Real-time currency conversion using the Fawazahmed0 Exchange API (LKR base)',
    ],
  },
  {
    id: 'knowledge', icon: 'school', tag: 'Learning', title: 'Knowledge Hub', ...G3,
    items: [
      'Finance courses with multiple-choice quizzes — 70% pass threshold',
      'Points are earned per correct answer and added to your profile',
      'One-completion-per-user rule prevents point farming',
      'Immediate question-by-question feedback with explanations',
      'Filter courses by category (budgeting, investing, saving, debt, taxes) and difficulty',
    ],
  },
  {
    id: 'chatbot', icon: 'smart_toy', tag: 'AI', title: 'AI Financial Advisor', ...G4,
    items: [
      'Powered by Google Gemini — a personal finance advisor named MoneyMentor',
      'Maintains conversation history: only the last 10 messages are sent to Gemini to save quota',
      'Full history always preserved in the database',
      'First message auto-generates a conversation title (up to 60 characters)',
      'Generates 3–5 YouTube search keywords after every message for video suggestions',
    ],
  },
  {
    id: 'youtube', icon: 'play_circle', tag: 'Learning', title: 'YouTube Video Suggestions', ...G1,
    items: [
      'Curated finance videos fetched from YouTube based on your chat topics',
      'Deduplicated: the same video never appears twice across multiple keywords',
      'Results cached in MongoDB for 7 days to preserve API quota',
      'Falls back to stale cache on API failure — degrades gracefully',
      'Cache stats returned in every response so you can monitor quota usage',
    ],
  },
  {
    id: 'gamification', icon: 'emoji_events', tag: 'Gamification', title: 'Gamification Engine', ...G2,
    items: [
      'Five XP tiers: Money Newbie → Budget Beginner → Savings Starter → Finance Pro → Ultimate Saver',
      'Daily login streaks with 7-day and 30-day milestone bonuses',
      '12 achievement badges across action, milestone, and streak categories',
      'Global leaderboard ranked by total XP — your own rank always shown',
      'Full XP history log with reason and timestamp for every award',
    ],
  },
  {
    id: 'groups', icon: 'groups', tag: 'Community', title: 'Group & Chat', ...G3,
    items: [
      'Create savings groups with auto-generated invite codes',
      'Real-time chat powered by WebSockets — messages push instantly to all members',
      'Group admin can remove members, update details, and regenerate invite codes',
      'Share badge and level-up achievements directly in group chat',
      'Admins cannot be removed; members can leave at any time',
    ],
  },
  {
    id: 'admin', icon: 'admin_panel_settings', tag: 'Admin', title: 'Admin Tools', ...G4,
    items: [
      'Paginated user list with search and filter support',
      'Look up individual users by ID and delete accounts',
      'Self-deletion blocked — admins cannot accidentally delete their own account',
      'Create, edit, and publish/unpublish finance courses at any time',
      'Draft courses remain hidden from users until explicitly published',
      'Course total points auto-calculated from question point values',
    ],
  },
];

const FeaturesPage = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Hero
      gsap.fromTo('.feat-hero-title',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo('.feat-hero-sub',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.5 }
      );
      gsap.fromTo('.feat-hero-cta',
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out', delay: 0.7 }
      );

      // Right 3D money animation
      gsap.fromTo('.feat-hero-image',
        { scale: 0.8, opacity: 0, rotationY: 20 },
        { scale: 1, opacity: 1, rotationY: 0, duration: 1.2, ease: 'power3.out', delay: 0.4 }
      );

      // Floating animations
      gsap.to('.money-float-main', {
        y: -15, rotation: -4, duration: 4, ease: 'sine.inOut', yoyo: true, repeat: -1
      });
      gsap.to('.money-float-1', {
        y: -20, rotation: 20, duration: 5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 1
      });
      gsap.to('.money-float-2', {
        y: 15, rotation: -25, duration: 4.5, ease: 'sine.inOut', yoyo: true, repeat: -1, delay: 0.5
      });

      // Feature cards
      ScrollTrigger.batch('.feat-card', {
        interval: 0.06,
        start: 'top 88%',
        onEnter: (els) => {
          gsap.fromTo(els,
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.85, stagger: 0.1, ease: 'power3.out', force3D: true }
          );
        },
      });

      // Tag labels slide in
      gsap.utils.toArray('.feat-tag').forEach((el) => {
        gsap.fromTo(el,
          { x: -20, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 90%', toggleActions: 'play none none none' }
          }
        );
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="min-h-screen bg-surface-bright font-body text-on-surface" style={{ cursor: 'none' }}>
      <MagneticCursor />
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-primary pt-32 pb-16 px-6 md:px-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, #85D5A5 0%, transparent 60%)' }} />
        
        <div className="max-w-7xl mx-auto relative z-10 flex flex-col lg:flex-row items-center gap-12">
          {/* Left Text */}
          <div className="w-full lg:w-1/2">
            <p className="feat-hero-tag font-label text-[10px] uppercase tracking-[0.4em] text-emerald-300/70 mb-6">
              Everything you need
            </p>
            <h1 className="feat-hero-title text-5xl md:text-6xl lg:text-7xl font-headline font-bold tracking-tighter leading-[0.95] mb-6">
              A platform built for your financial journey.
            </h1>
            <p className="feat-hero-sub text-emerald-100/60 text-base md:text-lg leading-relaxed font-light mb-10 max-w-xl">
              From daily expense tracking and AI-powered advice to gamified learning and real-time community chat — every feature works together to help you build lasting financial habits.
            </p>
            <div className="feat-hero-cta flex flex-wrap gap-4">
              <Link to="/auth" state={{ isLogin: false }}
                className="px-8 py-3 bg-white text-primary rounded-full font-label tracking-[0.15em] text-[11px] uppercase font-bold hover:bg-emerald-50 transition-all shadow-xl">
                Get Started Free
              </Link>
              <Link to="/contact"
                className="px-8 py-3 border border-white/20 text-white rounded-full font-label tracking-[0.15em] text-[11px] uppercase font-bold hover:bg-white/10 transition-all">
                Contact Us
              </Link>
            </div>
          </div>
          
          {/* Right 3D Money Element */}
          <div className="w-full lg:w-1/2 hidden md:flex relative h-[380px] items-center justify-center feat-hero-image transform-gpu" style={{ perspective: '1000px' }}>
            {/* Base glow */}
            <div className="absolute w-56 h-56 bg-emerald-400/20 rounded-full blur-[70px]" />
            
            {/* 3D Coin 1 */}
            <div className="absolute top-4 right-12 xl:right-28 w-20 h-20 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 shadow-[0_12px_25px_rgba(0,0,0,0.4),inset_0_-4px_12px_rgba(0,0,0,0.2),inset_0_4px_12px_rgba(255,255,255,0.4)] flex items-center justify-center border-[3px] border-yellow-200/40 transform rotate-12 money-float-1 z-20">
              <div className="w-12 h-12 rounded-full border-2 border-yellow-200/30 flex items-center justify-center bg-gradient-to-tl from-amber-600/30 to-transparent">
                <span className="text-yellow-100 text-3xl font-bold font-headline drop-shadow-md">$</span>
              </div>
            </div>

            {/* 3D Coin 2 */}
            <div className="absolute bottom-8 left-8 xl:left-20 w-24 h-24 rounded-full bg-gradient-to-br from-amber-300 via-yellow-500 to-amber-600 shadow-[0_15px_30px_rgba(0,0,0,0.4),inset_0_-6px_15px_rgba(0,0,0,0.2),inset_0_6px_15px_rgba(255,255,255,0.4)] flex items-center justify-center border-4 border-yellow-200/40 transform -rotate-12 money-float-2 z-20">
              <div className="w-16 h-16 rounded-full border-2 border-yellow-200/30 flex items-center justify-center bg-gradient-to-tl from-amber-600/30 to-transparent">
                <span className="text-yellow-100 text-4xl font-bold font-headline drop-shadow-lg">$</span>
              </div>
            </div>
            
            {/* Stacked Cards behind main card to add 3D depth */}
            <div className="absolute w-60 h-64 bg-emerald-900/40 rounded-3xl transform rotate-6 translate-x-3 translate-y-3 blur-[2px] border border-white/5" />
            <div className="absolute w-60 h-64 bg-teal-800/40 rounded-3xl transform rotate-2 translate-x-1 translate-y-1 blur-[1px] border border-white/10" />

            {/* Main abstract 3D Card / Wallet */}
            <div className="relative w-60 h-64 bg-gradient-to-br from-emerald-400 via-emerald-600 to-teal-800 rounded-3xl shadow-[0_25px_50px_rgba(0,0,0,0.6),inset_2px_2px_12px_rgba(255,255,255,0.6),inset_-2px_-2px_12px_rgba(0,0,0,0.3)] border border-white/30 transform -rotate-6 money-float-main overflow-hidden backdrop-blur-md z-10 transition-transform duration-700 hover:rotate-0">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl transform translate-x-8 -translate-y-8" />
              <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/20 rounded-full blur-2xl transform -translate-x-8 translate-y-8" />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/5 to-white/20 pointer-events-none" />
              
              <div className="p-6 h-full flex flex-col justify-between relative z-10">
                <div className="flex justify-between items-start">
                  <span className="material-symbols-outlined text-white/70 text-3xl drop-shadow-md">contactless</span>
                  <div className="text-right">
                    <p className="text-white/70 text-[10px] font-label tracking-widest uppercase mb-1 drop-shadow-sm">Balance</p>
                    <p className="text-white text-2xl font-headline font-bold drop-shadow-lg">$12,450</p>
                  </div>
                </div>
                <div>
                  <div className="relative w-12 h-8 rounded-lg bg-gradient-to-br from-yellow-100 via-yellow-300 to-amber-500 mb-5 shadow-md overflow-hidden border border-yellow-100/50">
                     <div className="absolute inset-x-0 h-[1px] top-1/2 bg-yellow-600/30" />
                     <div className="absolute inset-y-0 w-[1px] left-1/3 bg-yellow-600/30" />
                  </div>
                  <p className="text-white/90 font-mono tracking-widest text-xs mb-1 drop-shadow-md">**** **** **** 8842</p>
                  <p className="text-white/70 text-[9px] uppercase tracking-[0.2em] font-label drop-shadow-sm">MoneyMentor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Grid */}
      <section className="py-24 px-6 md:px-16">
        <div className="max-w-[1400px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
            {features.map(({ id, icon, tag, title, color, accent, items }) => (
              <div key={id} className={`feat-card group rounded-2xl overflow-hidden border border-white/5 bg-gradient-to-br ${color} backdrop-blur-sm hover:scale-[1.02] transition-all duration-500 cursor-default`}>
                <div className="p-8 h-full flex flex-col gap-6">
                  {/* Top row */}
                  <div className="flex items-start justify-between">
                    <div
                      className="w-14 h-14 rounded-xl flex items-center justify-center"
                      style={{ background: `${accent}22`, border: `1px solid ${accent}44` }}
                    >
                      <span className="material-symbols-outlined text-3xl" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>
                        {icon}
                      </span>
                    </div>
                    <span className="feat-tag font-label text-[9px] uppercase tracking-[0.3em] px-3 py-1.5 rounded-full border"
                      style={{ color: accent, borderColor: `${accent}44`, background: `${accent}11` }}>
                      {tag}
                    </span>
                  </div>

                  {/* Title */}
                  <h2 className="text-2xl font-headline font-bold text-white tracking-tight">{title}</h2>

                  {/* Items */}
                  <ul className="flex flex-col gap-3 flex-1">
                    {items.map((item) => (
                      <li key={item} className="flex gap-3 items-start">
                        <span className="material-symbols-outlined text-sm mt-0.5 shrink-0" style={{ color: accent, fontVariationSettings: "'FILL' 1" }}>
                          check_circle
                        </span>
                        <span className="text-white/60 text-sm leading-relaxed font-light">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6 md:px-16 bg-primary text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-6xl font-headline font-bold tracking-tighter mb-6">Ready to level up?</h2>
          <p className="text-emerald-100/60 text-lg mb-12 font-light">
            Join thousands of users already saving smarter and building their financial future.
          </p>
          <Link to="/auth" state={{ isLogin: false }}
            className="inline-block px-14 py-5 bg-white text-primary rounded-full font-label tracking-[0.18em] text-[12px] uppercase font-bold hover:bg-emerald-50 transition-colors shadow-2xl hover:scale-[1.03] active:scale-[0.97]">
            Create Free Account
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white py-12 px-8 md:px-16 border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-end w-full max-w-[1920px] mx-auto">
          <div className="flex flex-col gap-4 mb-8 md:mb-0">
            <div className="text-xl font-bold text-primary font-headline tracking-tighter">MoneyMentor</div>
            <p className="font-label text-[10px] uppercase tracking-[0.1em] text-outline">© 2024 MoneyMentor. Gamified Savings Coach.</p>
          </div>
          <div className="flex flex-wrap gap-10 md:gap-16">
            {['Home', 'Features', 'Contact'].map((item) => (
              <Link key={item} to={item === 'Home' ? '/' : `/${item.toLowerCase()}`}
                className="font-label text-[10px] uppercase tracking-[0.2em] text-outline hover:text-primary transition-colors">
                {item}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default FeaturesPage;
