import { useState, useEffect, useRef } from 'react';
import { ChevronRight } from 'lucide-react';
import BadgeIcon from './BadgeIcon';
import gamificationSerivce from '../../services/gamificationService';

const SkeletonCard = () => (
  <div className="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/10 animate-pulse">
    <div className="w-12 h-12 rounded-xl bg-surface-variant shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="w-24 h-3 bg-surface-variant rounded" />
      <div className="w-16 h-2.5 bg-surface-variant rounded" />
    </div>
    <div className="w-12 h-5 bg-surface-variant rounded-full" />
  </div>
);

const AchievementRow = ({ badge }) => {
  const iconRef = useRef();
  return (
    <div
      className="flex items-center gap-3 p-3 rounded-xl border border-primary-fixed-dim/30 bg-primary-fixed/10 hover:border-primary-fixed-dim hover:bg-primary-fixed/20 transition-all duration-200 cursor-default group"
      onMouseEnter={() => iconRef.current?.play()}
      onMouseLeave={() => { iconRef.current?.pause(); iconRef.current?.reset(); }}
    >
      <div className="w-12 h-12 shrink-0">
        <BadgeIcon ref={iconRef} badgeKey={badge.key} earned={true} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-xs font-bold text-on-surface truncate">{badge.name}</p>
        <p className="font-body text-[10px] text-on-surface-variant truncate">{badge.description}</p>
        {badge.earnedAt && (
          <p className="font-body text-[9px] text-on-surface-variant/70 mt-0.5">
            {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
        )}
      </div>
      <span className="font-label text-[10px] font-bold px-2 py-1 rounded-full bg-primary-fixed text-on-primary-fixed border border-primary-fixed-dim shrink-0">
        +{badge.xpReward} XP
      </span>
    </div>
  );
};

const RecentAchievements = ({ onViewAll }) => {
  const [badges, setBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  const limit = 4;

  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const res = await gamificationSerivce.getBadges(limit);
        const earned = res.data
          .filter(b => b.earned)
          .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
          .slice(0, limit);
        setBadges(earned);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchBadges();
  }, [limit]);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
      <div className="px-4 sm:px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <h2 className="font-headline text-sm font-bold text-on-surface">Recent Achievements</h2>
        <button
          onClick={onViewAll}
          className="flex items-center gap-1 font-label text-[11px] text-primary hover:text-surface-tint font-semibold transition-colors"
        >
          View All <ChevronRight strokeWidth={2} className="w-3 h-3" />
        </button>
      </div>

      <div className="p-4 space-y-2">
        {loading
          ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
          : badges.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-8 gap-2 sm:gap-3 p-2.5 sm:p-3 rounded-xl">
              <div className="w-10 h-10 sm:w-12 sm:h-12 shrink-0 rounded-xl bg-surface-container-low border border-outline-variant/20 flex items-center justify-center">
                <svg viewBox="0 0 40 40" className="w-6 h-6">
                  <circle cx="20" cy="20" r="14" fill="none" stroke="var(--color-outline-variant)" strokeWidth="2" />
                  <path d="M14 20l4 4 8-8" stroke="var(--color-outline)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                </svg>
              </div>
              <p className="font-body text-xs text-on-surface-variant text-center">No badges yet.<br />Complete challenges to earn your first!</p>
            </div>
          )
          : badges.map((badge) => (
            <AchievementRow key={badge.key} badge={badge} />
          ))
        }
      </div>
    </div>
  );
};

export default RecentAchievements;