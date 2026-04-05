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
      className={`rounded-xl border bg-linear-to-br ${colors} px-3 py-2.5 flex items-center gap-3 min-w-47.5 max-w-60`}
      onMouseEnter={() => lottieRef.current?.play()}
      onMouseLeave={() => lottieRef.current?.pause()}
    >
      <div className="w-12 h-12 shrink-0">
        <BadgeIcon ref={lottieRef} badgeKey={badgeShare.key} earned={true} />
      </div>
      <div className="flex flex-col min-w-0">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-0.5">
          {CATEGORY_LABELS[badgeShare.category] ?? 'Badge'}
        </span>
        <span className="text-sm font-bold text-slate-800 leading-tight">{badgeShare.name}</span>
        <span className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{badgeShare.description}</span>
      </div>
    </div>
  );
}