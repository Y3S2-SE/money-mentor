// src/pages/PlayPage.jsx
import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Trophy, Flame, Star, TrendingUp, Award, BarChart2, ChevronRight, Watch } from 'lucide-react';
import Sidebar from '../components/dashboard/Sidebar';
import BadgeShowcase from '../components/gamification/BadgeShowcase';
import Leaderboard from '../components/gamification/Leaderboard';
import RecentAchievements from '../components/gamification/RecentAchievements';
import XPHistory from '../components/gamification/XPHistory';
import api from '../services/api';

const TABS = [
  { id: 'overview', label: 'Overview', icon: BarChart2 },
  { id: 'badges', label: 'Badge Collection', icon: Award },
  { id: 'xphistory', label: 'XP History', icon: Watch },
];

const StatCard = ({ label, value, sub, icon: Icon, iconColor, iconBg }) => (
  <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 flex items-start gap-4 transition-all hover:border-outline-variant/50">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${iconBg}`}>
      <Icon strokeWidth={1.5} className={`w-5 h-5 ${iconColor}`} />
    </div>
    <div className="min-w-0">
      <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant mb-1">{label}</p>
      <p className="font-headline text-2xl font-bold text-on-surface tracking-tight leading-none">{value}</p>
      {sub && <p className="font-body text-xs text-on-surface-variant/70 mt-1">{sub}</p>}
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
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/[0.03] rounded-tr-[60px] pointer-events-none" />

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
  if (!profile) return <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 h-24 animate-pulse" />;

  const { currentStreak, longestStreak, lastActivityDate } = profile;
  const isActiveToday = lastActivityDate &&
    new Date(lastActivityDate).toDateString() === new Date().toDateString();

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-5 transition-all hover:border-outline-variant/50">
      <div className="flex items-center justify-between mb-4">
        <p className="font-label text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">Daily Streak</p>
        <div className={`w-2 h-2 rounded-full ${isActiveToday ? 'bg-green-500' : 'bg-outline-variant'}`} />
      </div>
      <div className="flex items-end gap-3">
        <div>
          <div className="flex items-baseline gap-1">
            <span className="font-headline text-4xl font-bold text-on-surface">{currentStreak}</span>
            <span className="font-body text-on-surface-variant text-sm font-medium">days</span>
          </div>
          <p className="font-body text-xs text-on-surface-variant mt-0.5">
            {isActiveToday ? 'Checked in today' : 'Login to continue'}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-wider">Best</p>
          <p className="font-headline text-xl font-bold text-on-surface-variant/80">{longestStreak}</p>
        </div>
      </div>
    </div>
  );
};

const PlayPage = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/play/profile');
        setProfile(res.data.data);
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
          <div className="flex items-center justify-between mb-6 px-2">
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
          <div className="flex gap-6 border-b border-outline-variant/30 px-2">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`pb-3 px-4 font-label tracking-widest uppercase text-[11px] font-bold transition-all relative flex items-center gap-2 ${
                  activeTab === id
                    ? 'text-blue-900'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                <Icon strokeWidth={2} className="w-4 h-4" />
                {label}
                {activeTab === id && (
                  <div className="absolute bottom-0 left-0 w-full h-[2px] bg-blue-900 rounded-t" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-2">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-3 pb-6">
              {/* Top row: level card + streak + stat cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="xl:col-span-2">
                  <LevelProgressCard profile={profile} />
                </div>
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

              {/* Two-column layout */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
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
    </Sidebar>
  );
};

export default PlayPage;