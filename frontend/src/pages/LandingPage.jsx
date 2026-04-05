import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { CustomEase } from 'gsap/CustomEase';
import { TextPlugin } from 'gsap/TextPlugin';
import MagneticCursor from '../components/MagneticCursor';
import PublicNavbar from '../components/PublicNavbar';

gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase, TextPlugin);

// ── Registered eases (module-level, once) ─────────────────────────────────────
CustomEase.create('jarvisSnap', 'M0,0 C0.22,0 0.08,1 1,1');
CustomEase.create('gentleOut', 'M0,0 C0.16,1 0.3,1 1,1');

const LandingPage = () => {
  const containerRef = useRef(null);
  const heroHeadlineRef = useRef(null);
  const heroSectionRef = useRef(null);
  const bgImgRef = useRef(null);
  const statsRef = useRef(null);

  // ── 1. MAGNETIC CURSOR — handled by <MagneticCursor /> component ─────────

  // ── 2. ALL SCROLL + REVEAL ANIMATIONS ─────────────────────────────────────
  useEffect(() => {
    gsap.ticker.lagSmoothing(1000, 16);
    const ctx = gsap.context(() => { }, containerRef);

    // ── 2a. HERO PARALLAX — ScrollTrigger scrub ─────────────────────────────
    // scrub physically binds animation progress to scroll position.
    // scrub: 1.2 adds inertial lag so it feels weighted, not snappy.
    ctx.add(() => {
      gsap.to(bgImgRef.current, {
        yPercent: 22,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: 'top top',
          end: 'bottom top',
          scrub: 1.2,
        },
      });

      // Overlay darkens as you scroll away — scrubbed opacity
      gsap.to('.hero-bg-overlay', {
        opacity: 0.85,
        ease: 'none',
        scrollTrigger: {
          trigger: heroSectionRef.current,
          start: 'top top',
          end: '60% top',
          scrub: true,
        },
      });
    });

    // ── 2b. HERO SPLITTEXT + TYPEWRITER ─────────────────────────────────────
    // TextPlugin types characters one-by-one on GSAP's precise timeline.
    // Framer needs a useState counter + setInterval — no timeline sync.
    document.fonts.ready.then(() => {
      ctx.add(() => {
        SplitText.create(heroHeadlineRef.current, {
          type: 'chars, words',
          mask: 'chars',
          charsClass: 'hero-char',
          autoSplit: true,
          onSplit(self) {
            const tl = gsap.timeline({
              defaults: { force3D: true, overwrite: 'auto' },
            });

            tl.addLabel('textReveal')
              .fromTo(
                self.chars,
                { yPercent: 115, rotation: 6, opacity: 0, filter: 'blur(4px)' },
                {
                  yPercent: 0,
                  rotation: 0,
                  opacity: 1,
                  filter: 'blur(0px)',
                  duration: 1.0,
                  stagger: { each: 0.022, ease: 'power1.inOut' },
                  ease: 'jarvisSnap',
                  immediateRender: false,
                  onStart() {
                    gsap.set(self.chars, { willChange: 'transform, opacity' });
                  },
                  onComplete() {
                    gsap.set(self.chars, { clearProps: 'willChange' });
                  },
                },
                'textReveal'
              )
              // Typewriter on scroll label below the line
              .addLabel('type', 'textReveal+=0.6')
              .fromTo(
                '.scroll-label',
                { opacity: 0 },
                { opacity: 1, duration: 0.01 },
                'type'
              )
              // CTA reveal
              .addLabel('ctaReveal', 'type+=0.5')
              .fromTo(
                '.hero-cta-wrap',
                { yPercent: 30, opacity: 0 },
                {
                  yPercent: 0,
                  opacity: 1,
                  duration: 0.9,
                  ease: 'back.out(1.4)',
                  clearProps: 'all',
                },
                'ctaReveal'
              )
              // Scroll hint line draws in
              .fromTo(
                '.scroll-line',
                { scaleY: 0, transformOrigin: 'top center' },
                { scaleY: 1, duration: 0.8, ease: 'power2.out' },
                'ctaReveal+=0.3'
              )
              // Typewriter on scroll label
              .to(
                '.scroll-label',
                {
                  duration: 1.4,
                  text: { value: 'Track. Quest. Level up.', delimiter: '' },
                  ease: 'none',
                },
                'ctaReveal+=0.9'
              );

            return tl;
          },
        });
      });
    });

    // ── 2c. SCRUBBED SECTION HEADINGS ────────────────────────────────────────
    // Slides AND clips as you scroll into view — progress tied to scroll.
    ctx.add(() => {
      gsap.utils.toArray('.scrub-heading').forEach((el) => {
        gsap.fromTo(
          el,
          { x: -60, opacity: 0 },
          {
            x: 0,
            opacity: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top 90%',
              end: 'top 55%',
              scrub: 0.8,
            },
          }
        );
      });
    });

    // ── 2d. FEATURES HEADER ──────────────────────────────────────────────────
    ctx.add(() => {
      gsap.from('.features-header', {
        scrollTrigger: {
          trigger: '.features-section',
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
        y: 60,
        opacity: 0,
        duration: 1.1,
        ease: 'jarvisSnap',
        force3D: true,
        onStart() { gsap.set('.features-header', { willChange: 'transform, opacity' }); },
        onComplete() { gsap.set('.features-header', { clearProps: 'willChange' }); },
      });
    });

    // ── 2e. FEATURE CARDS ────────────────────────────────────────────────────
    ctx.add(() => {
      ScrollTrigger.batch('.feature-card', {
        interval: 0.08,
        batchMax: 3,
        start: 'top 88%',
        end: 'bottom 15%',
        onEnter: (els) => {
          gsap.set(els, { willChange: 'transform, opacity' });
          gsap.fromTo(els,
            { y: 60, opacity: 0 },
            {
              y: 0, opacity: 1, duration: 0.9, stagger: 0.1,
              ease: 'power3.out', force3D: true, overwrite: 'auto',
              onComplete() { gsap.set(els, { clearProps: 'willChange' }); },
            }
          );
        },
        onLeave: (els) => gsap.to(els, { opacity: 0, y: -30, overwrite: 'auto', duration: 0.5 }),
        onEnterBack: (els) => {
          gsap.set(els, { willChange: 'transform, opacity' });
          gsap.fromTo(els,
            { y: -20, opacity: 0 },
            {
              y: 0, opacity: 1, duration: 0.7, stagger: 0.08,
              ease: 'power2.out', force3D: true, overwrite: 'auto',
              onComplete() { gsap.set(els, { clearProps: 'willChange' }); },
            }
          );
        },
        onLeaveBack: (els) => gsap.to(els, { opacity: 0, y: 60, overwrite: 'auto', duration: 0.4 }),
      });
    });

    // ── 2f. BENTO — scrub-driven parallax depth ──────────────────────────────
    // Each card scrolls at a different speed, creating a depth illusion.
    // Framer needs one useTransform per card with manual scroll range math.
    ctx.add(() => {
      const depths = [0, 0.06, 0.12, 0.04, 0.09];
      gsap.utils.toArray('.bento-item').forEach((el, i) => {
        gsap.to(el, {
          yPercent: -(depths[i % depths.length]) * 80,
          ease: 'none',
          scrollTrigger: {
            trigger: '.bento-section',
            start: 'top bottom',
            end: 'bottom top',
            scrub: 1,
          },
        });
      });

      ScrollTrigger.batch('.bento-item', {
        interval: 0.08,
        start: 'top 88%',
        onEnter: (els) => {
          gsap.set(els, { willChange: 'transform, opacity' });
          gsap.fromTo(els,
            { y: 50, scale: 0.94, opacity: 0 },
            {
              y: 0, scale: 1, opacity: 1, duration: 0.85, stagger: 0.13,
              ease: 'power3.out', force3D: true, overwrite: 'auto',
              onComplete() { gsap.set(els, { clearProps: 'willChange' }); },
            }
          );
        },
        onLeave: (els) => gsap.to(els, { opacity: 0, y: -30, scale: 0.96, overwrite: 'auto', duration: 0.4 }),
        onLeaveBack: (els) => gsap.to(els, { opacity: 0, y: 50, scale: 0.94, overwrite: 'auto', duration: 0.4 }),
        onEnterBack: (els) => {
          gsap.set(els, { willChange: 'transform, opacity' });
          gsap.fromTo(els,
            { y: -20, opacity: 0 },
            {
              y: 0, opacity: 1, duration: 0.7, stagger: 0.1,
              ease: 'power2.out', force3D: true, overwrite: 'auto',
              onComplete() { gsap.set(els, { clearProps: 'willChange' }); },
            }
          );
        },
      });
    });

    // ── 2g. STAT COUNTERS — gsap tweens a plain JS object ────────────────────
    // GSAP can tween arbitrary object properties (not just DOM styles).
    // The counter display is driven directly by the tween — no useState,
    // no setInterval, no React reconciliation cost on every tick.
    ctx.add(() => {
      const counters = [
        { el: '.stat-users', end: 12400, suffix: '+' },
        { el: '.stat-saved', end: 8, suffix: 'M' },
        { el: '.stat-quests', end: 340, suffix: '+' },
      ];

      counters.forEach(({ el, end, suffix }) => {
        const target = document.querySelector(el);
        if (!target) return;
        const obj = { val: 0 };
        gsap.to(obj, {
          val: end,
          duration: 2,
          ease: 'power2.out',
          snap: { val: 1 },
          scrollTrigger: {
            trigger: statsRef.current,
            start: 'top 80%',
            once: true,
          },
          onUpdate() {
            target.textContent = Math.round(obj.val).toLocaleString() + suffix;
          },
        });
      });
    });

    // ── 2h. JOIN SECTION ─────────────────────────────────────────────────────
    ctx.add(() => {
      gsap.from('.join-elem', {
        scrollTrigger: {
          trigger: '.join-section',
          start: 'top 82%',
          toggleActions: 'play none none reverse',
        },
        y: 40, opacity: 0, duration: 0.8,
        stagger: { each: 0.12, ease: 'power1.in' },
        ease: 'power3.out', force3D: true,
        onStart() { gsap.set('.join-elem', { willChange: 'transform, opacity' }); },
        onComplete() { gsap.set('.join-elem', { clearProps: 'willChange' }); },
      });
    });

    return () => ctx.revert();
  }, []);


  return (
    <div
      ref={containerRef}
      className="bg-background font-body text-on-background selection:bg-primary-fixed selection:text-on-primary-fixed min-h-screen"
      style={{ cursor: 'none' }}
    >

      {/* ── CUSTOM MAGNETIC CURSOR ─────────────────────────────────────────── */}
      <MagneticCursor />

      {/* ── NAVBAR ─────────────────────────────────────────────────────────── */}
      <PublicNavbar />

      <main>
        {/* ── HERO ───────────────────────────────────────────────────────────── */}
        <section
          ref={heroSectionRef}
          className="relative h-screen w-full flex flex-col items-center justify-center bg-primary overflow-hidden"
        >
          <div className="absolute inset-0 z-0">
            <img
              ref={bgImgRef}
              alt="Modern architectural abstraction"
              className="w-full h-full object-cover object-center opacity-40 grayscale scale-110"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCsmFFoLNx6fRXaTxwTBZt9njBfim9eQJCcY5-q-o-rJJ23nnbtL4f7L5dP4zXJbYi0wZpEdD1Yma1eeCxT2gvy8cwwGWAnMS6M4xmrnjS4uJ5n_RI-o11U98YoZvFh_iPJTEgr-_ZdAe2kOT_6OWsH4Gb-GxzZHxB3f4cnLy6eLI81pzOJVyZyJucaeyuppYOMEyG1INhZyT12X-jfW9ZvNCTJdbVTabHsTpDPv9ekEf7Gm8O78LoloqB-nMkGv6KSe0zz11b5zXK4"
            />
            <div
              className="hero-bg-overlay absolute inset-0"
              style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.55) 100%)', opacity: 0 }}
            />
            <div className="absolute inset-0 hero-glow" />
          </div>

          <div className="relative z-10 text-center px-6 max-w-6xl mx-auto">
            <h1
              ref={heroHeadlineRef}
              className="text-6xl md:text-8xl lg:text-[9rem] font-headline font-bold tracking-tighter mt-16 mb-12 leading-[0.9] text-white [font-kerning:none] [text-rendering:optimizeSpeed]"
            >
              Level Up Your Savings.
            </h1>

            {/*
              FIX: solid white bg button — always visible regardless of hero image.
              opacity: 0 on mount so GSAP fromTo can take ownership cleanly.
            */}
            <div className="hero-cta-wrap flex flex-col items-center" style={{ opacity: 0 }}>
              <Link
                to="/auth"
                state={{ isLogin: false }}
                className="inline-block px-14 py-5 bg-white text-primary rounded-full font-label tracking-[0.18em] text-[12px] uppercase font-bold hover:bg-blue-50 transition-colors shadow-2xl hover:shadow-white/20 hover:scale-[1.03] active:scale-[0.97]"
              >
                Start Saving
              </Link>

              <div className="mt-12 flex flex-col items-center gap-4 opacity-50">
                <div
                  className="scroll-line w-px h-8 bg-white origin-top mb-8"
                  style={{ transform: 'scaleY(0)' }}
                />
                {/* Typewriter target below the line — empty on mount, TextPlugin fills it */}
                <span
                  className="scroll-label font-label text-[9px] uppercase tracking-[0.4em] text-white min-w-48 text-center"
                  style={{ opacity: 0 }}
                />
              </div>
            </div>
          </div>
        </section>

        {/* ── STATS STRIP ─────────────────────────────────────────────────────── */}
        <section ref={statsRef} className="bg-primary py-14 px-6 md:px-16 border-t border-white/10">
          <div className="max-w-480 mx-auto grid grid-cols-3 gap-8 text-center">
            {[
              { cls: 'stat-users', label: 'Active Users', init: '0+' },
              { cls: 'stat-saved', label: 'Rupees Saved', init: '0M' },
              { cls: 'stat-quests', label: 'Quests Completed', init: '0+' },
            ].map(({ cls, label, init }) => (
              <div key={cls} className="flex flex-col gap-2">
                <span className={`${cls} text-4xl md:text-5xl font-headline font-bold text-white tracking-tighter`}>{init}</span>
                <span className="font-label text-[9px] uppercase tracking-[0.3em] text-blue-100/50">{label}</span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FEATURES SECTION ────────────────────────────────────────────────── */}
        <section className="features-section py-20 md:py-24 px-6 md:px-16 bg-surface-bright" id="features">
          <div className="max-w-480 mx-auto">
            <div className="features-header grid grid-cols-1 lg:grid-cols-12 gap-24 mb-32 items-end">
              <div className="lg:col-span-8">
                <h2 className="scrub-heading text-[10px] uppercase tracking-[0.4em] text-outline font-bold mb-10">Features</h2>
                <h3 className="scrub-heading text-4xl md:text-6xl font-headline font-bold tracking-tighter text-on-surface leading-[1.1]">
                  Built for learning, saving, <br className="hidden md:block" /> and growing your wealth.
                </h3>
              </div>
              <div className="lg:col-span-4 pb-4">
                <p className="text-on-surface-variant text-lg leading-relaxed font-light">
                  Our gamified platform makes financial literacy fun. Complete quests, track your savings, and unlock rewards as you build a secure future.
                </p>
              </div>
            </div>

            <div className="features-grid grid grid-cols-1 md:grid-cols-3 gap-12 mt-16">
              {[
                { icon: 'monitoring', title: 'Smart Tracking', body: 'Track your daily expenses and income in real-time. Understand exactly where your money goes with visual, easy-to-read insights.' },
                { icon: 'sports_esports', title: 'Savings Quests', body: 'Turn your saving goals into engaging quests! Reach milestones, earn experience points (XP), and unlock cool achievements.' },
                { icon: 'school', title: 'Level Up & Learn', body: 'Access bite-sized financial literacy lessons. Build your knowledge base and apply it to real-world scenarios securely.' },
              ].map(({ icon, title, body }) => (
                <div key={title} className="feature-card group py-12 border-t border-outline-variant/30 hover:border-primary transition-colors duration-700">
                  <div className="mb-12 w-12 h-12 flex items-center justify-center text-primary">
                    <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
                  </div>
                  <h4 className="text-2xl font-headline font-bold mb-6 text-on-surface">{title}</h4>
                  <p className="text-on-surface-variant leading-relaxed font-light">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BENTO — scrub parallax depth ────────────────────────────────────── */}
        <section className="bento-section py-20 px-6 md:px-16 bg-surface-dim">
          <div className="max-w-480 mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 grid-rows-2 gap-8 h-auto md:h-150">
              <div className="bento-item md:col-span-2 md:row-span-2 bg-primary overflow-hidden rounded-xl relative group">
                <img
                  alt="Architectural skyscraper reflecting light"
                  className="w-full h-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-700"
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBlcAN3flZpoUbpZ006ieRJpwClCupQF_slSn5IZZmXZZzvU4CvRMazdvtCO7cueKNtRWPW7YouYjRVtyM3pNTMIfzS_eO7NKFp1rx3mI-q6KOyM-7OPki7EA62VhdcjGRrQ_hPGLCWqO25jtkOFqZ_kLyUiyka_Aj9wefVoLx0vAN50nRyIbzoZlGOj-1Srf9HM0ECShbsaT-e6ljKnVqIMNjhayxNGOde48jwgFa92_QgJHWmHyOkNf5aCDbeyGQgqJ4xUqO5sGX4"
                />
                <div className="absolute inset-0 bg-linear-to-t from-primary via-transparent to-transparent p-12 flex flex-col justify-end">
                  <p className="text-blue-400 font-label text-xs uppercase tracking-widest mb-4">Core Philosophy</p>
                  <h4 className="text-3xl font-headline font-bold text-white mb-4">Safe & Secure</h4>
                  <p className="text-blue-100/60 max-w-sm">Your data is protected with enterprise-level security while you focus on building your financial future.</p>
                </div>
              </div>

              <div className="bento-item md:col-span-2 bg-surface-container-lowest p-12 flex flex-col justify-center rounded-xl">
                <h4 className="text-4xl font-headline font-bold tracking-tight text-on-surface mb-6">+850 XP</h4>
                <p className="text-on-surface-variant text-lg">Earn Experience Points for every rupee you save and every financial lesson you complete.</p>
              </div>

              <div className="bento-item bg-surface-container-highest p-12 rounded-xl flex flex-col justify-between">
                <div>
                  <span className="material-symbols-outlined text-primary text-4xl mb-6 block">lightbulb</span>
                  <h4 className="text-2xl font-headline font-bold text-on-surface mb-4">Pro Tips</h4>
                  <p className="text-on-surface-variant text-sm">Unlock exclusive financial strategies and secret hacks to maximize your daily savings and reach goals faster.</p>
                </div>
              </div>

              <div className="bento-item bg-primary-container p-12 rounded-xl flex flex-col justify-between text-blue-50">
                <div>
                  <span className="material-symbols-outlined text-blue-400 text-4xl mb-6 block">groups</span>
                  <h4 className="text-2xl font-headline font-bold mb-2">Community Hub</h4>
                  <p className="text-blue-100/60 text-sm">Compete on leaderboards, share success stories, and get inspired!</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── JOIN SECTION ────────────────────────────────────────────────────── */}
        <section className="join-section py-24 md:py-32 px-6 md:px-16 bg-surface-bright border-t border-outline-variant/10">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="join-elem scrub-heading text-[10px] uppercase tracking-[0.4em] text-outline font-bold mb-10">Join Now</h2>
            <h3 className="join-elem text-5xl md:text-7xl font-headline font-bold tracking-tighter text-on-surface mb-12">Start Saving Today</h3>
            <p className="join-elem text-on-surface-variant text-xl mb-16 max-w-2xl mx-auto font-light leading-relaxed">
              Sign up now to start your gamified savings journey. Track your progress, learn about money, and secure your future.
            </p>
            <div className="join-elem text-center">
              <Link
                to="/auth"
                state={{ isLogin: false }}
                className="inline-block px-16 py-6 bg-primary text-on-primary rounded-full font-label tracking-[0.2em] text-[12px] uppercase font-bold hover:bg-primary-container transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-white py-12 px-8 md:px-16 border-t border-outline-variant/10">
        <div className="flex flex-col md:flex-row justify-between items-end w-full max-w-480 mx-auto">
          <div className="flex flex-col gap-4 mb-8 md:mb-0">
            <div className="text-xl font-bold text-primary font-headline tracking-tighter">MoneyMentor</div>
            <p className="font-label text-[10px] uppercase tracking-widest text-outline">© 2024 MoneyMentor. Gamified Savings Coach.</p>
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

export default LandingPage;