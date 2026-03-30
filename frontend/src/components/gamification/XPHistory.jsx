import { useState, useEffect } from 'react';
import { Zap, ChevronDown } from 'lucide-react';
import api from '../../services/api';

const SOURCE_LABELS = {
  daily_login: 'Daily Login',
  streak_7_days: '7-Day Streak Bonus',
  streak_30_days: '30-Day Streak Bonus',
  complete_goal: 'Completed Savings Goal',
  first_login: 'First Login',
  first_saving_goal: 'First Savings Goal',
  read_article: 'Read Article',
  badge_reward: 'Badge Unlocked',
  custom: 'Custom Award',
};

const SkeletonRow = () => (
  <div className="flex items-center gap-3 py-3 animate-pulse px-5">
    <div className="w-8 h-8 bg-surface-variant rounded-lg shrink-0" />
    <div className="flex-1 space-y-1.5">
      <div className="w-32 h-3 bg-surface-variant rounded" />
      <div className="w-20 h-2.5 bg-surface-variant rounded" />
    </div>
    <div className="w-14 h-4 bg-surface-variant rounded" />
  </div>
);

const XPHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get('/play/xp-history?limit=10');
        setHistory(res.data.data.xpHistory || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  const visible = showAll ? history : history.slice(0, 6);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <h2 className="font-headline text-sm font-bold text-on-surface">XP History</h2>
        <span className="font-label text-[10px] text-on-surface-variant bg-surface-container-low border border-outline-variant/20 px-2.5 py-1 rounded-full font-semibold uppercase tracking-wider">
          Recent Activity
        </span>
      </div>

      <div className="px-5 divide-y divide-outline-variant/10">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          : history.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Zap strokeWidth={1.5} className="w-8 h-8 text-outline-variant" />
              <p className="font-body text-sm text-on-surface-variant">No XP earned yet. Start by logging in daily!</p>
            </div>
          )
          : visible.map((entry, i) => (
            <div key={i} className="flex items-center gap-3 py-3">
              <div className="w-8 h-8 rounded-lg bg-primary-fixed border border-primary-fixed-dim flex items-center justify-center shrink-0">
                <Zap strokeWidth={1.5} className="w-4 h-4 text-on-primary-fixed" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs font-semibold text-on-surface truncate">
                  {SOURCE_LABELS[entry.source] || entry.source}
                </p>
                {entry.description && (
                  <p className="font-body text-[10px] text-on-surface-variant truncate">{entry.description}</p>
                )}
                <p className="font-body text-[9px] text-on-surface-variant/70 mt-0.5">
                  {new Date(entry.earnedAt).toLocaleDateString('en-US', {
                    month: 'short', day: 'numeric', year: 'numeric',
                    hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <span className="font-headline text-xs font-bold text-primary shrink-0">+{entry.amount} XP</span>
            </div>
          ))
        }
      </div>

      {!loading && history.length > 6 && (
        <div className="px-5 py-3 border-t border-outline-variant/20">
          <button
            onClick={() => setShowAll(!showAll)}
            className="flex items-center gap-1.5 font-label text-xs text-on-surface-variant hover:text-primary font-semibold transition-colors mx-auto"
          >
            {showAll ? 'Show less' : `Show all ${history.length} entries`}
            <ChevronDown strokeWidth={2} className={`w-3.5 h-3.5 transition-transform ${showAll ? 'rotate-180' : ''}`} />
          </button>
        </div>
      )}
    </div>
  );
};

export default XPHistory;