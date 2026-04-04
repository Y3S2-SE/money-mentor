import { TrendingUp, TrendingDown, Wallet, PiggyBank, Activity } from 'lucide-react';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 2,
    }).format(amount);
};

const getHealthColor = (score) => {
    if (score >= 70) return 'text-emerald-600';
    if (score >= 40) return 'text-amber-500';
    return 'text-red-500';
};

const getHealthLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
};

const getHealthBg = (score) => {
    if (score >= 70) return 'bg-emerald-50 border-emerald-100';
    if (score >= 40) return 'bg-amber-50 border-amber-100';
    return 'bg-red-50 border-red-100';
};

const SummaryCards = ({ summary, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                        <div className="h-4 bg-gray-100 rounded w-20 mb-3" />
                        <div className="h-7 bg-gray-100 rounded w-28 mb-2" />
                        <div className="h-3 bg-gray-100 rounded w-16" />
                    </div>
                ))}
            </div>
        );
    }

    if (!summary) return null;

    const cards = [
        {
            label: 'Total Income',
            value: formatCurrency(summary.totalIncome),
            icon: TrendingUp,
            iconBg: 'bg-emerald-50',
            iconColor: 'text-emerald-600',
            border: 'border-gray-100',
            sub: summary.savingsRate > 0 ? `${summary.savingsRate}% savings rate` : 'No savings this month',
            subColor: summary.savingsRate > 0 ? 'text-emerald-500' : 'text-gray-400',
        },
        {
            label: 'Total Expenses',
            value: formatCurrency(summary.totalExpense),
            icon: TrendingDown,
            iconBg: 'bg-red-50',
            iconColor: 'text-red-500',
            border: 'border-gray-100',
            sub: summary.spendingWarning ? 'Overspending warning' : 'Within budget',
            subColor: summary.spendingWarning ? 'text-red-500' : 'text-gray-400',
        },
        {
            label: 'Net Savings',
            value: formatCurrency(summary.netSavings),
            icon: PiggyBank,
            iconBg: summary.netSavings >= 0 ? 'bg-blue-50' : 'bg-red-50',
            iconColor: summary.netSavings >= 0 ? 'text-blue-600' : 'text-red-500',
            border: 'border-gray-100',
            sub: summary.netSavings >= 0 ? 'Positive balance' : 'Negative balance',
            subColor: summary.netSavings >= 0 ? 'text-blue-500' : 'text-red-500',
        },
        {
            label: 'Health Score',
            value: `${summary.financialHealthScore}/100`,
            icon: Activity,
            iconBg: getHealthBg(summary.financialHealthScore).split(' ')[0],
            iconColor: getHealthColor(summary.financialHealthScore),
            border: 'border-gray-100',
            sub: getHealthLabel(summary.financialHealthScore),
            subColor: getHealthColor(summary.financialHealthScore),
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className={`bg-white rounded-2xl p-4 sm:p-5 border ${card.border} hover:shadow-sm transition-shadow duration-200 flex flex-col justify-between`}
                    >
                        <div className="flex items-start justify-between mb-3 gap-2">
                            <span className="text-xs font-medium text-gray-400 uppercase tracking-wider font-label break-words">
                                {card.label}
                            </span>
                            <div className={`w-8 h-8 rounded-xl shrink-0 ${card.iconBg} flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${card.iconColor}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl sm:text-sm font-bold text-gray-900 mb-1 truncate font-headline">
                                {card.value}
                            </p>
                            <p className={`text-xs sm:text-sm font-medium ${card.subColor} font-body truncate`}>
                                {card.sub}
                            </p>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default SummaryCards;