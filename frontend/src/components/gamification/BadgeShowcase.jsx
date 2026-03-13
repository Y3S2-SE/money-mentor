import { useState, useEffect, useRef } from 'react';
import api from '../../services/api';
import BadgeIcon from './BadgeIcon';

const getRarity = (xpReward) => {
    if (xpReward >= 100) return 'Legendary';
    if (xpReward >= 50) return 'Epic';
    if (xpReward >= 30) return 'Rare';
    return 'Common';
};

const RARITY_STYLE = {
    Common: { text: 'text-slate-800', bg: 'bg-slate-100', border: 'border-slate-300' },
    Rare: { text: 'text-blue-800', bg: 'bg-blue-100/75', border: 'border-blue-300' },
    Epic: { text: 'text-violet-800', bg: 'bg-violet-100/75', border: 'border-violet-300' },
    Legendary: { text: 'text-amber-800', bg: 'bg-amber-100/75', border: 'border-amber-300' },
};

const CATEGORY_TABS = [
    { key: 'all', label: 'All' },
    { key: 'action', label: 'Action' },
    { key: 'milestone', label: 'Milestone' },
    { key: 'streak', label: 'Streak' },
];

// Badge Card 
const BadgeCard = ({ badge }) => {
    const rarity = getRarity(badge.xpReward);
    const rarityStyle = RARITY_STYLE[rarity];
    const iconRef = useRef();

    const handleMouseEnter = () => {
        if (badge.earned) iconRef.current?.play();
    };

    const handleMouseLeave = () => {
        if (badge.earned) {
            iconRef.current?.pause();
            iconRef.current?.reset(); 
        }
    };

    return (
        <div
            className={`flex flex-col items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-default
                ${badge.earned
                    ? 'bg-white border-blue-100 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                    : 'bg-gray-50 border-gray-200'
                }`}
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            {/* Icon */}
            <div className="w-16 h-16 relative">
                <BadgeIcon ref={iconRef} badgeKey={badge.key} earned={badge.earned} />
                {badge.earned && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center z-10 border-2 border-white">
                        <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>

            {/* Name + description */}
            <div className="text-center">
                <p className={`text-xs font-bold leading-tight ${badge.earned ? 'text-gray-800' : 'text-gray-400'}`}>
                    {badge.name}
                </p>
                <p className={`text-[10px] mt-1 leading-snug ${badge.earned ? 'text-gray-500' : 'text-gray-400'}`}>
                    {badge.description}
                </p>
            </div>

            {/* XP + Rarity pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 mt-auto">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border
                    ${badge.earned
                        ? 'bg-blue-50 text-blue-600 border-blue-200'
                        : 'bg-gray-100 text-gray-400 border-gray-200'
                    }`}>
                    +{badge.xpReward} XP
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${rarityStyle.text} ${rarityStyle.bg} ${rarityStyle.border}`}>
                    {rarity}
                </span>
            </div>

            {/* Earned date */}
            {badge.earned && badge.earnedAt && (
                <p className="text-[9px] text-gray-400 mt-auto">
                    {new Date(badge.earnedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </p>
            )}
        </div>
    );
};

// Loading skeleton 
const SkeletonCard = () => (
    <div className="flex flex-col items-center gap-3 p-4 rounded-xl border border-gray-100 bg-gray-50 animate-pulse">
        <div className="w-16 h-16 rounded-full bg-gray-200" />
        <div className="w-20 h-3 rounded bg-gray-200" />
        <div className="w-16 h-2.5 rounded bg-gray-200" />
        <div className="flex gap-1.5">
            <div className="w-12 h-4 rounded-full bg-gray-200" />
            <div className="w-14 h-4 rounded-full bg-gray-200" />
        </div>
    </div>
);

// Badge Showcase 
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
                console.error(e);
                setError('Failed to load badges. Please try again.');
            } finally {
                setLoading(false);
            }
        };
        fetchBadges();
    }, []);

    const filtered = filter === 'all' ? badges : badges.filter(b => b.category === filter);
    const earnedCount = badges.filter(b => b.earned).length;
    const totalXP = badges.filter(b => b.earned).reduce((sum, b) => sum + b.xpReward, 0);
    const pct = badges.length ? Math.round((earnedCount / badges.length) * 100) : 0;

    const categoryCount = (key) =>
        key === 'all' ? badges.length : badges.filter(b => b.category === key).length;

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight mb-1">Badge Collection</h1>
                        <p className="text-gray-500 text-sm">Collect badges by completing challenges and milestones</p>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-3 flex-wrap shrink-0">
                        {[
                            { label: 'Unlocked', value: loading ? '—' : earnedCount },
                            { label: 'Remaining', value: loading ? '—' : badges.length - earnedCount },
                            { label: 'Total XP', value: loading ? '—' : `${totalXP} XP` },
                        ].map(s => (
                            <div key={s.label} className="text-center px-5 py-2.5 rounded-2xl bg-white border border-gray-50 shadow-sm min-w-18">
                                <p className="text-md font-bold text-gray-800">{s.value}</p>
                                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">{s.label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Progress bar */}
                {/* <div className="mt-5">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] text-gray-500 font-medium uppercase tracking-widest">Collection Progress</span>
                        <span className="text-[11px] font-bold text-blue-600">{pct}%</span>
                    </div>
                    <div className="h-2 bg-blue-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-600 rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${pct}%` }}
                        />
                    </div>
                </div> */}
            </div>

            {/* Filter tabs */}
            <div className="flex gap-2 mb-6 flex-wrap">
                {CATEGORY_TABS.map(({ key, label }) => {
                    const isActive = filter === key;
                    return (
                        <button
                            key={key}
                            onClick={() => setFilter(key)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all duration-200
                                ${isActive
                                    ? 'bg-blue-700 text-white border-blue-600'
                                    : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300 hover:text-blue-600'
                                }`}
                        >
                            {label}
                            {!loading && (
                                <span className={`ml-1.5 font-normal ${isActive ? 'opacity-75' : 'opacity-60'}`}>
                                    ({categoryCount(key)})
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Error state */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
                    <svg className="w-5 h-5 text-red-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}

            {/* Badge grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                {loading
                    ? Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)
                    : filtered.map((badge, i) => (
                        <div
                            key={badge._id}
                            style={{
                                opacity: 1,
                                transform: 'translateY(0)',
                                animation: `fadeUp 0.35s ease ${i * 40}ms both`,
                            }}
                        >
                            <BadgeCard badge={badge} />
                        </div>
                    ))
                }
            </div>

            {/* Rarity legend */}
            {!loading && (
                <div className="mt-8 flex flex-wrap gap-2 items-center justify-end">
                    <span className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mr-1">Rarity</span>
                    {Object.entries(RARITY_STYLE).map(([r, s]) => (
                        <span key={r} className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${s.text} ${s.bg} ${s.border}`}>
                            {r}
                        </span>
                    ))}
                </div>
            )}

            <style>{`
                @keyframes fadeUp {
                    from { opacity: 0; transform: translateY(14px); }
                    to   { opacity: 1; transform: translateY(0);     }
                }
            `}</style>
        </div>
    );
};

export default BadgeShowcase;