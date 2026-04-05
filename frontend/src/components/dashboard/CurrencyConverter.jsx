import { useState } from 'react';
import { ArrowLeftRight, Loader2 } from 'lucide-react';
import dashboardService from '../../services/dashboardService';

const CurrencyConverter = () => {
    const [amount, setAmount] = useState('');
    const [from, setFrom] = useState('LKR');
    const [to, setTo] = useState('USD');
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSwap = () => {
        setFrom(to);
        setTo(from);
        setResult(null);
        setError('');
    };

    const handleConvert = async (e) => {
        e.preventDefault();
        if (!amount || isNaN(amount) || Number(amount) <= 0) {
            setError('Enter a valid amount');
            return;
        }
        if (from.length !== 3 || to.length !== 3) {
            setError('Currency codes must be 3 letters');
            return;
        }
        setError('');
        setLoading(true);
        setResult(null);
        try {
            const data = await dashboardService.convertCurrency(
                amount,
                from.toUpperCase(),
                to.toUpperCase()
            );
            setResult(data.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Conversion failed. Check currency codes.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-5 border border-outline-variant/30 hover:border-outline-variant/50 transition-all">
            {/* Header */}
            <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center">
                    <ArrowLeftRight className="w-3.5 h-3.5 text-on-primary-fixed" />
                </div>
                <span className="text-sm font-headline font-bold text-on-surface">Currency Converter</span>
            </div>

            <form onSubmit={handleConvert} className="space-y-3">
                {/* Amount input */}
                <div>
                    <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">Amount</label>
                    <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full text-sm border border-outline-variant/30 bg-surface-bright rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-on-surface"
                    />
                </div>

                {/* From / Swap / To */}
                <div className="flex items-center gap-2">
                    <div className="flex-1">
                        <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">From</label>
                        <input
                            type="text"
                            maxLength={3}
                            value={from}
                            onChange={(e) => setFrom(e.target.value.toUpperCase())}
                            placeholder="LKR"
                            className="w-full text-sm border border-outline-variant/30 bg-surface-bright rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase font-label font-bold tracking-wider text-on-surface"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={handleSwap}
                        className="mt-5 w-8 h-8 rounded-xl bg-surface-container-low hover:bg-surface-container border border-outline-variant/20 flex items-center justify-center transition-colors duration-150 shrink-0"
                    >
                        <ArrowLeftRight className="w-3.5 h-3.5 text-on-surface-variant" />
                    </button>

                    <div className="flex-1">
                        <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider mb-1 block">To</label>
                        <input
                            type="text"
                            maxLength={3}
                            value={to}
                            onChange={(e) => setTo(e.target.value.toUpperCase())}
                            placeholder="USD"
                            className="w-full text-sm border border-outline-variant/30 bg-surface-bright rounded-xl px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary uppercase font-label font-bold tracking-wider text-on-surface"
                        />
                    </div>
                </div>

                {/* Error */}
                {error && (
                    <p className="text-xs font-body text-error">{error}</p>
                )}

                {/* Convert button */}
                <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-2.5 bg-primary text-on-primary text-xs font-label font-bold uppercase tracking-wider rounded-xl hover:bg-primary/90 transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-60 shadow-sm"
                >
                    {loading
                        ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Converting...</>
                        : 'Convert'
                    }
                </button>
            </form>

            {/* Result */}
            {result && (
                <div className="mt-4 p-3 bg-primary-fixed rounded-xl border border-primary-fixed-dim">
                    <p className="text-[10px] font-label font-bold text-on-primary-fixed/60 uppercase tracking-wider mb-1">Result</p>
                    <p className="text-lg font-headline font-bold text-on-primary-fixed">
                        {result.convertedAmount.toLocaleString()} {result.to}
                    </p>
                    <p className="text-[10px] font-body text-on-primary-fixed/70 mt-1">
                        1 {result.from} = {result.rate} {result.to} · {result.date}
                    </p>
                </div>
            )}
        </div>
    );
};

export default CurrencyConverter;