import { Search, X } from 'lucide-react';

const CURRENT_MONTH = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

const TransactionFilters = ({ filters, onChange, onReset }) => {
    const handleChange = (field, value) => {
        onChange({ ...filters, [field]: value, page: 1 });
    };

    const hasActiveFilters =
        filters.type ||
        filters.category ||
        (filters.month && filters.month !== CURRENT_MONTH());

    return (
        <div className="bg-white rounded-2xl p-4 border border-gray-100">
            <div className="flex flex-wrap items-center gap-3">

                {/* Month picker */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Month</label>
                    <input
                        type="month"
                        value={filters.month || CURRENT_MONTH()}
                        onChange={(e) => handleChange('month', e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950"
                    />
                </div>

                {/* Type filter */}
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-400">Type</label>
                    <select
                        value={filters.type || ''}
                        onChange={(e) => handleChange('type', e.target.value)}
                        className="text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950 bg-white"
                    >
                        <option value="">All types</option>
                        <option value="income">Income</option>
                        <option value="expense">Expense</option>
                    </select>
                </div>

                {/* Category search */}
                <div className="flex flex-col gap-1 flex-1 min-w-36">
                    <label className="text-xs text-gray-400">Category</label>
                    <div className="relative">
                        <Search className="w-3.5 h-3.5 text-gray-300 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                            type="text"
                            value={filters.category || ''}
                            onChange={(e) => handleChange('category', e.target.value)}
                            placeholder="Search category..."
                            className="w-full text-sm border border-gray-200 rounded-xl pl-8 pr-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950"
                        />
                    </div>
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                    <div className="flex flex-col gap-1">
                        <label className="text-xs text-transparent">Reset</label>
                        <button
                            onClick={onReset}
                            className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 border border-gray-200 rounded-xl px-3 py-2 transition-colors duration-150"
                        >
                            <X className="w-3.5 h-3.5" />
                            Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionFilters;