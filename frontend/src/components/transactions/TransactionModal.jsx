import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import transactionService from '../../services/transactionService';
import { useDispatch } from 'react-redux';
import { addToast } from '../../store/slices/toastSlice';

const INCOME_CATEGORIES = [
    'Salary', 'Freelance', 'Business', 'Investment', 'Gift', 'Other'
];

const EXPENSE_CATEGORIES = [
    'Food', 'Transport', 'Housing', 'Utilities', 'Healthcare',
    'Education', 'Shopping', 'Entertainment', 'Savings', 'Other'
];

const TODAY = format(new Date(), 'yyyy-MM-dd');

const defaultForm = {
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: TODAY,
};

const TransactionModal = ({ isOpen, onClose, transaction, onSuccess }) => {
    const [form, setForm] = useState(defaultForm);
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const dispatch = useDispatch();

    const isEdit = !!transaction;

    useEffect(() => {
        if (transaction) {
            setForm({
                type: transaction.type,
                amount: String(transaction.amount),
                category: transaction.category,
                description: transaction.description || '',
                date: format(new Date(transaction.date), 'yyyy-MM-dd'),
            });
        } else {
            setForm(defaultForm);
        }
        setErrors({});
    }, [transaction, isOpen]);

    if (!isOpen) return null;

    const categories = form.type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

    const validate = () => {
        const e = {};
        if (!form.type) e.type = 'Type is required';
        if (!form.amount || isNaN(form.amount) || Number(form.amount) <= 0)
            e.amount = 'Enter a valid amount';
        if (!form.category) e.category = 'Category is required';
        if (!form.date) e.date = 'Date is required';
        return e;
    };

    const handleChange = (field, value) => {
        setForm((prev) => {
            const updated = { ...prev, [field]: value };
            if (field === 'type') updated.category = '';
            return updated;
        });
        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const validationErrors = validate();
        if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
            return;
        }

        setLoading(true);
        try {
            const payload = {
                type: form.type,
                amount: Number(form.amount),
                category: form.category,
                description: form.description,
                date: form.date,
            };

            if (isEdit) {
                await transactionService.updateTransaction(transaction._id, payload);
                dispatch(addToast({
                    type: 'success',
                    message: 'Transaction updated successfully'
                }));
            } else {
                await transactionService.createTransaction(payload);
                dispatch(addToast({
                    type: 'success',
                    message: 'Transaction added successfully'
                }));
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            dispatch(addToast({
                type: 'error',
                message: err.response?.data?.message || 'Something went wrong'
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div
                className="relative bg-surface-container-lowest rounded-3xl shadow-2xl shadow-primary/5 w-full max-w-md z-10 overflow-hidden border border-outline-variant/20"
                style={{ animation: 'scaleIn 0.2s ease forwards' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-outline-variant/20">
                    <h2 className="text-base font-headline font-bold text-on-surface">
                        {isEdit ? 'Edit Transaction' : 'Add Transaction'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex items-center justify-center transition-colors duration-150"
                    >
                        <X className="w-4 h-4 text-on-surface-variant" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Type toggle */}
                    <div>
                        <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Type</label>
                        <div className="flex bg-surface-container-low rounded-xl p-1 border border-outline-variant/20">
                            {['expense', 'income'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleChange('type', t)}
                                    className={`flex-1 py-2 text-xs font-label font-bold uppercase tracking-wider rounded-lg transition-all duration-150 ${
                                        form.type === t
                                            ? t === 'expense'
                                                ? 'bg-error-container text-error shadow-sm'
                                                : 'bg-emerald-50 text-emerald-700 shadow-sm'
                                            : 'text-on-surface-variant hover:text-on-surface'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {errors.type && <p className="text-xs font-body text-error mt-1">{errors.type}</p>}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Amount (LKR)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            placeholder="0.00"
                            className={`w-full text-sm font-body border rounded-xl px-3 py-2.5 bg-surface-bright text-on-surface
                                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                                errors.amount ? 'border-error/50 bg-error-container/10' : 'border-outline-variant/30'
                            }`}
                        />
                        {errors.amount && <p className="text-xs font-body text-error mt-1">{errors.amount}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Category</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleChange('category', cat)}
                                    className={`px-3 py-1.5 text-[10px] font-label font-bold uppercase tracking-wider rounded-lg border transition-all duration-150 ${
                                        form.category === cat
                                            ? 'bg-primary text-on-primary border-primary shadow-sm'
                                            : 'bg-surface-container-low text-on-surface-variant border-outline-variant/30 hover:border-outline-variant/60 hover:text-on-surface'
                                    }`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <input
                            type="text"
                            value={form.category}
                            onChange={(e) => handleChange('category', e.target.value)}
                            placeholder="Or type a custom category..."
                            className={`w-full text-sm font-body border rounded-xl px-3 py-2.5 bg-surface-bright text-on-surface
                                placeholder:text-on-surface/40 focus:outline-none focus:ring-2 focus:ring-primary/20
                                focus:border-primary transition-all ${
                                errors.category ? 'border-error/50 bg-error-container/10' : 'border-outline-variant/30'
                            }`}
                        />
                        {errors.category && <p className="text-xs font-body text-error mt-1">{errors.category}</p>}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">Date</label>
                        <input
                            type="date"
                            value={form.date}
                            max={TODAY}
                            onChange={(e) => handleChange('date', e.target.value)}
                            className={`w-full text-sm font-body border rounded-xl px-3 py-2.5 bg-surface-bright text-on-surface
                                focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all ${
                                errors.date ? 'border-error/50 bg-error-container/10' : 'border-outline-variant/30'
                            }`}
                        />
                        {errors.date && <p className="text-xs font-body text-error mt-1">{errors.date}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1.5 block">
                            Description <span className="text-on-surface-variant/40 normal-case tracking-normal font-body font-normal text-xs">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add a note..."
                            className="w-full text-sm font-body border border-outline-variant/30 bg-surface-bright text-on-surface
                                placeholder:text-on-surface/40 rounded-xl px-3 py-2.5 focus:outline-none
                                focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-primary text-on-primary text-xs font-label font-bold uppercase tracking-widest rounded-xl hover:bg-primary/90 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 mt-2 shadow-sm"
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            : isEdit ? 'Update Transaction' : 'Add Transaction'
                        }
                    </button>
                </form>
            </div>

            <style>{`
                @keyframes scaleIn {
                    from { opacity: 0; transform: scale(0.96) translateY(8px); }
                    to   { opacity: 1; transform: scale(1)    translateY(0); }
                }
            `}</style>
        </div>
    );
};

export default TransactionModal;