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
            <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-32 mb-6" />
                <div className="space-y-5">
                    {[...Array(2)].map((_, i) => (
                        <div key={i}>
                            <div className="h-3 bg-gray-100 rounded w-20 mb-2" />
                            <div className="h-2 bg-gray-100 rounded-full w-full mb-1" />
                            <div className="h-4 bg-gray-100 rounded w-24" />
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
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 font-body">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                <h3 className="text-base font-semibold text-gray-800 font-headline">Monthly Flow</h3>
                <div className="flex items-center gap-3 text-xs text-gray-400 font-label">
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-blue-950 inline-block" />
                        Credits
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                        Debits
                    </span>
                </div>
            </div>

            {/* Income bar */}
            <div className="mb-5">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-label">Income</span>
                    <div className="flex items-center gap-1">
                        <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                        <span className="text-sm font-bold text-gray-900 font-label">
                            {formatCurrency(summary.totalIncome)}
                        </span>
                    </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-blue-950 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${incomeWidth}%` }}
                    />
                </div>
            </div>

            {/* Expense bar */}
            <div className="mb-6">
                <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-label">Expenses</span>
                    <div className="flex items-center gap-1">
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-400" />
                        <span className="text-sm font-bold text-red-500 font-label">
                            {formatCurrency(summary.totalExpense)}
                        </span>
                    </div>
                </div>
                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-red-400 rounded-full transition-all duration-700 ease-out"
                        style={{ width: `${expenseWidth}%` }}
                    />
                </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-gray-50">
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-label">Savings Rate</p>
                    <p className="text-lg font-bold text-gray-900 font-headline">{summary.savingsRate}%</p>
                </div>
                <div className="min-w-0">
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-label">Top Spend</p>
                    <p className="text-lg font-bold text-gray-900 truncate font-headline">
                        {topCategory?.category || '—'}
                    </p>
                </div>
                <div>
                    <p className="text-xs text-gray-400 uppercase tracking-wider mb-1 font-label">Daily Avg</p>
                    <p className="text-lg font-bold text-gray-900 font-headline">
                        {formatCurrency(dailyAvg)}
                    </p>
                </div>
            </div>

            {/* Spending warning */}
            {summary.spendingWarning && (
                <div className="mt-4 p-3 bg-red-50 border border-red-100 rounded-xl">
                    <p className="text-xs text-red-600 font-medium">{summary.spendingWarning}</p>
                </div>
            )}
        </div>
    );
};

export default MonthlyFlow;