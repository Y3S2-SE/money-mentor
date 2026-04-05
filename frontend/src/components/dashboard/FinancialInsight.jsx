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
            <div className="bg-primary rounded-2xl p-5 animate-pulse">
                <div className="h-4 bg-white/10 rounded w-28 mb-3" />
                <div className="space-y-2">
                    <div className="h-3 bg-white/10 rounded w-full" />
                    <div className="h-3 bg-white/10 rounded w-4/5" />
                    <div className="h-3 bg-white/10 rounded w-3/5" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-primary rounded-2xl p-5 relative overflow-hidden">
            {/* Decorative elements matching PlayPage LevelProgressCard */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[80px] pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/3 rounded-tr-[60px] pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between mb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                        <Sparkles className="w-3.5 h-3.5 text-inverse-primary" />
                    </div>
                    <span className="text-sm font-headline font-bold text-on-primary">AI Insight</span>
                </div>
                <button
                    onClick={handleRefresh}
                    disabled={refreshing}
                    className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors duration-150"
                    title="Refresh insight"
                >
                    <RefreshCw className={`w-3.5 h-3.5 text-inverse-primary ${refreshing ? 'animate-spin' : ''}`} />
                </button>
            </div>

            {/* Insight text */}
            <div className="relative z-10">
                {insight?.insight ? (
                    <p className="text-sm font-body text-on-primary/80 leading-relaxed">
                        {insight.insight}
                    </p>
                ) : (
                    <p className="text-sm font-body text-inverse-primary leading-relaxed">
                        Add some transactions to get a personalized financial tip from your AI advisor.
                    </p>
                )}
            </div>

            {/* Footer */}
            <div className="mt-4 pt-3 border-t border-white/10 relative z-10">
                <p className="text-[10px] font-label font-bold text-inverse-primary/70 uppercase tracking-wider">
                    Powered by Gemini AI · {insight?.period || 'This month'}
                </p>
            </div>
        </div>
    );
};

export default FinancialInsight;