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
        'bg-blue-100 text-blue-700',
        'bg-purple-100 text-purple-700',
        'bg-amber-100 text-amber-700',
        'bg-emerald-100 text-emerald-700',
        'bg-rose-100 text-rose-700',
        'bg-cyan-100 text-cyan-700',
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
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="p-4 space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-9 h-9 bg-gray-100 rounded-xl shrink-0" />
                            <div className="flex-1">
                                <div className="h-3 bg-gray-100 rounded w-32 mb-1.5" />
                                <div className="h-2.5 bg-gray-100 rounded w-20" />
                            </div>
                            <div className="h-3 bg-gray-100 rounded w-20" />
                            <div className="h-3 bg-gray-100 rounded w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!transactions || transactions.length === 0) {
        return (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
                <p className="text-gray-400 text-sm">No transactions found</p>
                <p className="text-gray-300 text-xs mt-1">Try adjusting your filters or add a new transaction</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden font-body">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-12 gap-3 px-5 py-3 border-b border-gray-50 bg-gray-50/50">
                <span className="col-span-4 text-xs font-medium text-gray-400 uppercase tracking-wider font-label">Transaction</span>
                <span className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wider font-label">Category</span>
                <span className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wider font-label">Date</span>
                <span className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wider font-label">Type</span>
                <span className="col-span-2 text-xs font-medium text-gray-400 uppercase tracking-wider text-right font-label">Amount</span>
            </div>

            {/* Rows */}
            <div className="divide-y divide-gray-50">
                {transactions.map((tx) => (
                    <div
                        key={tx._id}
                        className="grid grid-cols-12 gap-3 px-4 sm:px-5 py-3 sm:py-3.5 items-center hover:bg-gray-50/50 transition-colors duration-150 group"
                    >
                        {/* Description / category avatar */}
                        <div className="col-span-8 md:col-span-4 flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 font-headline ${getCategoryColor(tx.category)}`}>
                                {tx.category?.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate font-headline">
                                    {tx.description || tx.category}
                                </p>
                                <p className="text-xs text-gray-400 md:hidden font-label mt-0.5">
                                    {format(new Date(tx.date), 'MMM d, yyyy')} ·{' '}
                                    <span className={tx.type === 'income' ? 'text-emerald-500 font-medium' : 'text-red-400 font-medium'}>
                                        {tx.type}
                                    </span>
                                </p>
                            </div>
                        </div>

                        {/* Category badge */}
                        <div className="hidden md:flex col-span-2">
                            <span className={`px-2.5 py-1 rounded-lg text-xs font-medium ${getCategoryColor(tx.category)}`}>
                                {tx.category}
                            </span>
                        </div>

                        {/* Date */}
                        <div className="hidden md:block col-span-2">
                            <span className="text-xs text-gray-500">
                                {format(new Date(tx.date), 'MMM d, yyyy')}
                            </span>
                        </div>

                        {/* Type */}
                        <div className="hidden md:flex col-span-2 items-center gap-1">
                            {tx.type === 'income'
                                ? <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                                : <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                            }
                            <span className={`text-xs font-medium capitalize ${
                                tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                                {tx.type}
                            </span>
                        </div>

                        {/* Amount + actions */}
                        <div className="col-span-4 md:col-span-2 flex items-center justify-end gap-2">
                            <span className={`text-sm font-bold ${
                                tx.type === 'income' ? 'text-emerald-600' : 'text-red-500'
                            }`}>
                                {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>

                            {/* Action buttons */}
                            <div className="hidden group-hover:flex items-center gap-1 ml-1">
                                <button
                                    onClick={() => onEdit(tx)}
                                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-blue-50 flex items-center justify-center transition-colors duration-150"
                                >
                                    <Pencil className="w-3 h-3 text-gray-400 hover:text-blue-600" />
                                </button>
                                <button
                                    onClick={() => handleDelete(tx._id)}
                                    disabled={deletingId === tx._id}
                                    className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-red-50 flex items-center justify-center transition-colors duration-150"
                                >
                                    <Trash2 className="w-3 h-3 text-gray-400 hover:text-red-500" />
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
                <div className="flex items-center justify-between px-5 py-3 border-t border-gray-50 bg-gray-50/30">
                    <span className="text-xs text-gray-400">
                        {pagination.total} transactions · Page {pagination.page} of {pagination.totalPages}
                    </span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onRefresh?.(pagination.page - 1)}
                            disabled={pagination.page <= 1}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronLeft className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                        <button
                            onClick={() => onRefresh?.(pagination.page + 1)}
                            disabled={pagination.page >= pagination.totalPages}
                            className="w-7 h-7 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-150"
                        >
                            <ChevronRight className="w-3.5 h-3.5 text-gray-500" />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionList;