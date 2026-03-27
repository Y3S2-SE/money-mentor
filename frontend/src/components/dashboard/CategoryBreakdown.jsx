import { useState } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = [
    '#1e3a5f', '#3b82f6', '#60a5fa', '#93c5fd',
    '#bfdbfe', '#f87171', '#fb923c', '#fbbf24',
];

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        const data = payload[0].payload;
        return (
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs">
                <p className="font-semibold text-gray-800 mb-1">{data.category}</p>
                <p className="text-gray-500">{formatCurrency(data.total)}</p>
                <p className="text-gray-400">{data.percentage}% of total</p>
            </div>
        );
    }
    return null;
};

const CategoryBreakdown = ({ breakdown, loading, onTypeChange }) => {
    const [activeType, setActiveType] = useState('expense');

    const handleTypeChange = (type) => {
        setActiveType(type);
        onTypeChange?.(type);
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-6 border border-gray-100 animate-pulse">
                <div className="h-5 bg-gray-100 rounded w-40 mb-6" />
                <div className="flex gap-4">
                    <div className="w-36 h-36 bg-gray-100 rounded-full" />
                    <div className="flex-1 space-y-2">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-3 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    const data = breakdown?.breakdown || [];

    return (
        <div className="bg-white rounded-2xl p-6 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-800">Category Breakdown</h3>
                <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs">
                    <button
                        onClick={() => handleTypeChange('expense')}
                        className={`px-3 py-1 rounded-md font-medium transition-all duration-150 ${
                            activeType === 'expense'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-400'
                        }`}
                    >
                        Expenses
                    </button>
                    <button
                        onClick={() => handleTypeChange('income')}
                        className={`px-3 py-1 rounded-md font-medium transition-all duration-150 ${
                            activeType === 'income'
                                ? 'bg-white text-gray-800 shadow-sm'
                                : 'text-gray-400'
                        }`}
                    >
                        Income
                    </button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400">
                    No {activeType} data for this period
                </div>
            ) : (
                <div className="flex items-center gap-4">
                    {/* Pie Chart */}
                    <div className="shrink-0">
                        <ResponsiveContainer width={140} height={140}>
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={42}
                                    outerRadius={62}
                                    paddingAngle={2}
                                    dataKey="total"
                                >
                                    {data.map((_, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={COLORS[index % COLORS.length]}
                                        />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Legend */}
                    <div className="flex-1 space-y-2 min-w-0">
                        {data.slice(0, 6).map((item, index) => (
                            <div key={index} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-xs text-gray-600 truncate">{item.category}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-800 shrink-0">
                                    {item.percentage}%
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default CategoryBreakdown;