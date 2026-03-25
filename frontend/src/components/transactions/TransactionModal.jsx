import { useState, useEffect } from 'react';
import { X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import transactionService from '../../services/transactionService';
import { toast } from 'react-toastify';

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
                toast.success('Transaction updated successfully');
            } else {
                await transactionService.createTransaction(payload);
                toast.success('Transaction added successfully');
            }

            onSuccess?.();
            onClose();
        } catch (err) {
            const msg = err.response?.data?.message || 'Something went wrong';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/30 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-md z-10 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-gray-50">
                    <h2 className="text-base font-semibold text-gray-900">
                        {isEdit ? 'Edit Transaction' : 'Add Transaction'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors duration-150"
                    >
                        <X className="w-4 h-4 text-gray-500" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                    {/* Type toggle */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Type</label>
                        <div className="flex bg-gray-100 rounded-xl p-1">
                            {['expense', 'income'].map((t) => (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => handleChange('type', t)}
                                    className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-150 capitalize ${
                                        form.type === t
                                            ? t === 'expense'
                                                ? 'bg-white text-red-500 shadow-sm'
                                                : 'bg-white text-emerald-600 shadow-sm'
                                            : 'text-gray-400'
                                    }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                        {errors.type && <p className="text-xs text-red-500 mt-1">{errors.type}</p>}
                    </div>

                    {/* Amount */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Amount (LKR)</label>
                        <input
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={form.amount}
                            onChange={(e) => handleChange('amount', e.target.value)}
                            placeholder="0.00"
                            className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950 ${
                                errors.amount ? 'border-red-300' : 'border-gray-200'
                            }`}
                        />
                        {errors.amount && <p className="text-xs text-red-500 mt-1">{errors.amount}</p>}
                    </div>

                    {/* Category */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Category</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    type="button"
                                    onClick={() => handleChange('category', cat)}
                                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-all duration-150 ${
                                        form.category === cat
                                            ? 'bg-blue-950 text-white border-blue-950'
                                            : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
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
                            className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950 ${
                                errors.category ? 'border-red-300' : 'border-gray-200'
                            }`}
                        />
                        {errors.category && <p className="text-xs text-red-500 mt-1">{errors.category}</p>}
                    </div>

                    {/* Date */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">Date</label>
                        <input
                            type="date"
                            value={form.date}
                            max={TODAY}
                            onChange={(e) => handleChange('date', e.target.value)}
                            className={`w-full text-sm border rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950 ${
                                errors.date ? 'border-red-300' : 'border-gray-200'
                            }`}
                        />
                        {errors.date && <p className="text-xs text-red-500 mt-1">{errors.date}</p>}
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-xs text-gray-400 mb-1.5 block">
                            Description <span className="text-gray-300">(optional)</span>
                        </label>
                        <input
                            type="text"
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            placeholder="Add a note..."
                            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-950/20 focus:border-blue-950"
                        />
                    </div>

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-blue-950 text-white text-sm font-semibold rounded-xl hover:bg-blue-900 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 mt-2"
                    >
                        {loading
                            ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</>
                            : isEdit ? 'Update Transaction' : 'Add Transaction'
                        }
                    </button>
                </form>
            </div>
        </div>
    );
};

export default TransactionModal;