import { useState } from 'react';
import { Pencil, Trash2, ArrowUpRight, ArrowDownRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import transactionService from '../../services/transactionService';
import { toast } from 'react-toastify';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(amount);
};

const getCategoryColor = (category) => {
    const colors = [
        'bg-primary-fixed text-on-primary-fixed',
        'bg-secondary-fixed text-on-secondary-fixed',
        'bg-tertiary-fixed text-on-tertiary-fixed',
        'bg-emerald-50 text-emerald-700',
        'bg-amber-50 text-amber-700',
        'bg-cyan-50 text-cyan-700',
    ];
    const index = category ? category.charCodeAt(0) % colors.length : 0;
    return colors[index];
};

const TransactionList = ({ transactions, pagination, loading, onEdit, onRefresh }) => {
    const [deletingId, setDeletingId] = useState(null);

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this transaction?')) return;
        setDeletingId(id);
        try {
            await transactionService.deleteTransaction(id);
            toast.success('Transaction deleted');
            onRefresh?.();
        } catch (err) {
            toast.error('Failed to delete transaction');
        } finally {
            setDeletingId(null);
        }
    };

    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden">
                <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-9 h-9 bg-surface-variant rounded-xl shrink-0" />
                            <div className="flex-1">
                                <div className="h-3 bg-surface-variant rounded w-32 mb-1.5" />
                                <div className="h-2.5 bg-surface-variant rounded w-20" />
                            </div>
                            <div className="h-3 bg-surface-variant rounded w-20" />
                            <div className="h-3 bg-surface-variant rounded w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-12 text-center">
                <div className="w-12 h-12 bg-surface-container-low rounded-2xl flex items-center justify-center mx-auto mb-4 border border-outline-variant/20">
                    <span className="material-symbols-outlined text-[24px] text-on-surface-variant/40">receipt_long</span>
                </div>
                <p className="font-body text-sm font-semibold text-on-surface-variant">No transactions found</p>
                <p className="font-body text-xs text-on-surface-variant/60 mt-1">Try adjusting your filters or add a new transaction</p>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden font-body">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-outline-variant/20 bg-surface-container-low/50">
                <span className="col-span-4 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Transaction</span>
                <span className="col-span-2 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Category</span>
                <span className="col-span-2 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Date</span>
                <span className="col-span-2 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Type</span>
                <span className="col-span-2 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest text-right">Amount</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-outline-variant/10">
                {transactions.map((tx) => (
                    <div
                        key={tx._id}
                        className="grid grid-cols-12 gap-3 px-4 sm:px-5 py-3 sm:py-3.5 items-center hover:bg-surface-container-low/40 transition-colors duration-150 group"
                    >
                        {/* Description / category avatar */}
                        <div className="col-span-8 md:col-span-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-headline font-bold shrink-0 ${getCategoryColor(tx.category)}`}>
                                {tx.category?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-headline font-semibold text-on-surface truncate">
                                    {tx.description || tx.category}
                                </p>
                                <p className="text-[10px] font-body text-on-surface-variant md:hidden mt-0.5">
                                    {format(new Date(tx.date), 'MMM d, yyyy')} ·{' '}
                                    <span className={tx.type === 'income' ? 'text-emerald-600 font-semibold' : 'text-error font-semibold'}>
                                        {tx.type}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Category badge */}
                        <div className="hidden md:flex col-span-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-label font-bold ${getCategoryColor(tx.category)}`}>
                                {tx.category}
                            </span>
                        </div>

                        {/* Date */}
                        <div className="hidden md:block col-span-2">
                            <span className="text-xs font-body text-on-surface-variant">
                                {format(new Date(tx.date), 'MMM d, yyyy')}
                            </span>
                        </div>

                        {/* Type */}
                        <div className="hidden md:flex col-span-2 items-center gap-1">
                            {tx.type === 'income'
                                ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                : <ArrowDownRight className="w-3.5 h-3.5 text-error" />
                            }
                            <span className={`text-xs font-label font-bold capitalize ${
                                tx.type === 'income' ? 'text-emerald-600' : 'text-error'
                            }`}>
                                {tx.type}
                            </span>
                        </div>

                        {/* Amount + actions */}
                        <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2">
                            <span className={`text-sm font-headline font-bold ${
                                tx.type === 'income' ? 'text-emerald-600' : 'text-error'
                            }`}>
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>

                            {/* Action buttons */}
                            <div className="hidden group-hover:flex items-center gap-1 ml-1">
                                <button
                                    onClick={() => onEdit(tx)}
                                    className="w-7 h-7 rounded-lg bg-surface-container-low hover:bg-primary-fixed border border-outline-variant/20 flex items-center justify-center transition-colors duration-150"
                                >
                                    <Pencil className="w-3 h-3 text-on-surface-variant hover:text-on-primary-fixed" />
                                </button>
                                <button
                                    onClick={() => handleDelete(tx._id)}
                                    disabled={deletingId === tx._id}
                                    className="w-7 h-7 rounded-lg bg-surface-container-low hover:bg-error-container border border-outline-variant/20 flex items-center justify-center transition-colors duration-150"
                                >
                                    <Trash2 className="w-3 h-3 text-on-surface-variant hover:text-error" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-outline-variant/20 bg-surface-container-low/30">
                    <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider">
                        {pagination.total} transactions · Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onRefresh?.(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="w-7 h-7 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 text-on-surface-variant" />
                        </button>
                        <button
                            onClick={() => onRefresh?.(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="w-7 h-7 rounded-lg bg-surface-container-lowest border border-outline-variant/30 flex items-center justify-center hover:bg-surface-container-low disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronRight className="w-3.5 h-3.5 text-on-surface-variant" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionList;