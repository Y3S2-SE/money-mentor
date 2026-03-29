// src/components/gamification/Leaderboard.jsx
import { useState, useEffect } from 'react';
import { Trophy } from 'lucide-react';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const initials = (name) => name?.slice(0, 2).toUpperCase() || '??';

const SkeletonRow = () => (
  <div className="flex items-center gap-3 px-5 py-3 animate-pulse">
    <div className="w-6 h-4 bg-surface-variant rounded" />
    <div className="w-8 h-8 bg-surface-variant rounded-full" />
    <div className="flex-1 space-y-1.5">
      <div className="w-24 h-3 bg-surface-variant rounded" />
      <div className="w-16 h-2.5 bg-surface-variant rounded" />
    </div>
    <div className="w-14 h-3 bg-surface-variant rounded" />
  </div>
);

const Leaderboard = ({ compact = false, full = false }) => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [myRank, setMyRank] = useState(null);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const { user } = useSelector((state) => state.auth);

  const limit = 5;

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/play/leaderboard?limit=${limit}`);
        setLeaderboard(res.data.data.leaderboard);
        setMyRank(res.data.data.myRank);
        setTotal(res.data.data.totalParticipants);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, [limit]);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
      <div className="px-5 py-4 border-b border-outline-variant/20 flex items-center justify-between">
        <div>
          <h2 className="font-headline text-sm font-bold text-on-surface">Top Savers</h2>
          {!loading && (
            <p className="font-body text-[10px] text-on-surface-variant mt-0.5">{total} participants</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {myRank && (
            <span className="font-label text-[10px] font-bold text-on-primary-fixed bg-primary-fixed border border-primary-fixed-dim px-2.5 py-1 rounded-full">
              Your rank #{myRank}
            </span>
          )}
        </div>
      </div>

      <div className="divide-y divide-outline-variant/10">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => <SkeletonRow key={i} />)
          : leaderboard.length === 0
          ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <Trophy strokeWidth={1.5} className="w-8 h-8 text-outline-variant" />
              <p className="font-body text-sm text-on-surface-variant text-center">No rankings yet.<br />Earn XP to appear here!</p>
            </div>
          )
          : leaderboard.map((entry) => {
            const isMe = entry.isCurrentUser;
            return (
              <div
                key={entry.rank}
                className={`flex items-center gap-3 px-5 py-3 transition-colors ${
                  isMe ? 'bg-primary-fixed/20' : 'hover:bg-surface-container-low'
                }`}
              >
                <div className="w-7 text-center shrink-0">
                  {MEDALS[entry.rank]
                    ? <span className="text-base">{MEDALS[entry.rank]}</span>
                    : <span className="font-label text-[11px] font-bold text-outline-variant">#{entry.rank}</span>}
                </div>

                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                  isMe ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface'
                }`}>
                  {initials(entry.username)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className={`font-body text-xs font-bold truncate ${isMe ? 'text-primary' : 'text-on-surface'}`}>
                      {entry.username}
                    </p>
                    {isMe && (
                      <span className="font-body text-[9px] text-surface-tint font-normal shrink-0">(you)</span>
                    )}
                  </div>
                  <p className="font-body text-[10px] text-on-surface-variant truncate">{entry.levelTitle}</p>
                </div>

                <div className="text-right shrink-0">
                  <p className={`font-headline text-xs font-bold ${isMe ? 'text-primary' : 'text-on-surface-variant'}`}>
                    {entry.totalXP.toLocaleString()}
                  </p>
                  <p className="font-label text-[9px] text-on-surface-variant/70 uppercase tracking-wider">XP</p>
                </div>
              </div>
            );
          })
        }
      </div>

      {!loading && myRank && myRank > limit && (
        <div className="px-5 py-3 border-t border-outline-variant/20 bg-primary-fixed/20">
          <div className="flex items-center gap-3">
            <span className="font-label text-[11px] font-bold text-primary">#{myRank}</span>
            <div className="w-8 h-8 rounded-full bg-primary text-on-primary flex items-center justify-center text-[11px] font-bold shrink-0">
              {initials(user?.username)}
            </div>
            <div className="flex-1">
              <p className="font-body text-xs font-bold text-primary">{user?.username} <span className="font-body text-[9px] font-normal text-surface-tint">(you)</span></p>
              <p className="font-body text-[10px] text-on-surface-variant">Keep earning XP to climb!</p>
            </div>
          </div>
        </div>
      )}

      {compact && (
        <div className="m-4 rounded-xl p-4 relative overflow-hidden hero-bg-overlay border border-outline-variant/20">
          <div className="absolute right-3 bottom-2 text-4xl opacity-20 select-none">🏆</div>
          <p className="font-headline text-on-primary text-xs font-bold mb-1">Climb the ranks!</p>
          <p className="font-body text-inverse-primary text-[11px] leading-relaxed">
            Daily logins, goals, and courses all earn XP.
          </p>
        </div>
      )}
    </div>
  );
};

export default Leaderboard;