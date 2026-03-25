import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import api from '../services/api';
import Sidebar from '../components/dashboard/Sidebar';
import Leaderboard from '../components/gamification/Leaderboard';
import RecentAchievements from '../components/gamification/RecentAchievements';
import BadgeShowcase from '../components/gamification/BadgeShowcase';
import { clearDailyLoginReward, clearPendingBadges } from '../store/slices/authSlice';
import toast from 'react-hot-toast';

const StatPill = ({ icon, label, value }) => (
    <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-xs">
        <span className="text-xl">{icon}</span>
        <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">{label}</p>
            <p className="text-gray-800 font-bold text-[16px] leading-tight">{value}</p>
        </div>
    </div>
);

const TOAST_DELAY    = 1200;  
const TOAST_DURATION = 6000;

const PlayPage = () => {
    const [view, setView] = useState('main');
    const [profile, setProfile] = useState(null);
    const { user } = useSelector((state) => state.auth);
    const dispatch = useDispatch();
    const dailyLoginReward = useSelector((state) => state.auth.dailyLoginReward);
    const pendingBadges    = useSelector((state) => state.auth.pendingBadges);
 
    useEffect(() => {
        const queue = [];
 
        if (dailyLoginReward) {
            queue.push({
                type:    'xp',
                message: `⭐ +${dailyLoginReward.xpAwarded} XP earned — Day ${dailyLoginReward.currentStreak} login streak! 🔥`,
            });
        }
 
        pendingBadges.forEach((badge) => {
            queue.push({
                type:    'badge',
                message: `🏆 Achievement Unlocked: ${badge.name}`,
            });
        });
 
        if (dailyLoginReward) dispatch(clearDailyLoginReward());
        if (pendingBadges.length > 0) dispatch(clearPendingBadges());
 
        if (queue.length === 0) return;
 
        const timers = queue.map((item, index) =>
            setTimeout(() => {
                toast.success(item.message, { duration: TOAST_DURATION });
            }, index * TOAST_DELAY)
        );
 
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/play/profile');
                setProfile(res.data.data);
            } catch (e) {
                console.error(e);
            }
        };
        fetchData();
    }, []);

    return (
        <Sidebar>
            <div className="min-h-screen bg-white p-6">
                {view === 'badges' ? (
                    /* Badge Showcase View */
                    <div>
                        <button
                            onClick={() => setView('main')}
                            className="flex items-center gap-2 text-gray-500 hover:text-blue-600 text-sm font-medium mb-6 transition-colors"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                            </svg>
                            Back to Play & Level Up
                        </button>
                        <div className="bg-white rounded-2xl p-6">
                            <BadgeShowcase />
                        </div>
                    </div>
                ) : (
                    /* Main Play View */
                    <>
                        {/* Page Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Play & Level Up</h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Your financial journey is an adventure. Complete quests to earn rewards.
                                </p>
                            </div>

                            {/* Stats */}
                            <div className="flex gap-3 flex-wrap">
                                <StatPill icon="⭐" label="Total XP"
                                    value={profile ? profile.totalXP.toLocaleString() : '—'} />
                                <StatPill icon="🔥" label="Streak"
                                    value={profile ? `${profile.currentStreak} Days` : '—'} />
                                <StatPill icon="🏅" label="Level"
                                    value={profile ? `Lv. ${profile.level}` : '—'} />
                            </div>
                        </div>

                        {/* Level Progress */}
                        {profile && (
                            <div className="mb-6 p-4 rounded-2xl bg-white border border-gray-50 shadow-sm">
                                <div className="flex justify-between items-center mb-2">
                                    <div>
                                        <span className="text-gray-800 text-sm font-bold">{profile.levelTitle}</span>
                                        <span className="text-blue-600 text-xs font-bold ml-5">Level {profile.level}</span>
                                    </div>
                                    <span className="text-gray-400 text-xs">
                                        {profile.levelProgress?.earned} / {profile.levelProgress?.needed} XP to next level
                                    </span>
                                </div>
                                <div className="h-2 bg-blue-100 rounded-full overflow-hidden border border-gray-200">
                                    <div
                                        className="h-full bg-blue-600 rounded-full transition-all duration-1000"
                                        style={{ width: `${profile.levelProgress?.percentage ?? 0}%` }}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 2-column grid */}
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                            <div className="lg:col-span-2 flex flex-col gap-5">
                                <RecentAchievements onViewAll={() => setView('badges')} />
                            </div>
                            <div className="lg:col-span-1">
                                <Leaderboard />
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Sidebar>
    );
};

export default PlayPage;