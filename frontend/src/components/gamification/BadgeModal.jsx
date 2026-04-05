import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import BadgeIcon from "./BadgeIcon";
import { Calendar, Lock, X, Zap } from "lucide-react";

const getRarity = (xp) => xp >= 100 ? 'Legendary' : xp >= 50 ? 'Epic' : xp >= 30 ? 'Rare' : 'Common';

const RARITY_STYLES = {
    Common: { pill: 'bg-surface-container-high text-on-surface-variant border-outline-variant/30', bg: 'from-slate-100 to-slate-200' },
    Rare: { pill: 'bg-primary-fixed text-on-primary-fixed border-primary-fixed-dim', bg: 'from-blue-100 to-blue-200' },
    Epic: { pill: 'bg-secondary-fixed text-on-secondary-fixed border-secondary-fixed-dim', bg: 'from-purple-100 to-purple-200' },
    Legendary: { pill: 'bg-tertiary-fixed text-on-tertiary-fixed border-tertiary-fixed-dim', bg: 'from-amber-100 to-orange-200' },
};

const BadgeModal = ({ badge, onClose }) => {
    const iconRef = useRef();
    const rarity = getRarity(badge.xpReward);
    const rarityStyle = RARITY_STYLES[rarity];

    useEffect(() => {
        if (badge.earned) {
            const t = setTimeout(() => iconRef.current?.play(), 300);
            return () => clearTimeout(t);
        }
    }, [badge.earned]);

    useEffect(() => {
        const handleKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [onClose]);

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onClose();
    };

    const modalContent = (
        <div
            data-no-swipe
            className="fixed inset-0 z-9998 flex items-end sm:items-center justify-center
            sm:p-4 bg-black/40 backdrop-blur-sm"
            onClick={handleBackdropClick}
        >
            <div
                className="relative bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl 
                w-full sm:max-w-sm overflow-hidden"  
                style={{ animation: 'scaleIn 0.25s ease forwards' }}
            >
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-outline-variant/40" />
                </div>
                {/* Header — colored based on rarity */}
                <div className={`bg-linear-to-br ${rarityStyle.bg} px-6 pt-8 pb-6 flex flex-col items-center gap-3`}>
                    {/* Close button */}
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/10
                        hover:bg-black/20 flex items-center justify-center transition-colors"
                    >
                        <X className="w-4 h-4 text-black/60" />
                    </button>

                    {/* Badge icon — large, auto-playing */}
                    <div className="w-24 h-24 sm:w-28 sm:h-28 relative">
                        <BadgeIcon
                            ref={iconRef}
                            badgeKey={badge.key}
                            earned={badge.earned}
                        />
                        {badge.earned && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full
                                border-2 border-white flex items-center justify-center z-10 shadow-md">
                                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24"
                                    stroke="currentColor" strokeWidth={3.5}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        )}
                        {!badge.earned && (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-slate-400
                                    rounded-full border-2 border-white flex items-center justify-center z-10">
                                    <Lock className="w-3 h-3 text-white" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Badge name */}
                    <div className="text-center">
                        <h2 className="font-headline text-xl font-bold text-on-surface tracking-tight">
                            {badge.name}
                        </h2>
                        <span className={`font-label text-[10px] font-bold px-2.5 py-1 rounded-full
                            border mt-1.5 inline-block ${rarityStyle.pill}`}>
                            {rarity}
                        </span>
                    </div>
                </div>

                {/* Body */}
                <div className="px-6 py-5 space-y-4">
                    {/* Description */}
                    <div>
                        <p className="font-label text-[10px] uppercase tracking-widest
                            text-on-surface-variant font-bold mb-1">
                            How to earn
                        </p>
                        <p className="font-body text-sm text-on-surface leading-relaxed">
                            {badge.description}
                        </p>
                    </div>

                    <div className="border-t border-outline-variant/20" />

                    {/* Stats row */}
                    <div className="flex items-center justify-between">
                        {/* XP reward */}
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-xl bg-primary-fixed flex items-center justify-center">
                                <Zap className="w-4 h-4 text-on-primary-fixed" />
                            </div>
                            <div>
                                <p className="font-label text-[9px] uppercase tracking-wider
                                    text-on-surface-variant">XP Reward</p>
                                <p className="font-headline text-sm font-bold text-on-surface">
                                    +{badge.xpReward} XP
                                </p>
                            </div>
                        </div>

                        {/* Category */}
                        <div className="text-right">
                            <p className="font-label text-[9px] uppercase tracking-wider
                                text-on-surface-variant">Category</p>
                            <p className="font-headline text-sm font-bold text-on-surface capitalize">
                                {badge.category}
                            </p>
                        </div>
                    </div>

                    {/* Earned date — only if earned */}
                    {badge.earned && badge.earnedAt && (
                        <>
                            <div className="border-t border-outline-variant/20" />
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center">
                                    <Calendar className="w-4 h-4 text-green-600" />
                                </div>
                                <div>
                                    <p className="font-label text-[9px] uppercase tracking-wider
                                        text-on-surface-variant">Unlocked on</p>
                                    <p className="font-body text-sm font-semibold text-on-surface">
                                        {new Date(badge.earnedAt).toLocaleDateString('en-US', {
                                            month: 'long', day: 'numeric', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                            </div>
                        </>
                    )}

                    {/* Locked state message */}
                    {!badge.earned && (
                        <>
                            <div className="border-t border-outline-variant/20" />
                            <div className="flex items-center gap-2 p-3 rounded-xl
                                bg-surface-container-low border border-outline-variant/20">
                                <Lock className="w-4 h-4 text-on-surface-variant/50 shrink-0" />
                                <p className="font-body text-xs text-on-surface-variant/70">
                                    Complete the requirement above to unlock this badge
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );

    if (typeof document === 'undefined' || !document.body) {
        return modalContent;
    }

    return createPortal(modalContent, document.body);
};

export default BadgeModal;