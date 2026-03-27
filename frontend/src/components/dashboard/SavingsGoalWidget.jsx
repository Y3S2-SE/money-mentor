import { useState } from 'react';
import { Target, Pencil, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { toast } from 'react-toastify';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-LK', {
        style: 'currency',
        currency: 'LKR',
        minimumFractionDigits: 0,
    }).format(amount);
};

const SavingsGoalWidget = ({ progress, loading, selectedMonth, onGoalUpdated }) => {
    const [showForm, setShowForm] = useState(false);
    const [goalAmount, setGoalAmount] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const hasGoal = !!progress;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!goalAmount || isNaN(goalAmount) || Number(goalAmount) <= 0) {
            toast.error('Please enter a valid goal amount');
            return;
        }
        setSubmitting(true);
        try {
            const data = { monthlyGoal: Number(goalAmount), month: selectedMonth };
            if (hasGoal) {
                await dashboardService.updateSavingsGoal(data);
                toast.success('Savings goal updated!');
            } else {
                await dashboardService.createSavingsGoal(data);
                toast.success('Savings goal created!');
            }
            setShowForm(false);
            setGoalAmount('');
            onGoalUpdated?.();
        } catch (err) {
            const msg = err.response?.data?.message || 'Failed to save goal';
            toast.error(msg);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white rounded-2xl p-5 border border-gray-100 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-32 mb-4" />
                <div className="h-2 bg-gray-100 rounded-full mb-3" />
                <div className="h-3 bg-gray-100 rounded w-24" />
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-blue-950" />
                    </div>
                    <span className="text-sm font-semibold text-gray-800">Savings Goal</span>
                </div>
                <button
                    onClick={() => {
                        setGoalAmount(progress?.goal ? String(progress.goal) : '');
                        setShowForm(!showForm);
                    }}
                    className="w-7 h-7 rounded-lg bg-gray-50 hover:bg-gray-100 flex items-center justify-center transition-colors duration-150"
                >
                    {hasGoal
                        ? <Pencil className="w-3.5 h-3.5 text-gray-400" />
                        : <Plus className="w-3.5 h-3.5 text-gray-400" />
                    }
                </button>
            </div>

            {/* Goal form */}
            {showForm && (
                <form onSubmit={handleSubmit} className="mb-4">
                    <div className="flex gap-2">
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={goalAmount}
                            onChange={(e) => setGoalAmount(e.target.value)}
                            placeholder="Enter goal amount (LKR)"
                            className="flex-1 text-sm border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-blue-950 text-white text-sm font-medium rounded-xl hover:bg-blue-900 transition-colors duration-150 disabled:opacity-60"
                        >
                            {submitting ? '...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            {/* No goal state */}
            {!hasGoal && !showForm && (
                <div className="text-center py-4">
                    <p className="text-sm text-gray-400 mb-2">No savings goal set for this month</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-sm text-blue-950 font-medium hover:underline"
                    >
                        Set a goal →
                    </button>
                </div>
            )}

            {/* Goal progress */}
            {hasGoal && !showForm && (
                <>
                    {/* Amount info */}
                    <div className="flex items-end justify-between mb-2">
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5">Saved so far</p>
                            <p className="text-lg font-bold text-gray-900">
                                {formatCurrency(progress.saved)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-xs text-gray-400 mb-0.5">Goal</p>
                            <p className="text-sm font-semibold text-gray-600">
                                {formatCurrency(progress.goal)}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                                progress.achieved ? 'bg-emerald-500' : 'bg-blue-950'
                            }`}
                            style={{ width: `${Math.min(100, progress.percentage)}%` }}
                        />
                    </div>

                    {/* Percentage + remaining */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-600">
                            {progress.percentage}%
                        </span>
                        {!progress.achieved && (
                            <span className="text-xs text-gray-400">
                                {formatCurrency(progress.remaining)} remaining
                            </span>
                        )}
                    </div>

                    {/* Warning / success */}
                    {progress.warning && (
                        <div className={`mt-3 flex items-start gap-2 p-2.5 rounded-xl text-xs ${
                            progress.achieved
                                ? 'bg-emerald-50 text-emerald-700'
                                : 'bg-amber-50 text-amber-700'
                        }`}>
                            {progress.achieved
                                ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                                : <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                            }
                            <span>{progress.warning}</span>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default SavingsGoalWidget;