import { useState, useEffect } from 'react';
import api from '../../services/api';
import { useSelector } from 'react-redux';

const RANK_MEDALS = { 1: '🥇', 2: '🥈', 3: '🥉' };

const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(true);
    const { user } = useSelector((state) => state.auth);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/play/leaderboard?limit=10');
                setLeaderboard(res.data.data.leaderboard);
                setMyRank(res.data.data.myRank);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const initials = (name) => name?.slice(0, 2).toUpperCase() || '??';

    return (
        <div className="bg-white rounded-2xl border border-gray-50 p-5 flex flex-col shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-gray-900 font-bold text-base tracking-tight">Top Savers</h2>
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-widest bg-gray-100 px-2.5 py-1 rounded-full">
                    This Month
                </span>
            </div>

            {loading ? (
                <div className="flex-1 flex items-center justify-center py-8">
                    <div className="w-6 h-6 border-2 border-blue-100 border-t-blue-500 rounded-full animate-spin" />
                </div>
            ) : leaderboard.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center py-8 gap-2">
                    <span className="text-3xl">🏆</span>
                    <p className="text-gray-400 text-sm text-center">No data yet.<br />Start earning XP to appear here!</p>
                </div>
            ) : (
                <div className="space-y-1.5">
                    {leaderboard.map((entry) => {
                        const isMe = entry.isCurrentUser;
                        const medal = RANK_MEDALS[entry.rank];

                        return (
                            <div
                                key={entry.rank}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors duration-150
                  ${isMe
                                        ? 'bg-blue-50 border-blue-200'
                                        : 'bg-white border-transparent hover:bg-gray-50'
                                    }`}
                            >
                                {/* Rank */}
                                <div className="w-6 text-center shrink-0">
                                    {medal ? (
                                        <span className="text-base">{medal}</span>
                                    ) : (
                                        <span className="text-[11px] font-bold text-gray-400">#{entry.rank}</span>
                                    )}
                                </div>

                                {/* Avatar */}
                                <div
                                    className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0
                    ${isMe ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                                >
                                    {initials(isMe ? user?.username : entry.username)}
                                </div>

                                {/* Name + title */}
                                <div className="flex-1 min-w-0">
                                    <p className={`text-xs font-bold truncate ${isMe ? 'text-blue-700' : 'text-gray-700'}`}>
                                        {entry.username}
                                        {isMe && <span className="ml-1 text-[9px] text-blue-400 font-normal">(you)</span>}
                                    </p>
                                    <p className="text-[10px] text-gray-400 truncate">{entry.levelTitle}</p>
                                </div>

                                {/* XP */}
                                <span className={`text-[11px] font-bold shrink-0 ${isMe ? 'text-blue-600' : 'text-gray-500'}`}>
                                    {entry.totalXP.toLocaleString()} XP
                                </span>
                            </div>
                        );
                    })}

                    {/* My rank if outside top 10 */}
                    {myRank && myRank > 10 && (
                        <div className="mt-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-blue-50 border border-blue-200">
                                <div className="w-6 text-center shrink-0">
                                    <span className="text-[11px] font-bold text-blue-600">#{myRank}</span>
                                </div>
                                <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold shrink-0">
                                    {initials(user?.username)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-xs font-bold text-blue-700 truncate">
                                        {user?.username} <span className="text-[9px] text-blue-400 font-normal">(you)</span>
                                    </p>
                                    <p className="text-[10px] text-gray-400">Keep going!</p>
                                </div>
                                <span className="text-[11px] font-semibold text-blue-600 shrink-0">Your rank</span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Rank up promo card */}
            <div className="mt-4 rounded-xl p-4 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e1b4b 100%)', border: '1px solid rgba(59,130,246,0.2)' }}>
                <div className="absolute right-3 bottom-2 text-5xl opacity-25 select-none">🏆</div>
                <p className="text-white font-bold text-sm mb-1">Climb the ranks!</p>
                <p className="text-slate-200 text-[11px] leading-relaxed">
                    Earn XP through daily logins, completing goals, and reading articles to reach the top.
                </p>
            </div>
        </div>
    );
};

export default Leaderboard;