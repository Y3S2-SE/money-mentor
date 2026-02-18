import { useState } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from "react-redux";
import { logout } from "../../store/slices/authSlice";

import { Wallet, Gamepad2, BookOpen, Users, LogOut } from 'lucide-react';

const navItems = [
    { label: 'My', icon: Wallet, path: '/dashboard' },
    { label: 'Play', icon: Gamepad2, path: '/play' },
    { label: 'Learn', icon: BookOpen, path: '/learn' },
    { label: 'Group', icon: Users, path: '/group' },
];

const Sidebar = ({ children }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = async () => {
        await dispatch(logout());
        navigate('/login');
    };

    const initials = user?.username ? user.username.slice(0, 2).toUpperCase() : 'MM';

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden">
            <aside className="hidden lg:flex flex-col w-68 bg-blue-950 h-screen">
                <div className="flex items-center gap-3 px-6 py-7">
                    <div className="w-9 h-9 rounded-full bg-blue-700 flex items-center justify-center">
                        <span className="text-white font-bold text-sm">M</span>
                    </div>
                    <span className="text-white font-bold text-[22px] tracking-tight">MoneyMentor</span>
                </div>

                <nav className="flex-1 px-3 mt-4 space-y-4 overflow-y-auto">
                    {navItems.map(({ label, icon: Icon, path }) => {
                        const isActive = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className={`w-full flex items-center gap-3 px-4 py-4 rounded-xl text-[16px] transition-all duration-200
                                    ${isActive ? 'bg-blue-400/33 text-blue-200/95 font-bold' : 'text-gray-300/70 hover:bg-blue-400/33 hover:text-blue-200/95 hover:font-bold'}
                                `}
                            >
                                <Icon className="w-5 h-5 shrink-0 "/>
                                <span>{label === 'My' ? 'My Wallet' : label === 'Play' ? 'Play & Level Up' : label === 'Learn' ? 'Learn Hub' : 'Group Pot'}</span>
                            </Link>
                        )
                    })}
                </nav>

                <div className="px-3 pb-4">
                    <div className="border-t border-white/10 mb-4" />
                    <div className="bg-blue-400/10 rounded-3xl p-4 mt-3 flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-blue-700 ring-2 ring-blue-500 flex items-center justify-center shrink-0">
                                <span className="text-blue-200 font-bold text-[13px]">{initials}</span>
                            </div>

                            <div className="flex flex-col min-w-0 gap-0.6">
                                <span className="text-white font-semibold text-sm truncate">
                                    {user?.username ?? 'User'}
                                </span>
                                <span className="text-blue-300/70 text-[10px] font-medium uppercase tracking-wide">
                                    {user?.role === 'admin' ? 'Administrator' : 'Pro Saver'}
                                </span>
                            </div>
                        </div>

                        <button
                            onClick={handleLogout}
                            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-3xl bg-blue-400/16 hover:bg-blue-400/40 text-gray-300/95 
                                hover:text-white text-sm font-medium hover:font-bold transition-all duration-200"
                        >
                            <LogOut className="w-4 h-4 shrink-0"/>
                            <span>Log Out</span>
                        </button>
                    </div>
                </div>
            </aside>

            {/* Page content */}
            <div className="flex-1 overflow-auto pb-16 lg:pb-0">
                {children}
            </div>

            {/* Mobile bottom navigation */}
            <nav className="lg:hidden fixed -bottom-1 left-0 -right-1 z-50 bg-blue-950 border-t border-white/10">
                <div className="flex items-center justify-around px-2 py-2">
                    {navItems.map(({ label, icon: Icon, path }) => {
                        const isActive = location.pathname === path;
                        return (
                            <Link
                                key={path}
                                to={path}
                                className="flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-15"
                            >
                                <div className={`p-3 rounded-2xl transition-all duration-200 ${isActive ? 'bg-blue-400/33' : ''}`}>
                                    <Icon className={`w-6 h-6 transition-colors duration-200 ${isActive ? 'text-blue-200/95' : 'text-gray-300/70'}`}/>
                                </div>
                                <span className={`text-[14px] transition-colors duration-200 ${isActive ? 'text-blue-200/95 font-bold' : 'text-gray-300/70 font-medium'}`}>
                                    {label}
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