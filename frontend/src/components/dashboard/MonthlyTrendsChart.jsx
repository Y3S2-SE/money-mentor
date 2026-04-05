import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts';
import { format, parseISO } from 'date-fns';

const formatMonth = (monthStr) => {
    try {
        return format(parseISO(`${monthStr}-01`), 'MMM');
    } catch {
        return monthStr;
    }
};

const formatCurrency = (value) => {
    if (value >= 1000) return `LKR ${(value / 1000).toFixed(1)}k`;
    return `LKR ${value}`;
};

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-lg p-3 text-xs font-body">
                <p className="font-headline font-semibold text-on-surface mb-2">{formatMonth(label)} {label?.split('-')[0]}</p>
                {payload.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                        <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-on-surface-variant capitalize">{entry.name}:</span>
                        <span className="font-semibold text-on-surface">
                            LKR {entry.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

const MonthlyTrendsChart = ({ trends, loading }) => {
    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 animate-pulse">
                <div className="h-5 bg-surface-variant rounded w-36 mb-6" />
                <div className="h-48 bg-surface-container-low rounded-xl" />
            </div>
        );
    }

    if (!trends || trends.length === 0) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30">
                <h3 className="text-sm font-headline font-bold text-on-surface mb-4">6-Month Trends</h3>
                <div className="h-48 flex items-center justify-center text-sm font-body text-on-surface-variant">
                    No trend data available yet
                </div>
            </div>
        );
    }

    const chartData = trends.map((item) => ({
        ...item,
        month: item.month,
        label: formatMonth(item.month),
    }));

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-6 border border-outline-variant/30 hover:border-outline-variant/50 transition-all">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-sm font-headline font-bold text-on-surface">6-Month Trends</h3>
                <span className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider bg-surface-container-low border border-outline-variant/20 px-2.5 py-1 rounded-full">Last 6 months</span>
            </div>

            <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={chartData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                    <defs>
                        <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1e3a5f" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#1e3a5f" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#f87171" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="savingsGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.15} />
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: 'var(--color-on-surface-variant, #6b7280)' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant, #6b7280)' }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="income" stroke="#1e3a5f" strokeWidth={2} fill="url(#incomeGrad)" dot={false} activeDot={{ r: 4, fill: '#1e3a5f' }} />
                    <Area type="monotone" dataKey="expense" stroke="#f87171" strokeWidth={2} fill="url(#expenseGrad)" dot={false} activeDot={{ r: 4, fill: '#f87171' }} />
                    <Area type="monotone" dataKey="savings" stroke="#10b981" strokeWidth={2} fill="url(#savingsGrad)" dot={false} activeDot={{ r: 4, fill: '#10b981' }} />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                        formatter={(value) => (
                            <span style={{ color: 'var(--color-on-surface-variant, #6b7280)', textTransform: 'capitalize' }}>{value}</span>
                        )}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyTrendsChart;