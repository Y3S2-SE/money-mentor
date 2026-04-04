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
            <div className="bg-white border border-gray-100 rounded-xl shadow-lg p-3 text-xs font-body">
                <p className="font-semibold text-gray-800 mb-1 font-headline">{data.category}</p>
                <p className="text-gray-500 font-label">{formatCurrency(data.total)}</p>
                <p className="text-gray-400 font-label">{data.percentage}% of total</p>
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
            <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 animate-pulse font-body">
                <div className="h-5 bg-gray-100 rounded w-40 mb-6" />
                <div className="flex flex-col sm:flex-row gap-4">
                    <div className="w-36 h-36 bg-gray-100 rounded-full mx-auto sm:mx-0 shrink-0" />
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
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-gray-100 font-body">
            {/* Header */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 mb-5">
                <h3 className="text-base font-semibold text-gray-800 font-headline">Category Breakdown</h3>
                <div className="flex bg-gray-100 rounded-lg p-0.5 text-xs self-start font-label">
                    <button
                        onClick={() => handleTypeChange('expense')}
                        className={`px-3 py-1 rounded-md font-medium transition-all duration-150 ${
                            activeType === 'expense'
                                ? 'bg-white text-gray-800 shadow-sm font-semibold'
                                : 'text-gray-400'
                        }`}
                    >
                        Expenses
                    </button>
                    <button
                        onClick={() => handleTypeChange('income')}
                        className={`px-3 py-1 rounded-md font-medium transition-all duration-150 ${
                            activeType === 'income'
                                ? 'bg-white text-gray-800 shadow-sm font-semibold'
                                : 'text-gray-400'
                        }`}
                    >
                        Income
                    </button>
                </div>
            </div>

            {data.length === 0 ? (
                <div className="h-40 flex items-center justify-center text-sm text-gray-400 font-label">
                    No {activeType} data for this period
                </div>
            ) : (
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                    {/* Pie Chart */}
                    <div className="shrink-0 mx-auto sm:mx-0">
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
                    <div className="flex-1 space-y-2 w-full sm:w-auto min-w-0">
                        {data.slice(0, 6).map((item, index) => (
                            <div key={index} className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                    <span
                                        className="w-2.5 h-2.5 rounded-full shrink-0"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-xs text-gray-600 truncate font-label">{item.category}</span>
                                </div>
                                <span className="text-xs font-semibold text-gray-800 shrink-0 font-label">
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