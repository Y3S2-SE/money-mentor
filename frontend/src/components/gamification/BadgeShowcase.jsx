import { useState, useEffect, useRef } from 'react';
import { Filter } from 'lucide-react';
import api from '../../services/api';
import BadgeIcon from './BadgeIcon';

const getRarity = (xp) => xp >= 100 ? 'Legendary' : xp >= 50 ? 'Epic' : xp >= 30 ? 'Rare' : 'Common';

const RARITY_STYLES = {
  Common:    { pill: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30' },
  Rare:      { pill: 'bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim' },
  Epic:      { pill: 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim' },
  Legendary: { pill: 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim' },
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'action', label: 'Action' },
  { key: 'milestone', label: 'Milestone' },
  { key: 'streak', label: 'Streak' },
];

const BadgeCard = ({ badge }) => {
  const rarity = getRarity(badge.xpReward);
  const iconRef = useRef();
  return (
    <div
      className={`group flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-default ${
        badge.earned
          ? 'bg-surface-container-lowest border-outline-variant/30 hover:border-primary-fixed-dim hover:-translate-y-0.5'
          : 'bg-surface-container-low border-outline-variant/10'
      }`}
      onMouseEnter={() => badge.earned && iconRef.current?.play()}
      onMouseLeave={() => { if (badge.earned) { iconRef.current?.pause(); iconRef.current?.reset(); } }}
    >
      <div className="relative w-14 h-14">
        <BadgeIcon ref={iconRef} badgeKey={badge.key} earned={badge.earned} />
        {badge.earned && (
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-surface-container-lowest flex items-center justify-center z-10">
            <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>

      <div className="text-center w-full">
        <p className={`font-body text-[11px] font-bold leading-tight truncate ${badge.earned ? 'text-on-surface' : 'text-on-surface-variant/50'}`}>
          {badge.name}
        </p>
        <p className={`font-body text-[10px] mt-0.5 leading-snug line-clamp-2 ${badge.earned ? 'text-on-surface-variant' : 'text-on-surface-variant/40'}`}>
          {badge.description}
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-1 mt-auto">
        <span className={`font-label text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${
          badge.earned ? 'bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim' : 'bg-surface-container text-on-surface-variant/50 border-outline-variant/20'
        }`}>
          +{badge.xpReward} XP
        </span>
        <span className={`font-label text-[9px] font-bold px-1.5 py-0.5 rounded-full border ${RARITY_STYLES[rarity].pill}`}>
          {rarity}
        </span>
      </div>

      {badge.earned && badge.earnedAt && (
        <p className="font-body text-[9px] text-on-surface-variant/50">
          {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </p>
      )}
    </div>
  );
};

const SkeletonBadge = () => (
  <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-outline-variant/10 bg-surface-container-low animate-pulse">
    <div className="w-14 h-14 rounded-full bg-surface-variant" />
    <div className="w-16 h-3 bg-surface-variant rounded" />
    <div className="w-12 h-2.5 bg-surface-variant rounded" />
    <div className="flex gap-1">
      <div className="w-10 h-4 bg-surface-variant rounded-full" />
      <div className="w-12 h-4 bg-surface-variant rounded-full" />
    </div>
  </div>
);

const BadgeShowcase = () => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await api.get('/play/badges');
        setBadges(res.data.data);
      } catch (e) {
        setError('Failed to load badges.');
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, []);

  const filtered = filter === 'all' ? badges : badges.filter(b => b.category === filter);
  const earned = badges.filter(b => b.earned);
  const pct = badges.length ? Math.round((earned.length / badges.length) * 100) : 0;

  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="font-headline text-md font-bold text-on-surface tracking-tight">Badge Collection</h1>
          <p className="font-body text-sm text-on-surface-variant mt-0.5">Earn badges by completing challenges and milestones</p>
        </div>

        <div className="flex gap-2 shrink-0">
          {[
            { label: 'Unlocked', value: loading ? '—' : earned.length },
            { label: 'Remaining', value: loading ? '—' : badges.length - earned.length },
            { label: 'Total XP', value: loading ? '—' : `${earned.reduce((s, b) => s + b.xpReward, 0)} XP` },
          ].map(s => (
            <div key={s.label} className="text-center px-4 py-2 rounded-xl bg-surface-container-lowest border border-outline-variant/30">
              <p className="font-headline text-sm font-bold text-on-surface">{s.value}</p>
              <p className="font-label text-[9px] text-on-surface-variant uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mb-5 flex-wrap">
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-label font-bold border transition-all duration-150 ${
              filter === key
                ? 'bg-blue-950 text-on-primary border-blue-950'
                : 'bg-transparent text-on-surface-variant border-outline-variant/30 hover:border-outline-variant hover:text-on-surface'
            }`}
          >
            {label}
            {!loading && (
              <span className={`ml-1.5 font-normal ${filter === key ? 'opacity-60' : 'opacity-50'}`}>
                ({key === 'all' ? badges.length : badges.filter(b => b.category === key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-error-container border border-error/20 mb-4 text-sm font-body text-on-error-container">{error}</div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {loading
          ? Array.from({ length: 12 }).map((_, i) => <SkeletonBadge key={i} />)
          : filtered.map((badge, i) => (
            <div key={badge._id} style={{ animation: `fadeUp 0.3s ease ${i * 30}ms both` }}>
              <BadgeCard badge={badge} />
            </div>
          ))
        }
      </div>

      {!loading && (
        <div className="mt-6 flex flex-wrap gap-2 items-center justify-end">
          <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-widest font-semibold mr-1">Rarity</span>
          {Object.entries(RARITY_STYLES).map(([r, s]) => (
            <span key={r} className={`font-label text-[9px] font-bold px-2 py-1 rounded-full border ${s.pill}`}>{r}</span>
          ))}
        </div>
      )}

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default BadgeShowcase;