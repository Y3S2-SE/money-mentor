import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import MagneticCursor from '../components/MagneticCursor';
import PublicNavbar from '../components/PublicNavbar';

gsap.registerPlugin(ScrollTrigger);

const faqs = [
  {
    q: 'Is MoneyMentor free to use?',
    a: 'Yes — creating an account and accessing the core features is completely free. Start tracking your finances, learning through courses, and earning XP at no cost.',
  },
  {
    q: 'How does the AI advisor work?',
    a: 'The AI advisor is powered by Google Gemini. It acts as a personal finance specialist called MoneyMentor, staying on-topic and formatting responses in clear, readable text. Conversation history is preserved, and only the last 10 messages are sent to the model to conserve quota.',
  },
  {
    q: 'Can I change my currency?',
    a: 'The platform uses LKR as the primary currency but supports real-time conversion for transactions recorded in other currencies using the Fawazahmed0 Exchange API.',
  },
  {
    q: 'How do I earn XP and badges?',
    a: 'You earn XP by completing courses, logging in daily, maintaining streaks, and reaching savings milestones. Badges are awarded automatically when you meet the criteria for each badge — check the Gamification section in your dashboard to see your progress.',
  },
  {
    q: 'Are my financial data and conversations private?',
    a: 'All ownership checks are enforced server-side. Users can only read, update, or delete their own transactions, conversations, and group memberships. No other user can access your data.',
  },
  {
    q: 'Can I retake a course to earn more points?',
    a: 'No — each course can only be completed once per account. This prevents point farming and keeps the leaderboard fair. You will still be able to revisit the course content for learning purposes.',
  },
];

const contacts = [
  { icon: 'email', label: 'Email', value: 'support@moneymentor.app', href: 'mailto:support@moneymentor.app' },
  { icon: 'chat', label: 'Live Chat', value: 'Available in-app after sign-in', href: '/auth' },
  { icon: 'location_on', label: 'Location', value: 'Colombo, Sri Lanka', href: null },
];

const ContactPage = () => {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo('.contact-hero-title',
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.1, ease: 'power3.out', delay: 0.2 }
      );
      gsap.fromTo('.contact-hero-sub',
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.9, ease: 'power3.out', delay: 0.55 }
      );
      gsap.fromTo('.contact-card',
        { y: 40, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.8, stagger: 0.12, ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-cards', start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
      gsap.fromTo('.faq-item',
        { y: 30, opacity: 0 },
        {
          y: 0, opacity: 1, duration: 0.7, stagger: 0.08, ease: 'power2.out',
          scrollTrigger: { trigger: '.faq-section', start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
      gsap.fromTo('.contact-form-wrap',
        { x: 40, opacity: 0 },
        {
          x: 0, opacity: 1, duration: 0.9, ease: 'power3.out',
          scrollTrigger: { trigger: '.contact-form-wrap', start: 'top 85%', toggleActions: 'play none none none' }
        }
      );
    }, containerRef);
    return () => ctx.revert();
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simulate form submission
    setSubmitted(true);
  };

  const inputCls = 'w-full bg-surface-container-lowest border border-outline-variant/40 rounded-xl px-5 py-4 text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:border-primary/60 focus:ring-2 focus:ring-primary/20 transition-all font-body text-sm';

  return (
    <div ref={containerRef} className="min-h-screen bg-surface-bright font-body text-on-surface" style={{ cursor: 'none' }}>
      <MagneticCursor />
      <PublicNavbar />

      {/* Hero */}
      <section className="bg-primary pt-40 pb-24 px-6 md:px-16 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 30% 60%, #85D5A5 0%, transparent 60%)' }} />
        <div className="max-w-3xl mx-auto relative z-10">
          <p className="font-label text-[10px] uppercase tracking-[0.4em] text-blue-300/70 mb-6">Get in touch</p>
          <h1 className="contact-hero-title text-5xl md:text-7xl font-headline font-bold tracking-tighter leading-[0.95] mb-8">
            We'd love to hear from you.
          </h1>
          <p className="contact-hero-sub text-blue-100/60 text-lg md:text-xl max-w-xl leading-relaxed font-light">
            Have a question, feedback, or a feature idea? Reach out and a team member will get back to you shortly.
          </p>
        </div>
      </section>

      {/* Contact cards */}
      <section className="contact-cards py-16 px-6 md:px-16 border-b border-outline-variant/10">
        <div className="max-w-300 mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          {contacts.map(({ icon, label, value, href }) => (
            <div key={label} className="contact-card flex flex-col gap-5 p-8 rounded-2xl bg-surface-container-lowest border border-outline-variant/20 hover:border-primary/30 transition-all duration-300 group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
              </div>
              <div>
                <p className="font-label text-[9px] uppercase tracking-[0.3em] text-on-surface-variant mb-2">{label}</p>
                {href
                  ? <a href={href} className="text-on-surface font-semibold hover:text-primary transition-colors">{value}</a>
                  : <span className="text-on-surface font-semibold">{value}</span>
                }
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Form + FAQ */}
      <section className="py-24 px-6 md:px-16">
        <div className="max-w-300 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-20">

          {/* Contact form */}
          <div className="contact-form-wrap">
            <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface mb-3">Send a message</h2>
            <p className="text-on-surface-variant text-sm mb-10 font-light leading-relaxed">Fill in the form and we'll get back to you within 48 hours.</p>

            {submitted ? (
              <div className="rounded-2xl bg-primary/10 border border-primary/20 p-10 text-center flex flex-col items-center gap-4">
                <span className="material-symbols-outlined text-5xl text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                <h3 className="text-xl font-headline font-bold text-on-surface">Message received!</h3>
                <p className="text-on-surface-variant text-sm font-light">Thanks for reaching out. We'll respond to <strong>{form.email}</strong> within 48 hours.</p>
                <button
                  onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                  className="mt-4 px-8 py-3 bg-primary text-on-primary rounded-full font-label tracking-[0.15em] text-[11px] uppercase font-bold hover:bg-primary/90 transition-all"
                >Send another</button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <input
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className={inputCls}
                  />
                  <input
                    required
                    type="email"
                    placeholder="Email address"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <input
                  required
                  placeholder="Subject"
                  value={form.subject}
                  onChange={(e) => setForm({ ...form, subject: e.target.value })}
                  className={inputCls}
                />
                <textarea
                  required
                  rows={6}
                  placeholder="Tell us how we can help…"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  className={`${inputCls} resize-none`}
                />
                <button
                  type="submit"
                  className="self-start px-12 py-4 bg-primary text-on-primary rounded-full font-label tracking-[0.18em] text-[12px] uppercase font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>

          {/* FAQ */}
          <div className="faq-section">
            <h2 className="text-3xl font-headline font-bold tracking-tight text-on-surface mb-3">Frequently asked</h2>
            <p className="text-on-surface-variant text-sm mb-10 font-light leading-relaxed">Quick answers to the most common questions.</p>
            <div className="flex flex-col divide-y divide-outline-variant/20">
              {faqs.map(({ q, a }, i) => (
                <div key={i} className="faq-item py-5">
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-start justify-between gap-4 text-left group outline-none"
                  >
                    <span className={`font-semibold text-sm leading-relaxed transition-colors ${openFaq === i ? 'text-primary' : 'text-on-surface group-hover:text-primary'}`}>{q}</span>
                    <span className={`material-symbols-outlined text-xl shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-45 text-primary' : 'text-on-surface-variant'}`}>add</span>
                  </button>
                  <div
                    className="overflow-hidden transition-all duration-300"
                    style={{ maxHeight: openFaq === i ? '300px' : '0px', opacity: openFaq === i ? 1 : 0 }}
                  >
                    <p className="pt-4 text-on-surface-variant text-sm leading-relaxed font-light">{a}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

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

export default ContactPage;
