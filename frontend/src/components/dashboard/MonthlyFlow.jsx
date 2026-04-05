import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(amount);
};

const MonthlyFlow = ({ summary, categoryBreakdown, loading }) => {
    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 animate-pulse">
                <div className="h-5 bg-surface-variant rounded w-32 mb-6" />
                <div className="space-y-5">
                    {[...Array(2)].map((_, i) => (
                        <div key={i}>
                            <div className="h-3 bg-surface-variant rounded w-20 mb-2" />
                            <div className="h-2 bg-surface-variant rounded-full w-full mb-1" />
                            <div className="h-4 bg-surface-variant rounded w-24" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!summary) return null;

    const max = Math.max(summary.totalIncome, summary.totalExpense) || 1;
    const incomeWidth = (summary.totalIncome / max) * 100;
    const expenseWidth = (summary.totalExpense / max) * 100;

    const topCategory = categoryBreakdown?.breakdown?.[0];

    const dailyAvg = summary.totalExpense > 0
        ? summary.totalExpense / new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
        : 0;

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-4 sm:p-6 border border-outline-variant/30 font-body hover:border-outline-variant/50 transition-all">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h3 className="text-sm font-headline font-bold text-on-surface">Monthly Flow</h3>
                <div className="flex items-center gap-3 text-[10px] text-on-surface-variant font-label font-bold uppercase tracking-wider">
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-primary inline-block" />
                        Credits
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-error inline-block" />
                        Debits
                    </span>
                </div>
            </div>

            {/* Income bar */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Income</span>
                    <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm font-headline font-bold text-on-surface">
                            {formatCurrency(summary.totalIncome)}
                        </span>
                    </div>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${incomeWidth}%` }}
                    />
                </div>
            </div>

            {/* Expense bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest">Expenses</span>
                    <div className="flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5 text-error" />
                        <span className="text-sm font-headline font-bold text-error">
                            {formatCurrency(summary.totalExpense)}
                        </span>
                    </div>
                </div>
                <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden">
                    <div
                        className="h-full bg-error rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${expenseWidth}%` }}
                    />
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-outline-variant/20">
                <div>
                    <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1">Savings Rate</p>
                    <p className="text-lg font-headline font-bold text-on-surface">{summary.savingsRate}%</p>
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1">Top Spend</p>
                    <p className="text-lg font-headline font-bold text-on-surface truncate">
                        {topCategory?.category || '—'}
                    </p>
                </div>
                <div>
                    <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest mb-1">Daily Avg</p>
                    <p className="text-lg font-headline font-bold text-on-surface">
                        {formatCurrency(dailyAvg)}
                    </p>
                </div>
            </div>

            {/* Spending warning */}
            {summary.spendingWarning && (
                <div className="mt-4 p-3 bg-error-container border border-error/20 rounded-xl">
                    <p className="text-xs font-body font-medium text-on-error-container">{summary.spendingWarning}</p>
                </div>
            )}
        </div>
    );
};

export default MonthlyFlow;