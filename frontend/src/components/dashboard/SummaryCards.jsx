import { TrendingUp, TrendingDown, PiggyBank, Activity } from 'lucide-react';

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
    return 'text-error';
};

const getHealthLabel = (score) => {
    if (score >= 70) return 'Excellent';
    if (score >= 40) return 'Fair';
    return 'Needs Work';
};

const SummaryCards = ({ summary, loading }) => {
    if (loading) {
        return (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 animate-pulse">
                        <div className="h-4 bg-surface-variant rounded w-20 mb-3" />
                        <div className="h-7 bg-surface-variant rounded w-28 mb-2" />
                        <div className="h-3 bg-surface-variant rounded w-16" />
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
            sub: summary.savingsRate > 0 ? `${summary.savingsRate}% savings rate` : 'No savings this month',
            subColor: summary.savingsRate > 0 ? 'text-emerald-600' : 'text-on-surface-variant',
        },
        {
            label: 'Total Expenses',
            value: formatCurrency(summary.totalExpense),
            icon: TrendingDown,
            iconBg: 'bg-error-container',
            iconColor: 'text-error',
            sub: summary.spendingWarning ? 'Overspending warning' : 'Within budget',
            subColor: summary.spendingWarning ? 'text-error' : 'text-on-surface-variant',
        },
        {
            label: 'Net Savings',
            value: formatCurrency(summary.netSavings),
            icon: PiggyBank,
            iconBg: summary.netSavings >= 0 ? 'bg-primary-fixed' : 'bg-error-container',
            iconColor: summary.netSavings >= 0 ? 'text-on-primary-fixed' : 'text-error',
            sub: summary.netSavings >= 0 ? 'Positive balance' : 'Negative balance',
            subColor: summary.netSavings >= 0 ? 'text-primary' : 'text-error',
        },
        {
            label: 'Health Score',
            value: `${summary.financialHealthScore}/100`,
            icon: Activity,
            iconBg: summary.financialHealthScore >= 70 ? 'bg-emerald-50' : summary.financialHealthScore >= 40 ? 'bg-amber-50' : 'bg-error-container',
            iconColor: getHealthColor(summary.financialHealthScore),
            sub: getHealthLabel(summary.financialHealthScore),
            subColor: getHealthColor(summary.financialHealthScore),
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            {cards.map((card, i) => {
                const Icon = card.icon;
                return (
                    <div
                        key={i}
                        className="bg-surface-container-lowest rounded-2xl p-3 sm:p-4 border border-outline-variant/30 hover:border-outline-variant/50 hover:shadow-md transition-all duration-200 flex flex-col justify-between"
                    >
                        <div className="flex items-start justify-between mb-3 gap-2">
                            <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-widest wrap-break-word">
                                {card.label}
                            </span>
                            <div className={`w-8 h-8 rounded-xl shrink-0 ${card.iconBg} flex items-center justify-center`}>
                                <Icon className={`w-4 h-4 ${card.iconColor}`} />
                            </div>
                        </div>
                        <div>
                            <p className="text-xl sm:text-sm font-headline font-bold text-on-surface mb-1 truncate">
                                {card.value}
                            </p>
                            <p className={`text-[10px] font-body font-medium ${card.subColor} truncate`}>
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