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
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-700 mb-2">{formatMonth(label)} {label?.split('-')[0]}</p>
                {payload.map((entry, i) => (
                    <div key={i} className="flex items-center gap-2 mb-1">
                        <span
                            className="w-2 h-2 rounded-full inline-block"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-gray-500 capitalize">{entry.name}:</span>
                        <span className="font-semibold text-gray-800">
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
            <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-36 mb-6" />
                <div className="h-48 bg-gray-50 rounded-xl" />
            </div>
        );
    }

    if (!trends || trends.length === 0) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100">
                <h3 className="text-base font-semibold text-gray-800 mb-4">6-Month Trends</h3>
                <div className="h-48 flex items-center justify-center text-sm text-gray-400">
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
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-semibold text-gray-800">6-Month Trends</h3>
                <span className="text-xs text-gray-400">Last 6 months</span>
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                    <XAxis
                        dataKey="label"
                        tick={{ fontSize: 11, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                    />
                    <YAxis
                        tickFormatter={formatCurrency}
                        tick={{ fontSize: 10, fill: '#9ca3af' }}
                        axisLine={false}
                        tickLine={false}
                        width={60}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="income"
                        stroke="#1e3a5f"
                        strokeWidth={2}
                        fill="url(#incomeGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#1e3a5f' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="expense"
                        stroke="#f87171"
                        strokeWidth={2}
                        fill="url(#expenseGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#f87171' }}
                    />
                    <Area
                        type="monotone"
                        dataKey="savings"
                        stroke="#10b981"
                        strokeWidth={2}
                        fill="url(#savingsGrad)"
                        dot={false}
                        activeDot={{ r: 4, fill: '#10b981' }}
                    />
                    <Legend
                        iconType="circle"
                        iconSize={8}
                        wrapperStyle={{ fontSize: '11px', paddingTop: '12px' }}
                        formatter={(value) => (
                            <span style={{ color: '#6b7280', textTransform: 'capitalize' }}>{value}</span>
                        )}
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};

export default MonthlyTrendsChart;