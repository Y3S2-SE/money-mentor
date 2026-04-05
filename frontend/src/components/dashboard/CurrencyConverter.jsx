import { useState } from 'react';
import { ArrowLeftRight, Loader2, ChevronDown } from 'lucide-react';
import dashboardService from '../../services/dashboardService';

// List of supported currencies
const SUPPORTED_CURRENCIES = [
    { code: 'AED', name: 'United Arab Emirates Dirham' },
    { code: 'AFN', name: 'Afghan Afghani' },
    { code: 'ALL', name: 'Albanian Lek' },
    { code: 'AMD', name: 'Armenian Dram' },
    { code: 'ANG', name: 'Netherlands Antillean Guilder' },
    { code: 'AOA', name: 'Angolan Kwanza' },
    { code: 'ARS', name: 'Argentine Peso' },
    { code: 'AUD', name: 'Australian Dollar' },
    { code: 'AWG', name: 'Aruban Florin' },
    { code: 'AZN', name: 'Azerbaijani Manat' },
    { code: 'BAM', name: 'Bosnia and Herzegovina Convertible Mark' },
    { code: 'BBD', name: 'Barbadian Dollar' },
    { code: 'BDT', name: 'Bangladeshi Taka' },
    { code: 'BGN', name: 'Bulgarian Lev' },
    { code: 'BHD', name: 'Bahraini Dinar' },
    { code: 'BIF', name: 'Burundian Franc' },
    { code: 'BMD', name: 'Bermudian Dollar' },
    { code: 'BND', name: 'Brunei Dollar' },
    { code: 'BOB', name: 'Bolivian Boliviano' },
    { code: 'BRL', name: 'Brazilian Real' },
    { code: 'BSD', name: 'Bahamian Dollar' },
    { code: 'BTC', name: 'Bitcoin' },
    { code: 'BTN', name: 'Bhutanese Ngultrum' },
    { code: 'BWP', name: 'Botswanan Pula' },
    { code: 'BYN', name: 'Belarusian Ruble' },
    { code: 'BZD', name: 'Belize Dollar' },
    { code: 'CAD', name: 'Canadian Dollar' },
    { code: 'CDF', name: 'Congolese Franc' },
    { code: 'CHF', name: 'Swiss Franc' },
    { code: 'CLF', name: 'Chilean Unit of Account' },
    { code: 'CLP', name: 'Chilean Peso' },
    { code: 'CNY', name: 'Chinese Yuan' },
    { code: 'COP', name: 'Colombian Peso' },
    { code: 'CRC', name: 'Costa Rican Colón' },
    { code: 'CUP', name: 'Cuban Peso' },
    { code: 'CVE', name: 'Cape Verdean Escudo' },
    { code: 'CZK', name: 'Czech Koruna' },
    { code: 'DJF', name: 'Djiboutian Franc' },
    { code: 'DKK', name: 'Danish Krone' },
    { code: 'DOP', name: 'Dominican Peso' },
    { code: 'DZD', name: 'Algerian Dinar' },
    { code: 'EGP', name: 'Egyptian Pound' },
    { code: 'ERN', name: 'Eritrean Nakfa' },
    { code: 'ETB', name: 'Ethiopian Birr' },
    { code: 'EUR', name: 'Euro' },
    { code: 'FJD', name: 'Fijian Dollar' },
    { code: 'FKP', name: 'Falkland Islands Pound' },
    { code: 'GBP', name: 'British Pound Sterling' },
    { code: 'GEL', name: 'Georgian Lari' },
    { code: 'GHS', name: 'Ghanaian Cedi' },
    { code: 'GIP', name: 'Gibraltar Pound' },
    { code: 'GMD', name: 'Gambian Dalasi' },
    { code: 'GNF', name: 'Guinean Franc' },
    { code: 'GTQ', name: 'Guatemalan Quetzal' },
    { code: 'GYD', name: 'Guyanese Dollar' },
    { code: 'HKD', name: 'Hong Kong Dollar' },
    { code: 'HNL', name: 'Honduran Lempira' },
    { code: 'HRK', name: 'Croatian Kuna' },
    { code: 'HTG', name: 'Haitian Gourde' },
    { code: 'HUF', name: 'Hungarian Forint' },
    { code: 'IDR', name: 'Indonesian Rupiah' },
    { code: 'ILS', name: 'Israeli New Shekel' },
    { code: 'INR', name: 'Indian Rupee' },
    { code: 'IQD', name: 'Iraqi Dinar' },
    { code: 'IRR', name: 'Iranian Rial' },
    { code: 'ISK', name: 'Icelandic Króna' },
    { code: 'JMD', name: 'Jamaican Dollar' },
    { code: 'JOD', name: 'Jordanian Dinar' },
    { code: 'JPY', name: 'Japanese Yen' },
    { code: 'KES', name: 'Kenyan Shilling' },
    { code: 'KGS', name: 'Kyrgyzstani Som' },
    { code: 'KHR', name: 'Cambodian Riel' },
    { code: 'KMF', name: 'Comorian Franc' },
    { code: 'KPW', name: 'North Korean Won' },
    { code: 'KRW', name: 'South Korean Won' },
    { code: 'KWD', name: 'Kuwaiti Dinar' },
    { code: 'KYD', name: 'Cayman Islands Dollar' },
    { code: 'KZT', name: 'Kazakhstani Tenge' },
    { code: 'LAK', name: 'Laotian Kip' },
    { code: 'LBP', name: 'Lebanese Pound' },
    { code: 'LKR', name: 'Sri Lankan Rupee' },
    { code: 'LRD', name: 'Liberian Dollar' },
    { code: 'LSL', name: 'Lesotho Loti' },
    { code: 'LYD', name: 'Libyan Dinar' },
    { code: 'MAD', name: 'Moroccan Dirham' },
    { code: 'MDL', name: 'Moldovan Leu' },
    { code: 'MGA', name: 'Malagasy Ariary' },
    { code: 'MKD', name: 'Macedonian Denar' },
    { code: 'MMK', name: 'Myanmar Kyat' },
    { code: 'MNT', name: 'Mongolian Tugrik' },
    { code: 'MOP', name: 'Macanese Pataca' },
    { code: 'MRU', name: 'Mauritanian Ouguiya' },
    { code: 'MUR', name: 'Mauritian Rupee' },
    { code: 'MVR', name: 'Maldivian Rufiyaa' },
    { code: 'MWK', name: 'Malawian Kwacha' },
    { code: 'MXN', name: 'Mexican Peso' },
    { code: 'MYR', name: 'Malaysian Ringgit' },
    { code: 'MZN', name: 'Mozambican Metical' },
    { code: 'NAD', name: 'Namibian Dollar' },
    { code: 'NGN', name: 'Nigerian Naira' },
    { code: 'NIO', name: 'Nicaraguan Córdoba' },
    { code: 'NOK', name: 'Norwegian Krone' },
    { code: 'NPR', name: 'Nepalese Rupee' },
    { code: 'NZD', name: 'New Zealand Dollar' },
    { code: 'OMR', name: 'Omani Rial' },
    { code: 'PAB', name: 'Panamanian Balboa' },
    { code: 'PEN', name: 'Peruvian Nuevo Sol' },
    { code: 'PGK', name: 'Papua New Guinean Kina' },
    { code: 'PHP', name: 'Philippine Peso' },
    { code: 'PKR', name: 'Pakistani Rupee' },
    { code: 'PLN', name: 'Polish Zloty' },
    { code: 'PYG', name: 'Paraguayan Guarani' },
    { code: 'QAR', name: 'Qatari Rial' },
    { code: 'RON', name: 'Romanian Leu' },
    { code: 'RSD', name: 'Serbian Dinar' },
    { code: 'RUB', name: 'Russian Ruble' },
    { code: 'RWF', name: 'Rwandan Franc' },
    { code: 'SAR', name: 'Saudi Arabian Riyal' },
    { code: 'SBD', name: 'Solomon Islands Dollar' },
    { code: 'SCR', name: 'Seychellois Rupee' },
    { code: 'SDG', name: 'Sudanese Pound' },
    { code: 'SEK', name: 'Swedish Krona' },
    { code: 'SGD', name: 'Singapore Dollar' },
    { code: 'SHP', name: 'Saint Helena Pound' },
    { code: 'SLL', name: 'Sierra Leonean Leone' },
    { code: 'SOS', name: 'Somali Shilling' },
    { code: 'SRD', name: 'Surinamese Dollar' },
    { code: 'SSP', name: 'South Sudanese Pound' },
    { code: 'STN', name: 'São Tomé and Príncipe Dobra' },
    { code: 'SYP', name: 'Syrian Pound' },
    { code: 'SZL', name: 'Swazi Lilangeni' },
    { code: 'THB', name: 'Thai Baht' },
    { code: 'TJS', name: 'Tajikistani Somoni' },
    { code: 'TMT', name: 'Turkmenistani Manat' },
    { code: 'TND', name: 'Tunisian Dinar' },
    { code: 'TOP', name: 'Tongan Paanga' },
    { code: 'TRY', name: 'Turkish Lira' },
    { code: 'TTD', name: 'Trinidad and Tobago Dollar' },
    { code: 'TWD', name: 'New Taiwan Dollar' },
    { code: 'TZS', name: 'Tanzanian Shilling' },
    { code: 'UAH', name: 'Ukrainian Hryvnia' },
    { code: 'UGX', name: 'Ugandan Shilling' },
    { code: 'USD', name: 'United States Dollar' },
    { code: 'UYU', name: 'Uruguayan Peso' },
    { code: 'UZS', name: 'Uzbekistani Som' },
    { code: 'VES', name: 'Venezuelan Bolívar' },
    { code: 'VND', name: 'Vietnamese Dong' },
    { code: 'VUV', name: 'Vanuatu Vatu' },
    { code: 'WST', name: 'Samoan Tala' },
    { code: 'XAF', name: 'Central African CFA Franc' },
    { code: 'XCD', name: 'East Caribbean Dollar' },
    { code: 'XOF', name: 'West African CFA Franc' },
    { code: 'XPF', name: 'CFP Franc' },
    { code: 'YER', name: 'Yemeni Rial' },
    { code: 'ZAR', name: 'South African Rand' },
    { code: 'ZMW', name: 'Zambian Kwacha' },
    { code: 'ZWL', name: 'Zimbabwean Dollar' }
];

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
            setError(err.response?.data?.message || 'Conversion failed. Please try again.');
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
                        <div className="relative">
                            <select
                                value={from}
                                onChange={(e) => setFrom(e.target.value)}
                                className="w-full text-sm border border-outline-variant/30 bg-surface-bright rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-label font-bold tracking-wider text-on-surface appearance-none cursor-pointer"
                            >
                                {SUPPORTED_CURRENCIES.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code} - {currency.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                        </div>
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
                        <div className="relative">
                            <select
                                value={to}
                                onChange={(e) => setTo(e.target.value)}
                                className="w-full text-sm border border-outline-variant/30 bg-surface-bright rounded-xl px-3 py-2 pr-8 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-label font-bold tracking-wider text-on-surface appearance-none cursor-pointer"
                            >
                                {SUPPORTED_CURRENCIES.map((currency) => (
                                    <option key={currency.code} value={currency.code}>
                                        {currency.code} - {currency.name}
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-on-surface-variant pointer-events-none" />
                        </div>
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