import { useRef } from 'react';
import BadgeIcon from '../gamification/BadgeIcon';

const CATEGORY_COLORS = {
  action:    'from-blue-50 to-indigo-50 border-blue-100',
  milestone: 'from-amber-50 to-yellow-50 border-amber-100',
  streak:    'from-orange-50 to-red-50 border-orange-100',
};

const CATEGORY_LABELS = {
  action:    '⚡ Action',
  milestone: '🏆 Milestone',
  streak:    '🔥 Streak',
};

export default function ChatBadgeCard({ badgeShare, isOwn }) {
  const lottieRef = useRef();
  const colors = CATEGORY_COLORS[badgeShare.category] ?? 'from-slate-50 to-slate-100 border-slate-200';

  return (
    <div
      className={`mt-1 rounded-2xl border bg-gradient-to-br ${colors} px-4 py-3 flex items-center gap-3 min-w-[220px] max-w-xs`}
      onMouseEnter={() => lottieRef.current?.play()}
      onMouseLeave={() => lottieRef.current?.pause()}
    >
      {/* Lottie animation */}
      <div className="w-16 h-16 shrink-0">
        <BadgeIcon ref={lottieRef} badgeKey={badgeShare.key} earned={true} />
      </div>

      {/* Info */}
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-medium text-slate-400 uppercase tracking-wide mb-0.5">
          {CATEGORY_LABELS[badgeShare.category] ?? 'Badge'}
        </span>
        <span className="text-sm font-bold text-slate-800 leading-tight">
          {badgeShare.name}
        </span>
        <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">
          {badgeShare.description}
        </span>
      </div>
    </div>
  );
}