import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { createPortal } from 'react-dom';

// helpers 

export const NOW = new Date();
export const CURRENT_MONTH_VALUE = `${NOW.getFullYear()}-${String(NOW.getMonth() + 1).padStart(2, '0')}`;

export const MONTH_NAMES_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONTH_NAMES_LONG  = ['January','February','March','April','May','June','July','August','September','October','November','December'];

export const toValue = (year, month) =>
    `${year}-${String(month + 1).padStart(2, '0')}`;

export const fromValue = (value) => {
    if (!value) return { year: NOW.getFullYear(), month: NOW.getMonth() };
    const [y, m] = value.split('-').map(Number);
    return { year: y, month: m - 1 };
};

export const formatDisplay = (value) => {
    if (!value) return 'Select month';
    const { year, month } = fromValue(value);
    return `${MONTH_NAMES_LONG[month]} ${year}`;
};

// TYPE OPTIONS 

export const TYPE_OPTIONS = [
    { label: 'All types', value: '' },
    { label: 'Income',    value: 'income' },
    { label: 'Expense',   value: 'expense' },
];

// MonthCalendarPicker 

export const MonthCalendarPicker = ({ value, onChange, onClose, anchorRef }) => {
    const init       = fromValue(value || CURRENT_MONTH_VALUE);
    const [viewYear, setViewYear] = useState(init.year);
    const popoverRef = useRef(null);
    const [pos, setPos]    = useState({ top: 0, left: 0, width: 280 });
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth < 640);
        check();
        window.addEventListener('resize', check);
        return () => window.removeEventListener('resize', check);
    }, []);

    useEffect(() => {
        if (isMobile || !anchorRef?.current) return;
        const rect = anchorRef.current.getBoundingClientRect();
        setPos({
            top:   rect.bottom + window.scrollY + 6,
            left:  rect.left   + window.scrollX,
            width: Math.max(rect.width, 280),
        });
    }, [isMobile, anchorRef]);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        const onMouse = (e) => {
            if (
                popoverRef.current && !popoverRef.current.contains(e.target) &&
                anchorRef?.current  && !anchorRef.current.contains(e.target)
            ) onClose();
        };
        document.addEventListener('keydown',   onKey);
        document.addEventListener('mousedown', onMouse);
        return () => {
            document.removeEventListener('keydown',   onKey);
            document.removeEventListener('mousedown', onMouse);
        };
    }, [onClose, anchorRef]);

    const { year: selYear, month: selMonth } = fromValue(value || CURRENT_MONTH_VALUE);

    const isFuture = (y, m) =>
        y > NOW.getFullYear() || (y === NOW.getFullYear() && m > NOW.getMonth());

    const handleSelect = (m) => {
        if (isFuture(viewYear, m)) return;
        onChange(toValue(viewYear, m));
        onClose();
    };

    const CalendarBody = () => (
        <div className="p-4 select-none">
            {/* Year nav */}
            <div className="flex items-center justify-between mb-4">
                <button
                    type="button"
                    onClick={() => setViewYear(y => y - 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg
                        text-on-surface/50 hover:bg-outline-variant/15 hover:text-on-surface
                        transition-colors focus:outline-none"
                >
                    <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="text-sm font-headline font-bold text-on-surface tracking-wide">
                    {viewYear}
                </span>

                <button
                    type="button"
                    onClick={() => { if (viewYear < NOW.getFullYear()) setViewYear(y => y + 1); }}
                    disabled={viewYear >= NOW.getFullYear()}
                    className="w-8 h-8 flex items-center justify-center rounded-lg
                        text-on-surface/50 hover:bg-outline-variant/15 hover:text-on-surface
                        transition-colors disabled:opacity-25 disabled:cursor-not-allowed
                        focus:outline-none"
                >
                    <ChevronRight className="w-4 h-4" />
                </button>
            </div>

            {/* Month grid */}
            <div className="grid grid-cols-3 gap-2">
                {MONTH_NAMES_SHORT.map((name, m) => {
                    const future   = isFuture(viewYear, m);
                    const selected = viewYear === selYear && m === selMonth;
                    const isNow    = viewYear === NOW.getFullYear() && m === NOW.getMonth();

                    return (
                        <button
                            key={m}
                            type="button"
                            disabled={future}
                            onClick={() => handleSelect(m)}
                            className={[
                                'relative py-2.5 rounded-xl text-sm font-body font-medium',
                                'transition-all duration-150 focus:outline-none',
                                future
                                    ? 'text-on-surface/20 cursor-not-allowed'
                                    : selected
                                        ? 'bg-primary text-on-primary shadow-md scale-[1.05]'
                                        : isNow
                                            ? 'bg-primary/10 text-primary font-bold hover:bg-primary/20'
                                            : 'text-on-surface hover:bg-outline-variant/15',
                            ].join(' ')}
                        >
                            {name}
                            {isNow && !selected && (
                                <span className="absolute bottom-1.25 left-1/2 -translate-x-1/2
                                    w-1.25 h-1.25 rounded-full bg-primary/50" />
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Quick "This month" */}
            <div className="mt-3 pt-3 border-t border-outline-variant/20 flex justify-center">
                <button
                    type="button"
                    onClick={() => { onChange(CURRENT_MONTH_VALUE); onClose(); }}
                    className="text-xs font-label font-bold tracking-widest uppercase
                        text-primary/60 hover:text-primary transition-colors"
                >
                    This month
                </button>
            </div>
        </div>
    );

    // MOBILE: bottom sheet 
    if (isMobile) {
        return createPortal(
            <div className="fixed inset-0 z-9999 flex flex-col justify-end">
                <div
                    className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
                    onClick={onClose}
                    style={{ animation: 'mcp-fade 0.18s ease both' }}
                />
                <div
                    ref={popoverRef}
                    className="relative bg-surface-container-lowest rounded-t-3xl shadow-2xl"
                    style={{ animation: 'mcp-rise 0.24s cubic-bezier(0.34,1.4,0.64,1) both' }}
                >
                    <div className="flex justify-center pt-3 pb-1">
                        <div className="w-10 h-1 rounded-full bg-outline-variant/30" />
                    </div>
                    <div className="flex items-center justify-between px-5 py-3 border-b border-outline-variant/20">
                        <span className="text-sm font-headline font-bold text-on-surface">Select Month</span>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-7 h-7 rounded-lg flex items-center justify-center
                                text-on-surface/40 hover:bg-outline-variant/15 transition-colors focus:outline-none"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <CalendarBody />
                    <div style={{ height: 'env(safe-area-inset-bottom, 12px)' }} />
                </div>

                <style>{`
                    @keyframes mcp-fade { from { opacity:0 } to { opacity:1 } }
                    @keyframes mcp-rise {
                        from { transform: translateY(100%); opacity: 0; }
                        to   { transform: translateY(0);    opacity: 1; }
                    }
                `}</style>
            </div>,
            document.body
        );
    }

    // DESKTOP: floating popover 
    return createPortal(
        <>
            <div
                ref={popoverRef}
                style={{
                    position: 'absolute',
                    top:      pos.top,
                    left:     pos.left,
                    width:    pos.width,
                    zIndex:   9999,
                    animation: 'mcp-pop 0.2s cubic-bezier(0.34,1.4,0.64,1) both',
                }}
                className="bg-surface-container-lowest rounded-2xl border border-outline-variant/25 shadow-xl"
            >
                <CalendarBody />
            </div>
            <style>{`
                @keyframes mcp-pop {
                    from { opacity:0; transform: scale(0.95) translateY(-6px); }
                    to   { opacity:1; transform: scale(1)    translateY(0); }
                }
            `}</style>
        </>,
        document.body
    );
};

// CustomDropdown 

const CustomDropdown = ({ label, value, options, onChange }) => {
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const selected     = options.find(o => o.value === value);
    const displayLabel = selected?.label || 'Select';

    return (
        <div className="flex flex-col gap-1" ref={ref}>
            {label && (
                <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider">{label}</label>
            )}
            <div className="relative">
                <button
                    type="button"
                    onClick={() => setOpen(p => !p)}
                    className={`w-full px-4 py-2.25 pr-10 rounded-xl border text-sm font-body
                        text-left text-on-surface bg-surface-bright focus:outline-none transition-all
                        ${open
                            ? 'border-primary/40 ring-2 ring-primary/10'
                            : 'border-outline-variant/30 hover:border-outline-variant/60'
                        }`}
                >
                    <span className="truncate">{displayLabel}</span>
                    <span
                        className={`material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2
                            text-on-surface/50 pointer-events-none text-[20px]
                            transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                    >
                        expand_more
                    </span>
                </button>

                {open && (
                    <div className="absolute z-20 w-full mt-2 bg-surface-container-lowest border border-outline-variant/30
                        rounded-xl shadow-lg overflow-hidden top-full">
                        {options.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={() => { onChange(opt.value); setOpen(false); }}
                                className={`w-full text-left px-4 py-2.5 text-sm font-body
                                    transition-colors
                                    ${value === opt.value
                                        ? 'bg-primary/10 text-primary font-bold'
                                        : 'text-on-surface hover:bg-outline-variant/10'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

// TransactionFilters 

const TransactionFilters = ({ filters, onChange, onReset }) => {
    const [calOpen, setCalOpen] = useState(false);
    const monthBtnRef           = useRef(null);

    const handleChange = (field, value) => {
        onChange({ ...filters, [field]: value, page: 1 });
    };

    const hasActiveFilters =
        filters.type ||
        filters.category ||
        (filters.month && filters.month !== CURRENT_MONTH_VALUE);

    const activeMonth = filters.month || CURRENT_MONTH_VALUE;

    return (
        <div className="bg-surface-container-lowest rounded-2xl p-4 border border-outline-variant/30 font-body">
            <div className="flex flex-wrap sm:flex-nowrap items-start gap-4">

                {/* Month (custom calendar) */}
                <div className="flex flex-col gap-1 w-full sm:w-55 shrink-0">
                    <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider">Month</label>
                    <button
                        ref={monthBtnRef}
                        type="button"
                        onClick={() => setCalOpen(p => !p)}
                        className={`w-full flex items-center gap-2.5 px-4 py-2.25 rounded-xl border
                            text-sm font-body text-left bg-surface-bright transition-all focus:outline-none
                            ${calOpen
                                ? 'border-primary/40 ring-2 ring-primary/10'
                                : 'border-outline-variant/30 hover:border-outline-variant/60'
                            }`}
                    >
                        <CalendarDays
                            className={`w-4 h-4 shrink-0 transition-colors
                                ${calOpen ? 'text-primary' : 'text-on-surface/35'}`}
                        />
                        <span className={`flex-1 truncate font-medium
                            ${calOpen ? 'text-primary' : 'text-on-surface'}`}>
                            {formatDisplay(activeMonth)}
                        </span>
                        <span
                            className={`material-symbols-outlined pointer-events-none text-[18px]
                                transition-transform duration-200
                                ${calOpen ? 'rotate-180 text-primary/60' : 'text-on-surface/40'}`}
                        >
                            expand_more
                        </span>
                    </button>

                    {calOpen && (
                        <MonthCalendarPicker
                            value={activeMonth}
                            onChange={(val) => handleChange('month', val)}
                            onClose={() => setCalOpen(false)}
                            anchorRef={monthBtnRef}
                        />
                    )}
                </div>

                {/* Type */}
                <div className="w-full sm:w-40 shrink-0">
                    <CustomDropdown
                        label="Type"
                        value={filters.type || ''}
                        options={TYPE_OPTIONS}
                        onChange={(val) => handleChange('type', val)}
                    />
                </div>

                {/* Category search */}
                <div className="flex flex-col gap-1 w-full flex-1 min-w-45">
                    <label className="text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-wider">Category</label>
                    <div className="relative">
                        <span className="material-symbols-outlined absolute left-3 top-1/2
                            -translate-y-1/2 text-[18px] text-on-surface/40 pointer-events-none">
                            search
                        </span>
                        <input
                            type="text"
                            value={filters.category || ''}
                            onChange={(e) => handleChange('category', e.target.value)}
                            placeholder="Search category..."
                            className="w-full pl-9 pr-4 py-2.25 rounded-xl border border-outline-variant/30
                                bg-surface-bright text-sm font-body text-on-surface placeholder:text-on-surface/40
                                focus:outline-none focus:border-primary/40 focus:ring-2 focus:ring-primary/10
                                transition-all"
                        />
                    </div>
                </div>

                {/* Reset */}
                {hasActiveFilters && (
                    <div className="flex flex-col gap-1 w-full sm:w-auto shrink-0">
                        <label className="hidden sm:block text-[10px] font-label text-transparent select-none uppercase tracking-wider">Reset</label>
                        <button
                            onClick={onReset}
                            className="w-full sm:w-auto flex items-center justify-center gap-1.5
                                text-sm font-label font-bold uppercase tracking-wider text-on-surface-variant
                                hover:text-error bg-surface-container-low hover:bg-error-container/30
                                border border-outline-variant/30 hover:border-error/20
                                rounded-xl px-4 py-2.25 transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                            Reset
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TransactionFilters;