import { useState } from 'react';
import { Sparkles, RefreshCw } from 'lucide-react';

const FinancialInsight = ({ insight, loading, selectedMonth, onRefresh }) => {
    const [refreshing, setRefreshing] = useState(false);

    const handleRefresh = async () => {
        if (refreshing) return;
        setRefreshing(true);
        try {
            await onRefresh?.(selectedMonth);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-blue-950 rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-blue-900 rounded w-28 mb-3" />
                <div className="space-y-2">
                    <div className="h-3 bg-blue-900 rounded w-full" />
                    <div className="h-3 bg-blue-900 rounded w-4/5" />
                    <div className="h-3 bg-blue-900 rounded w-3/5" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-blue-950 rounded-2xl p-5">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-800 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                    </div>
                    <span className="text-sm font-semibold text-white">AI Insight</span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-7 h-7 rounded-lg bg-blue-800 hover:bg-blue-700 flex items-center justify-center transition-colors duration-150"
                    title="Refresh insight"
                >
                    <RefreshCw
                        className={`w-3.5 h-3.5 text-blue-300 ${refreshing ? 'animate-spin' : ''}`}
                    />
                </button>
            </div>

            {/* Insight text */}
            {insight?.insight ? (
                <p className="text-sm text-blue-100 leading-relaxed">
                    {insight.insight}
                </p>
            ) : (
                <p className="text-sm text-blue-300 leading-relaxed">
                    Add some transactions to get a personalized financial tip from your AI advisor.
                </p>
            )}

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-blue-800/50">
                <p className="text-xs text-blue-400">
                    Powered by Gemini AI · {insight?.period || 'This month'}
                </p>
            </div>
        </div>
    );
};

export default FinancialInsight;