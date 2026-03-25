import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import BadgeIcon from './BadgeIcon';

const EmptyState = () => (
    <div className="flex flex-col items-center justify-center py-8 gap-3">
        <div className="w-20 h-20 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <svg viewBox="0 0 40 40" className="w-9 h-9">
                <circle cx="20" cy="20" r="16" fill="none" stroke="#93c5fd" strokeWidth="2" />
                <path d="M14 20l4 4 8-8" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </svg>
        </div>
        <div className="text-center">
            <p className="text-gray-700 text-sm font-semibold">No badges yet</p>
            <p className="text-gray-400 text-xs mt-0.5">Complete quests to earn your first badge</p>
        </div>
    </div>
);


const AchievementCard = ({ badge, index }) => {
    const iconRef = useRef();

    const handleMouseEnter = () => iconRef.current?.play();
    const handleMouseLeave = () => {
        iconRef.current?.pause();
        iconRef.current?.reset();
    };

    return (
        <div
            className="flex flex-col items-center gap-2.5 p-6 rounded-xl text-center border border-blue-100 bg-blue-50 hover:border-blue-300 hover:bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            style={{ transitionDelay: `${index * 50}ms` }}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Icon */}
            <div className="w-20 h-20 relative">
                <BadgeIcon ref={iconRef} badgeKey={badge.key} earned={true} />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white z-10">
                    <svg className="w-2 h-2 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                </div>
            </div>

            {/* Name */}
            <p className="text-gray-800 text-[11px] font-bold leading-tight">{badge.name}</p>

            {/* XP pill */}
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-600 border border-blue-200">
                +{badge.xpReward} XP
            </span>

            {/* Date */}
            {badge.earnedAt && (
                <p className="text-[9px] text-gray-400">
                    {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
            )}
        </div>
    );
};

const RecentAchievements = ({ onViewAll }) => {
    const [badges, setBadges]   = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBadges = async () => {
            try {
                const res = await api.get('/play/badges');
                const earned = res.data.data
                    .filter(b => b.earned)
                    .sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt))
                    .slice(0, 4);
                setBadges(earned);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchBadges();
    }, []);

    return (
        <div className="bg-white rounded-2xl p-5 ">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-900 font-bold text-base tracking-tight">Recent Achievements</h2>
                <button
                    onClick={onViewAll}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-semibold transition-colors flex items-center gap-1"
                >
                    View All
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : badges.length === 0 ? (
                <EmptyState />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {badges.map((badge, i) => (
                        <AchievementCard key={badge.key} badge={badge} index={i} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentAchievements;