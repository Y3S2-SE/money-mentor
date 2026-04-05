import { ArrowUpRight, ArrowDownRight, Clock } from 'lucide-react';
import { format } from 'date-fns';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(amount);
};

const getCategoryInitial = (category) => {
    return category ? category.charAt(0).toUpperCase() : '?';
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

const RecentTransactions = ({ transactions, loading }) => {
    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30">
                <div className="h-4 bg-surface-variant rounded w-36 mb-4 animate-pulse" />
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 animate-pulse">
                            <div className="w-8 h-8 bg-surface-variant rounded-xl shrink-0" />
                            <div className="flex-1">
                                <div className="h-3 bg-surface-variant rounded w-24 mb-1" />
                                <div className="h-2.5 bg-surface-variant rounded w-16" />
                            </div>
                            <div className="h-3 bg-surface-variant rounded w-16" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 hover:border-outline-variant/50 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-surface-container-low border border-outline-variant/20 flex items-center justify-center">
                        <Clock className="w-3.5 h-3.5 text-on-surface-variant" />
                    </div>
                    <span className="text-sm font-headline font-bold text-on-surface">Recent Activity</span>
                </div>
                <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-low border border-outline-variant/20 px-2.5 py-1 rounded-full">Last 5</span>
            </div>

            {/* Transactions */}
            {!transactions || transactions.length === 0 ? (
                <div className="py-6 text-center text-sm font-body text-on-surface-variant">
                    No transactions yet
                </div>
            ) : (
                <div className="space-y-3">
                    {transactions.map((tx) => (
                        <div key={tx._id} className="flex items-center gap-3">
                            {/* Category avatar */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 ${getCategoryColor(tx.category)}`}>
                                {getCategoryInitial(tx.category)}
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <p className="text-xs font-body font-semibold text-on-surface truncate">
                                    {tx.category}
                                </p>
                                <p className="text-[10px] font-body text-on-surface-variant">
                                    {format(new Date(tx.date), 'MMM d')}
                                    {tx.description && ` · ${tx.description}`}
                                </p>
                            </div>

                            {/* Amount */}
                            <div className="flex items-center gap-1 shrink-0">
                                {tx.type === 'income'
                                    ? <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                                    : <ArrowDownRight className="w-3 h-3 text-error" />
                                }
                                <span className={`text-xs font-label font-bold ${
                                    tx.type === 'income' ? 'text-emerald-600' : 'text-error'
                                }`}>
                                    {formatCurrency(tx.amount)}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default RecentTransactions;