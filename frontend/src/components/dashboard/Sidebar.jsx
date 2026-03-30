import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";

import { LayoutDashboard, Wallet, Gamepad2, BookOpen, Users, LogOut, ChevronLeft, ChevronRight } from 'lucide-react';
import api from "../../services/api";

const navItems = [
    { label: 'My Wallet', icon: Wallet, path: '/dashboard' },
    { label: 'Play & Level Up', icon: Gamepad2, path: '/play' },
    { label: 'Learn Hub', icon: BookOpen, path: '/learn' },
    { label: 'Group Plot', icon: Users, path: '/group' },
];

const Sidebar = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);
    const [isCollapsed, setIsCollapsed] = useState(false);
    const [profile, setProfile] = useState(null);

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

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/');
    };

    const currentXP = profile?.totalXP || 0;
    const level = profile?.level || 1;
    const currentLevelXP = (level - 1) * 100;
    const nextLevelXP = level * 100;

    const earnedXP = currentXP - currentLevelXP;
    const neededXP = 100;
    const remainingXP = Math.max((nextLevelXP - currentXP), 0);

    const progressPercent = Math.min((earnedXP / neededXP) * 100, 100);

    const [prevXP, setPrevXP] = useState(currentXP);

    useEffect(() => {
        if (currentXP !== prevXP) {
            // trigger animation
            setPrevXP(currentXP);
        }
    }, [currentXP]);

    return (
        <div className="flex h-screen bg-surface-bright overflow-hidden">
            <aside
                className={`relative hidden lg:flex flex-col bg-surface-bright border-r border-gray-200/60 h-screen transition-all duration-300 ease-in-out z-40 ${isCollapsed ? 'w-20' : 'w-64'
                    }`}
            >
                {/* Collapse Toggle */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute -right-2.5 top-9 bg-white border border-gray-200 rounded-full w-5 h-5 flex items-center justify-center text-gray-400 hover:text-blue-950 hover:border-gray-300 shadow-sm transition-all duration-200 z-50 outline-none focus:ring-2 focus:ring-blue-950/20"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3 ml-px" /> : <ChevronLeft className="w-3 h-3 mr-px" />}
                </button>

                <div className={`flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-6 gap-3'} py-8 transition-all duration-300`}>
                    <div className="w-10 h-10 rounded-xl bg-blue-950 flex flex-col items-center justify-center shrink-0 shadow-md">
                        <Wallet className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex flex-col overflow-hidden whitespace-nowrap">
                            <span className="text-blue-950 font-extrabold text-[20px] tracking-tight leading-tight">MoneyMentor</span>
                            <span className="text-gray-400 text-[8px] font-bold tracking-widest mt-0.5">THE DIGITAL CURATOR</span>
                        </div>
                    )}
                </div>

                <nav className="flex-1 mt-2 space-y-1 overflow-y-auto w-full pb-4 scrollbar-hide">
                    {navItems.map(({ label, icon: Icon, path }) => {
                        const isActive = location.pathname === path || (path === '/dashboard' && location.pathname === '/');
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'gap-4 px-6'} py-3.5 transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-gray-200/60 text-blue-950 border-r-4 border-blue-950'
                                        : 'text-gray-500 hover:bg-gray-100/80 hover:text-blue-950 border-r-4 border-transparent'
                                    }
                                `}
                                title={isCollapsed ? label : undefined}
                            >
                                <Icon className={`w-5 h-5 shrink-0 transition-colors duration-200 ${isActive ? 'text-blue-950' : 'text-gray-400 group-hover:text-blue-950'}`} />
                                {!isCollapsed && (
                                    <span className={`text-[15px] whitespace-nowrap ${isActive ? 'font-bold' : 'font-medium'}`}>
                                        {label}
                                    </span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                <div className="px-5 pb-6 mt-auto flex flex-col gap-4">
                    {/* Level Card */}
                    {!isCollapsed ? (
                        <div className="bg-blue-950 rounded-2xl p-4 text-white shadow-lg relative overflow-hidden group transition-all duration-300">
                            {/* Decorative background element */}
                            <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-bl-[64px] pointer-events-none" />

                            <div className="flex justify-between items-center mb-3 relative z-10">
                                <span className="text-[11px] font-bold tracking-wider text-white">LEVEL {level}</span>
                                <span className="text-[11px] font-bold text-white">{currentXP} XP</span>
                            </div>
                            <div className="w-full bg-black/40 h-1.5 rounded-full mb-3 overflow-hidden relative z-10">
                                <div className="bg-[#85a4d5] h-full rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
                            </div>
                            <div className="flex justify-between items-center relative z-10">
                                <span className="text-[10px] text-gray-300 font-medium">{remainingXP} XP to Level {level + 1}</span>
                            </div>
                        </div>
                    ) : (
                        <div className="w-10 h-10 mx-auto bg-blue-950 rounded-xl flex flex-col items-center justify-center shrink-0 shadow-lg cursor-help transition-all duration-300 hover:bg-[#17153b]" title="Level 4 - 850 XP (150 XP to Level 5)">
                            <span className="text-[8px] font-bold text-white mb-0.5">LVL {profile.level}</span>
                            <div className="w-6 bg-black/40 h-1 rounded-full overflow-hidden">
                                <div className="bg-[#85a4d5] h-full rounded-full" style={{ width: '85%' }}></div>
                            </div>
                        </div>
                    )}

                    {/* Logout Button */}
                    <button
                        onClick={handleLogout}
                        className={`flex items-center outline-none ${isCollapsed ? 'justify-center px-0 w-10 h-10 mx-auto' : 'gap-3 px-3 w-full'} py-2.5 rounded-xl text-gray-500 hover:bg-red-50 hover:text-red-500 transition-colors duration-200`}
                        title={isCollapsed ? "Log Out" : undefined}
                    >
                        <LogOut className="w-5 h-5 shrink-0" />
                        {!isCollapsed && <span className="text-[14px] font-bold whitespace-nowrap">Log Out</span>}
                    </button>
                </div>
            </aside>

            {/* Page content */}
            <div className="flex-1 overflow-auto bg-[#F8F9FA] pb-16 lg:pb-0">
                {children}
            </div>

            {/* Mobile bottom navigation */}
            <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)] pb-safe">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map(({ label, icon: Icon, path }) => {
                        const isActive = location.pathname === path || (path === '/dashboard' && location.pathname === '/');
                        return (
                            <Link
                                key={path}
                                to={path}
                                className="flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-all duration-200"
                            >
                                <div className={`p-2 rounded-full transition-all duration-200 flex items-center justify-center ${isActive ? 'bg-gray-100' : ''}`}>
                                    <Icon className={`w-5 h-5 transition-colors duration-200 ${isActive ? 'text-blue-950' : 'text-gray-400'}`} />
                                </div>
                                <span className={`text-[10px] transition-colors duration-200 whitespace-nowrap ${isActive ? 'text-blue-950 font-bold' : 'text-gray-500 font-medium'}`}>
                                    {label.replace(' & Level Up', '').replace(' Hub', '')}
                                </span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}

export default Sidebar;