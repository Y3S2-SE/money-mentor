import { useState, useEffect, useRef } from 'react';
import adminService from '../../services/adminService';
import { useDispatch } from 'react-redux';
import useConfirm from '../../hooks/useConfirm';
import ConfirmWindow from '../ui/ConfirmWindow';
import { addToast } from '../../store/slices/toastSlice';

const AdminUserList = () => {
    const dispatch = useDispatch();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');
    const [isActive, setIsActive] = useState('');
    const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
    const { confirm, modalProps } = useConfirm()
    const [isStatusOpen, setIsStatusOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsStatusOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statusOptions = [
        { label: 'All Status', value: '' },
        { label: 'Active', value: 'true' },
        { label: 'Inactive', value: 'false' },
    ];

    const currentStatusLabel = statusOptions.find(opt => opt.value === isActive)?.label || 'All Status';

    const fetchUsers = async (page = 1) => {
        setLoading(true);
        try {
            const res = await adminService.getAllUsers({
                page,
                limit: 10,
                search,
                isActive: isActive !== '' ? isActive : undefined,
            });
            setUsers(res.data);
            setPagination(res.pagination);
        } catch (error) {
            console.error('Failed to fetch users:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers(1);
    }, [search, isActive]);

    const handleSearch = (e) => {
        e.preventDefault();
        setSearch(searchInput);
    };

    const handleDelete = async (user) => {
        const confirmed = await confirm({
            title: 'Delete User?',
            description: `"${user.username}" will be permanently removed. This cannot be undone.`,
            confirmLabel: 'Delete',
            cancelLabel: 'Keep',
            variant: 'danger',
        });
        if (!confirmed) return;

        setLoading(true);
        try {
            await userService.deleteUser(user._id);
            setUsers(users.filter(u => u._id !== user._id));
            setPagination(prev => ({ ...prev, total: prev.total - 1 }));
            dispatch(addToast({
                type: 'success',
                message: 'User deleted',
                subMessage: 'The user account has been removed.',
            }));
        } catch (error) {
            dispatch(addToast({
                type: 'error',
                message: 'Failed to delete user',
                subMessage: error?.response?.data?.message || 'Please try again.',
            }));
        }
    };

    const initials = (name) => name?.slice(0, 2).toUpperCase() || '??';

    const roleColor = (role) => role === 'admin'
        ? 'bg-primary/10 text-primary border-primary/20'
        : 'bg-outline-variant/20 text-on-surface/60 border-outline-variant/30';

    return (
        <>
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4
                border-b border-outline-variant/30 pb-4">
                <div>
                    <h2 className="text-xl sm:text-2xl font-headline font-bold text-on-surface">
                        Manage Users
                    </h2>
                    <p className="text-on-surface/60 text-sm mt-1">
                        View, search, and manage registered users.
                        {!loading && (
                            <span className="ml-1 font-semibold text-primary">
                                {pagination.total} total
                            </span>
                        )}
                    </p>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 w-full">
                <form onSubmit={handleSearch} className="flex gap-2 flex-1 w-full">
                    <div className="relative flex-1">
                        <span className="material-symbols-outlined absolute left-3 top-1/2
                            -translate-y-1/2 text-[18px] text-on-surface/40">
                            search
                        </span>
                        <input
                            type="text"
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            placeholder="Search by name or email..."
                            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-outline-variant/30
                                bg-white text-sm font-body text-on-surface placeholder:text-on-surface/40
                                focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10"
                        />
                    </div>
                    <button
                        type="submit"
                        className="px-4 py-2.5 bg-primary text-white rounded-xl font-label text-[11px]
                            uppercase tracking-widest font-bold hover:bg-primary/90 transition-colors shrink-0"
                    >
                        Search
                    </button>
                </form>
                
            
                <div className="w-full sm:w-auto relative shrink-0" ref={dropdownRef}>
                    <button
                        type="button"
                        onClick={() => setIsStatusOpen(!isStatusOpen)}
                        className="w-full sm:w-35 px-4 py-2.5 pr-10 rounded-xl border border-outline-variant/30 bg-white
                            text-sm font-body text-left text-on-surface focus:outline-none focus:border-primary/40
                            focus:ring-2 focus:ring-primary/10 flex items-center justify-between"
                    >
                        <span className="truncate">{currentStatusLabel}</span>
                        <span className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 
                            text-on-surface/50 pointer-events-none text-[20px] transition-transform duration-200 
                            ${isStatusOpen ? 'rotate-180' : ''}`}
                        >
                            expand_more
                        </span>
                    </button>
                    {isStatusOpen && (
                        <div className="absolute z-10 w-full mt-2 bg-white border border-outline-variant/30 rounded-xl shadow-lg overflow-hidden">
                            {statusOptions.map((option) => (
                                <button
                                    key={option.value}
                                    type="button"
                                    onClick={() => {
                                        setIsActive(option.value);
                                        setIsStatusOpen(false);
                                    }}
                                    className={`w-full text-left px-4 py-2.5 text-sm font-body transition-colors
                                        ${isActive === option.value
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'text-on-surface hover:bg-outline-variant/10'
                                        }`}
                                >
                                    {option.label}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-outline-variant/20 overflow-hidden shadow-sm">
                {loading ? (
                    <div className="divide-y divide-outline-variant/10">
                        {Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="flex items-center gap-3 px-4 sm:px-6 py-4 animate-pulse">
                                <div className="w-9 h-9 rounded-full bg-outline-variant/20 shrink-0" />
                                <div className="flex-1 space-y-2">
                                    <div className="w-32 h-3 bg-outline-variant/20 rounded" />
                                    <div className="w-48 h-2.5 bg-outline-variant/20 rounded" />
                                </div>
                                <div className="hidden sm:block w-16 h-5 bg-outline-variant/20 rounded-full" />
                                <div className="w-16 h-5 bg-outline-variant/20 rounded-full" />
                                <div className="w-8 h-8 bg-outline-variant/20 rounded-lg" />
                            </div>
                        ))}
                    </div>
                ) : users.length === 0 ? (
                    <div className="p-10 sm:p-16 text-center text-on-surface/50">
                        <div className="w-14 h-14 sm:w-16 sm:h-16 bg-outline-variant/10 rounded-full
                            flex items-center justify-center mx-auto mb-4">
                            <span className="material-symbols-outlined text-2xl sm:text-3xl">
                                person_search
                            </span>
                        </div>
                        <p className="font-headline font-bold text-on-surface mb-1">No users found</p>
                        <p className="text-sm">Try adjusting your search or filters.</p>
                    </div>
                ) : (
                    <>
                        {/* Table header — hidden on mobile, shown sm+ */}
                        <div className="hidden sm:grid sm:grid-cols-[2fr_2fr_1fr_1fr_auto] gap-4
                            px-6 py-3 border-b border-outline-variant/20 bg-surface-bright">
                            {['User', 'Email', 'Role', 'Status', ''].map((h, i) => (
                                <p key={i} className="font-label text-[10px] uppercase tracking-widest
                                    text-on-surface/50 font-bold">{h}</p>
                            ))}
                        </div>

                        <div className="divide-y divide-outline-variant/10">
                            {users.map((user) => (
                                <div key={user._id} className="group">

                                    {/* ── Desktop row (sm+) ── */}
                                    <div className="hidden sm:grid sm:grid-cols-[2fr_2fr_1fr_1fr_auto]
                                        gap-4 items-center px-6 py-4
                                        hover:bg-surface-bright transition-colors">
                                        {/* User */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div className="w-9 h-9 rounded-full bg-primary/10 text-primary
                                                flex items-center justify-center text-[12px] font-bold shrink-0">
                                                {initials(user.username)}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-body text-sm font-bold text-on-surface truncate">
                                                    {user.username}
                                                </p>
                                                <p className="font-body text-[10px] text-on-surface/50">
                                                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <p className="font-body text-sm text-on-surface/70 truncate">
                                            {user.email}
                                        </p>

                                        {/* Role */}
                                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg
                                            text-[10px] font-label font-bold uppercase tracking-wider
                                            border w-fit ${roleColor(user.role)}`}>
                                            {user.role}
                                        </span>

                                        {/* Status */}
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                                                user.isActive ? 'bg-green-500' : 'bg-outline-variant'
                                            }`} />
                                            <span className="font-label text-[11px] text-on-surface/60">
                                                {user.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </div>

                                        {/* Delete */}
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-500/10
                                                hover:text-red-500 flex items-center justify-center
                                                transition-colors opacity-0 group-hover:opacity-100"
                                            title="Delete user"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>

                                    {/* ── Mobile card (< sm) ── */}
                                    <div className="sm:hidden flex items-start gap-3 px-4 py-4
                                        hover:bg-surface-bright transition-colors">
                                        {/* Avatar */}
                                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary
                                            flex items-center justify-center text-[13px] font-bold shrink-0 mt-0.5">
                                            {initials(user.username)}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="font-body text-sm font-bold text-on-surface truncate">
                                                    {user.username}
                                                </p>
                                                <span className={`inline-flex items-center px-2 py-0.5
                                                    rounded-md text-[9px] font-label font-bold uppercase
                                                    tracking-wider border ${roleColor(user.role)}`}>
                                                    {user.role}
                                                </span>
                                            </div>
                                            <p className="font-body text-xs text-on-surface/60 truncate mt-0.5">
                                                {user.email}
                                            </p>
                                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                                                <div className="flex items-center gap-1">
                                                    <div className={`w-1.5 h-1.5 rounded-full ${
                                                        user.isActive ? 'bg-green-500' : 'bg-outline-variant'
                                                    }`} />
                                                    <span className="font-label text-[10px] text-on-surface/50">
                                                        {user.isActive ? 'Active' : 'Inactive'}
                                                    </span>
                                                </div>
                                                <span className="font-body text-[10px] text-on-surface/40">
                                                    Joined {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                        month: 'short', day: 'numeric', year: 'numeric'
                                                    })}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Delete — always visible on mobile */}
                                        <button
                                            onClick={() => handleDelete(user)}
                                            className="w-8 h-8 rounded-lg text-red-400 hover:bg-red-500/10
                                                hover:text-red-500 flex items-center justify-center
                                                transition-colors shrink-0"
                                            title="Delete user"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Pagination */}
            {!loading && pagination.pages > 1 && (
                <div className="flex items-center justify-between gap-4">
                    <p className="font-body text-xs text-on-surface/50">
                        Page {pagination.page} of {pagination.pages}
                    </p>
                    <div className="flex gap-2">
                        <button
                            disabled={pagination.page <= 1}
                            onClick={() => fetchUsers(pagination.page - 1)}
                            className="px-3 sm:px-4 py-2 rounded-xl border border-outline-variant/30
                                font-label text-[11px] uppercase tracking-wider font-bold
                                text-on-surface/60 hover:bg-surface-bright
                                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Previous
                        </button>
                        <button
                            disabled={pagination.page >= pagination.pages}
                            onClick={() => fetchUsers(pagination.page + 1)}
                            className="px-3 sm:px-4 py-2 rounded-xl border border-outline-variant/30
                                font-label text-[11px] uppercase tracking-wider font-bold
                                text-on-surface/60 hover:bg-surface-bright
                                disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            Next
                        </button>
                    </div>
                </div>
            )}
        </div>

        <ConfirmWindow {...modalProps} />
        </>
    );
};

export default AdminUserList;