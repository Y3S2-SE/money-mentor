import { useState, useEffect } from 'react';
import { Star, Award, BarChart2, Watch } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import BadgeShowcase from '../components/gamification/BadgeShowcase';
import Leaderboard from '../components/gamification/Leaderboard';
import RecentAchievements from '../components/gamification/RecentAchievements';
import XPHistory from '../components/gamification/XPHistory';
import useSwipeTabs from '../hooks/useSwipeTabs';
import gamificationSerivce from '../services/gamificationService';

const TABS = [
  { id: 'overview', label: 'Overview', short: 'Overview', icon: BarChart2 },
  { id: 'badges', label: 'Badge Collection', short: 'Badges', icon: Award },
  { id: 'xphistory', label: 'XP History', short: 'History', icon: Watch },
];

const StatCard = ({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
  <div className="group relative overflow-hidden bg-slate-900/95 rounded-2xl border border-white/5 p-4 sm:p-5 flex items-start gap-3 sm:gap-4 transition-all duration-300">
    
    {/* Responsive Decorative Rings */}
    <div className="absolute -right-8 -bottom-8 w-20 h-20 sm:-right-10 sm:-bottom-10 sm:w-32 sm:h-32 border-10 sm:border-16 border-blue-500/5 rounded-full transition-transform duration-700 pointer-events-none group-hover:scale-110 group-hover:border-blue-500/10" />
    <div className="absolute -right-2 -bottom-2 w-14 h-14 sm:-right-4 sm:-bottom-4 sm:w-20 sm:h-20 border-[6px] sm:border-12 border-blue-400/10 rounded-full transition-transform duration-500 pointer-events-none group-hover:scale-125" />
    
    {/* Neon Top Accent */}
    <div className="absolute top-0 left-0 w-full h-0.5 bg-linear-to-r from-blue-500 via-blue-400 to-transparent opacity-50 group-hover:opacity-100 transition-opacity" />

    <div className={`relative z-10 w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 shadow-lg ${iconBg} ring-1 ring-white/10 transition-transform group-hover:scale-110`}>
      <Icon strokeWidth={2.5} className={`w-4 h-4 sm:w-6 sm:h-6 ${iconColor}`} />
    </div>
    
    <div className="relative z-10 min-w-0 flex-1">
      <p className="font-label text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-0.5 sm:mb-1 truncate">{label}</p>
      <p className="font-headline text-xl sm:text-3xl font-black text-white tracking-tight leading-none mb-1 drop-shadow-[0_2px_8px_rgba(255,255,255,0.2)]">{value}</p>
      {sub && <p className="font-body text-[10px] sm:text-xs text-slate-400/80 font-medium italic">{sub}</p>}
    </div>
  </div>
);

const LevelProgressCard = ({ profile }) => {
  if (!profile) return (
    <div className="bg-primary rounded-2xl p-6 animate-pulse h-36" />
  );

  const { level, levelTitle, totalXP, levelProgress } = profile;
  const { earned, needed, percentage } = levelProgress || { earned: 0, needed: 100, percentage: 0 };

  return (
    <div className="bg-primary rounded-2xl p-6 text-on-primary relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[80px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/3 rounded-tr-[60px] pointer-events-none" />

      <div className="relative z-10 flex items-start justify-between mb-4">
        <div>
          <p className="font-label text-[10px] font-bold tracking-[0.2em] text-inverse-primary uppercase mb-1">Current Level</p>
          <h2 className="font-headline text-gradient text-4xl font-bold tracking-tight">{level}</h2>
          <p className="font-body text-inverse-primary text-sm font-medium mt-0.5">{levelTitle}</p>
        </div>
        <div className="text-right">
          <p className="font-label text-[10px] text-inverse-primary/70 uppercase tracking-widest mb-1">Total XP</p>
          <p className="font-headline text-2xl font-bold">{totalXP?.toLocaleString()}</p>
        </div>
      </div>

      <div className="relative z-10">
        <div className="flex justify-between items-center mb-1.5">
          <span className="font-body text-[10px] text-inverse-primary/70 font-medium">{earned} / {needed} XP</span>
          <span className="font-body text-[10px] font-bold text-inverse-primary">{percentage}%</span>
        </div>
        <div className="w-full bg-black/30 h-2 rounded-full overflow-hidden">
          <div
            className="h-full bg-surface-tint rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="font-body text-[10px] text-inverse-primary/60 mt-1.5">{needed - earned} XP to Level {level + 1}</p>
      </div>
    </div>
  );
};

const StreakCard = ({ profile }) => {
  if (!profile) return <div className="bg-slate-900/95 rounded-2xl border border-white/5 h-24 animate-pulse" />;

  const { currentStreak, longestStreak, lastActivityDate } = profile;
  const isActiveToday = lastActivityDate &&
    new Date(lastActivityDate).toDateString() === new Date().toDateString();

  // --- LOGIC CHANGE START ---
  const milestoneTarget = 30;
  const daysLeft = Math.max(0, milestoneTarget - currentStreak);
  // Calculate progress specifically toward the 30-day goal
  const milestoneProgress = (currentStreak / milestoneTarget) * 100;
  // --- LOGIC CHANGE END ---

  return (
    <div className="group relative overflow-hidden bg-slate-900/95 rounded-2xl border border-white/5 p-4 sm:p-5 transition-all duration-300">
      
      {/* Neon Energy Orb - Scaled for Mobile */}
      <div className="absolute -top-12 -right-12 w-24 h-24 sm:-top-16 sm:-right-16 sm:w-40 sm:h-40 bg-blue-500/10 rounded-full blur-2xl sm:blur-3xl animate-[pulse_4s_ease-in-out_infinite] pointer-events-none" />
      
      {/* Geometric Corner Accent */}
      <div className="absolute bottom-0 right-0 w-20 h-20 sm:w-24 sm:h-24 bg-linear-to-tl from-blue-500/10 to-transparent rounded-tl-full pointer-events-none group-hover:scale-110 transition-transform" />

      <div className="relative z-10 flex items-center justify-between mb-3 sm:mb-4">
        <p className="font-label text-[8px] sm:text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 flex items-center gap-1 sm:gap-1.5">
          Daily Streak
          {isActiveToday && (
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 sm:h-2 sm:w-2 bg-blue-300 shadow-[0_0_12px_rgba(103,232,249,0.8)]"></span>
            </span>
          )}
        </p>
        <div className="bg-white/5 px-1.5 py-0.5 sm:px-2 rounded-full border border-white/10">
          <span className="font-label text-[7px] sm:text-[9px] text-slate-500 uppercase font-bold mr-1">Best</span>
          <span className="font-headline text-xs sm:text-base font-black text-slate-200">{longestStreak}</span>
        </div>
      </div>
      
      <div className="relative z-10 flex flex-col gap-0.5 sm:gap-1">
        <div className="flex items-baseline gap-1 sm:gap-1.5">
          <span className="font-headline text-3xl sm:text-4xl font-black bg-linear-to-br from-white via-white to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            {currentStreak}
          </span>
          <span className="font-body text-slate-400 text-[10px] sm:text-sm font-black uppercase tracking-widest">days</span>
        </div>
        <p className={`font-body text-[9px] sm:text-[11px] font-bold ${isActiveToday ? 'text-blue-400' : 'text-slate-500'}`}>
          {isActiveToday ? '🔥 STREAK ACTIVE' : 'LOG IN TO CONTINUE'}
        </p>
      </div>

      {/* --- UPDATED PROGRESS BAR --- */}
      <div className="relative z-10 mt-3 sm:mt-4">
        <div className="flex justify-between items-center mb-1 px-0.5">
          <span className="text-[7px] sm:text-[8px] font-black text-slate-500 uppercase tracking-widest">Milestone Progress</span>
          <span className="text-[7px] sm:text-[8px] font-black text-blue-400 uppercase">
            {daysLeft > 0 ? `${daysLeft}d left` : '30d Goal Met!'}
          </span>
        </div>
        <div className="relative w-full h-1 sm:h-1.5 bg-black/40 rounded-full overflow-hidden ring-1 ring-white/5">
          <div
            className="h-full bg-linear-to-r from-blue-600 via-blue-400 to-white rounded-full transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(34,211,238,0.5)]"
            style={{ width: `${Math.min(100, milestoneProgress)}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const PlayPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const TAB_KEYS = TABS.map(t => t.id);

  const { handleTouchStart, handleTouchEnd } = useSwipeTabs(TAB_KEYS, activeTab, setActiveTab);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await gamificationSerivce.getProfile();
        setProfile(res.data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  const badgeCount = profile?.earnedBadges?.length ?? 0;

  return (
    <Sidebar>
      <div className="flex flex-col h-full bg-surface-bright pb-4 pt-8 px-4">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 px-2">
            <div>
              <h1 className="text-xl font-headline font-bold text-on-surface">Play & Level Up</h1>
              <p className="text-xs font-body text-on-surface-variant mt-0.5">Track your progress, earn badges, and climb the ranks</p>
            </div>
            {!loading && profile && (
              <div className="flex items-center gap-2 bg-primary-fixed border border-primary-fixed-dim rounded-xl px-4 py-2">
                <Star strokeWidth={2} className="w-4 h-4 text-on-primary-fixed fill-on-primary-fixed" />
                <span className="text-sm font-label font-bold text-on-primary-fixed">{profile.totalXP?.toLocaleString()} XP</span>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex gap-6 border-b border-outline-variant/30 px-2 overflow-x-auto scrollbar-none whitespace-nowrap scroll-smooth snap-x snap-mandatory">
            {TABS.map(({ id, label, short, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-3 px-2 font-label tracking-widest uppercase text-[11px] font-bold 
                  transition-all relative flex items-center gap-2 shrink-0 snap-start ${activeTab === id
                    ? 'text-blue-900'
                    : 'text-on-surface-variant hover:text-on-surface'
                  }`}
              >
                <Icon strokeWidth={2} className="w-4 h-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>

                {activeTab === id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-900 rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-0 sm:px-2"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div key={activeTab} style={{ animation: 'tabSlideIn 0.25s cubic-bezier(0.4, 0, 0.2, 1) both' }}>
            {/* OVERVIEW TAB */}
            {activeTab === 'overview' && (
              <div className="space-y-3 pb-6">
                {/* Top row: level card + streak + stat cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                  <div className="sm:col-span-2 xl:col-span-2">
                    <LevelProgressCard profile={profile} />
                  </div>
                  <div className="col-span-1 sm:col-span-2 xl:col-span-2 grid grid-cols-2 gap-4">
                    <StreakCard profile={profile} />
                    <StatCard
                      label="Badges Earned"
                      value={loading ? '—' : badgeCount}
                      sub="achievements unlocked"
                      icon={Award}
                      iconColor="text-tertiary-container"
                      iconBg="bg-tertiary-fixed"
                    />
                  </div>
                </div>

                {/* Two-column layout */}
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                  <div className="lg:col-span-2">
                    <RecentAchievements onViewAll={() => setActiveTab('badges')} />
                  </div>
                  <div>
                    <Leaderboard compact />
                  </div>
                </div>

              </div>
            )}

            {/* BADGES TAB */}
            {activeTab === 'badges' && (
              <div className="pb-6">
                <BadgeShowcase />
              </div>
            )}

            {/* LEADERBOARD TAB */}
            {activeTab === 'xphistory' && (
              <div className="max-w-2xl pb-6">
                <XPHistory full />
              </div>
            )}
          </div>
        </div>
      </div>
    </Sidebar>
  );
};

export default PlayPage;