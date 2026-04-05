import { useState } from 'react';
import { Target, Pencil, Plus, CheckCircle2, AlertCircle } from 'lucide-react';
import dashboardService from '../../services/dashboardService';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/toastSlice';

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
    const dispatch = useDispatch();

    const hasGoal = !!progress;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!goalAmount || isNaN(goalAmount) || Number(goalAmount) <= 0) {
            dispatch(addToast({
                type: 'error',
                message: 'Please enter a valid goal amount'
            }));
            return;
        }
        setSubmitting(true);
        try {
            const data = { monthlyGoal: Number(goalAmount), month: selectedMonth };
            if (hasGoal) {
                await dashboardService.updateSavingsGoal(data);
                dispatch(addToast({
                    type: 'success',
                    message: 'Savings goal updated!'
                }));
            } else {
                await dashboardService.createSavingsGoal(data);
                dispatch(addToast({
                    type: 'success',
                    message: 'Savings goal created!'
                }));
            }
            setShowForm(false);
            setGoalAmount('');
            onGoalUpdated?.();
        } catch (err) {
            dispatch(addToast({
                type: 'success',
                message: err.response?.data?.message || 'Failed to save goal'
            }));
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 animate-pulse">
                <div className="h-4 bg-surface-variant rounded w-32 mb-4" />
                <div className="h-2 bg-surface-variant rounded-full mb-3" />
                <div className="h-3 bg-surface-variant rounded w-24" />
            </div>
        );
    }

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 hover:border-outline-variant/50 transition-all">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center">
                        <Target className="w-3.5 h-3.5 text-on-primary-fixed" />
                    </div>
                    <span className="text-sm font-headline font-bold text-on-surface">Savings Goal</span>
                </div>
                <button
                    onClick={() => {
                        setGoalAmount(progress?.goal ? String(progress.goal) : '');
                        setShowForm(!showForm);
                    }}
                    className="w-7 h-7 rounded-lg bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex items-center justify-center transition-colors duration-150"
                >
                    {hasGoal
                        ? <Pencil className="w-3.5 h-3.5 text-on-surface-variant" />
                        : <Plus className="w-3.5 h-3.5 text-on-surface-variant" />
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
                            className="flex-1 text-sm border border-outline-variant/30 bg-surface-bright rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
                        />
                        <button
                            type="submit"
                            disabled={submitting}
                            className="px-4 py-2 bg-primary text-on-primary text-sm font-label font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors duration-150 disabled:opacity-60"
                        >
                            {submitting ? '...' : 'Save'}
                        </button>
                    </div>
                </form>
            )}

            {/* No goal state */}
            {!hasGoal && !showForm && (
                <div className="text-center py-4">
                    <p className="text-sm font-body text-on-surface-variant mb-2">No savings goal set for this month</p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="text-sm font-label font-bold text-primary hover:underline"
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
                            <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Saved so far</p>
                            <p className="text-lg font-headline font-bold text-on-surface">
                                {formatCurrency(progress.saved)}
                            </p>
                        </div>
                        <div className="text-right">
                            <p className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-0.5">Goal</p>
                            <p className="text-sm font-headline font-semibold text-on-surface-variant">
                                {formatCurrency(progress.goal)}
                            </p>
                        </div>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-2 bg-surface-container-high rounded-full overflow-hidden mb-2">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ease-out ${
                                progress.achieved ? 'bg-emerald-500' : 'bg-primary'
                            }`}
                            style={{ width: `${Math.min(100, progress.percentage)}%` }}
                        />
                    </div>

                    {/* Percentage + remaining */}
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-label font-bold text-on-surface">
                            {progress.percentage}%
                        </span>
                        {!progress.achieved && (
                            <span className="text-[10px] font-body text-on-surface-variant">
                                {formatCurrency(progress.remaining)} remaining
                            </span>
                        )}
                    </div>

                    {/* Warning / success */}
                    {progress.warning && (
                        <div className={`mt-3 flex items-start gap-2 p-2.5 rounded-xl text-xs font-body ${
                            progress.achieved
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                : 'bg-amber-50 text-amber-700 border border-amber-100'
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