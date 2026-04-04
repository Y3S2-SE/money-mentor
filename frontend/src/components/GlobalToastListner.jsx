import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Toaster } from 'react-hot-toast';
import { removeToast } from '../store/slices/toastSlice';
import { Zap, Medal, CheckCircle2, XCircle, Info, Flame, Rocket, } from 'lucide-react';

const TOAST_CONFIG = {
    xp:      { icon: Zap, bg: '#0a0a0a', border: '#1d4ed8', iconBg: '#1e3a8a', iconColor: '#60a5fa', titleColor: '#eff6ff', subColor: '#93c5fd' },
    badge:   { icon: Medal, bg: '#0a0a0a', border: '#d97706', iconBg: '#78350f', iconColor: '#fbbf24', titleColor: '#fffbeb', subColor: '#fcd34d' },
    success: { icon: CheckCircle2, bg: '#0a0a0a', border: '#16a34a', iconBg: '#14532d', iconColor: '#4ade80', titleColor: '#f0fdf4', subColor: '#86efac' },
    error:   { icon: XCircle, bg: '#0a0a0a', border: '#e11d48', iconBg: '#881337', iconColor: '#fb7185', titleColor: '#fff1f2', subColor: '#fda4af' },
    info:    { icon: Info, bg: '#0a0a0a', border: '#475569', iconBg: '#1e293b', iconColor: '#94a3b8', titleColor: '#f8fafc', subColor: '#cbd5e1' },
    streak:  { icon: Flame, bg: '#0a0a0a', border: '#ea580c', iconBg: '#7c2d12', iconColor: '#fb923c', titleColor: '#fff7ed', subColor: '#fdba74' },
    level:   { icon: Rocket, bg: '#0a0a0a', border: '#7c3aed', iconBg: '#3b0764', iconColor: '#a78bfa', titleColor: '#faf5ff', subColor: '#c4b5fd' },
};

const MAX_VISIBLE = 2;
const TOAST_DURATION = 3500;
const STAGGER_DELAY = 0;

// Single toast card
const ToastCard = ({ item, isLatest, isExiting, onDismiss }) => {
    const [mounted, setMounted] = useState(false);
    const config = TOAST_CONFIG[item.type] || TOAST_CONFIG.info;
    const Icon = config.icon;

    useEffect(() => {
        const t = setTimeout(() => setMounted(true), 10);
        return () => clearTimeout(t);
    }, []);

    const getTransform = () => {
        if (isExiting) return 'scale(0.85) translateY(20px)';  // exit downward
        if (!mounted)  return 'scale(0.9) translateY(20px)';   // enter from below
        if (isLatest)  return 'scale(1) translateY(0)';
        return 'scale(0.95) translateY(0)';
    };

    const getOpacity = () => {
        if (isExiting) return 0;
        if (!mounted)  return 0;
        if (isLatest)  return 1;
        return 0.6;
    };

    return (
        <div
   onClick={() => !isExiting && onDismiss(item.id)}
            className="cursor-pointer"
            style={{
                opacity:    getOpacity(),
                transform:  getTransform(),
                transition: 'opacity 400ms ease, transform 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                pointerEvents: isExiting ? 'none' : 'auto',
                willChange: 'transform, opacity',
            }}
        >
            <div
                className="flex items-start gap-3 rounded-2xl border-2"
                style={{
                    backgroundColor: config.bg,
                    borderColor: isLatest ? config.border : `${config.border}88`,
                    padding: isLatest ? '12px 16px' : '9px 13px',
                    minWidth: 'min(300px, calc(100vw - 48px))',   // mobile-safe
                    maxWidth: 'min(380px, calc(100vw - 32px))',   // mobile-safe
                    boxShadow: isLatest
                        ? '0 8px 24px rgba(0,0,0,0.12)'
                        : '0 3px 10px rgba(0,0,0,0.07)',
                    transition: 'padding 400ms ease, border-color 400ms ease, box-shadow 400ms ease',
                }}
            >
                {/* Icon */}
                <div
                    className="shrink-0 mt-0.5 rounded-xl"
                    style={{
                        backgroundColor: config.iconBg,
                        padding: isLatest ? '7px' : '5px',
                        transition: 'padding 400ms ease',
                    }}
                >
                    <Icon
                        style={{
                            color:  config.iconColor,
                            width:  isLatest ? '16px' : '13px',
                            height: isLatest ? '16px' : '13px',
                            transition: 'width 400ms ease, height 400ms ease',
                        }}
                    />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                    <p
                        className="font-bold leading-tight"
                        style={{
                            color:      config.titleColor,
                            fontSize:   isLatest ? '13.5px' : '11.5px',
                            transition: 'font-size 400ms ease, color 400ms ease',
                        }}
                    >
                        {item.message}
                    </p>
                    <div
                        style={{
                            maxHeight:  isLatest && item.subMessage ? '40px' : '0px',
                            opacity:    isLatest ? 1 : 0,
                            overflow:   'hidden',
                            transition: 'max-height 400ms ease, opacity 400ms ease',
                        }}
                    >
                        {item.subMessage && (
                            <p className="text-xs mt-0.5 leading-snug font-medium"
                                style={{ color: config.subColor }}>
                                {item.subMessage}
                            </p>
                        )}
                    </div>
                </div>

                {/* Dismiss */}
                <XCircle
                    className="shrink-0 mt-0.5 opacity-25 hover:opacity-60"
                    style={{
                        color:      config.iconColor,
                        width:      isLatest ? '14px' : '12px',
                        height:     isLatest ? '14px' : '12px',
                        transition: 'width 400ms ease, height 400ms ease, opacity 300ms ease',
                    }}
                />
            </div>
        </div>
    );
};

// Main listener
const GlobalToastListener = () => {
    const dispatch = useDispatch();
    const queue = useSelector(state => state.toast.queue);

    // stack entry: { id, item, timerId, exiting }
    const [stack, setStack] = useState([]);
    // pending entries waiting to be shown when slot opens
    const [pending, setPending] = useState([]);

    const stackRef = useRef(stack);
    const pendingRef = useRef(pending);

    useEffect(() => { stackRef.current = stack; }, [stack]);
    useEffect(() => { pendingRef.current = pending; }, [pending]);

    // Hard dismiss: remove from stack after exit animation
    const hardRemove = (id) => {
        setStack(prev => prev.filter(s => s.id !== id));
    };

    // Soft dismiss: mark as exiting → animate out → hard remove─
    const handleDismiss = (id) => {
        // Clear auto timer
        const entry = stackRef.current.find(s => s.id === id);
        if (!entry || entry.exiting) return;
        if (entry.timerId) clearTimeout(entry.timerId);

        // Mark exiting
        setStack(prev =>
            prev.map(s => s.id === id ? { ...s, exiting: true } : s)
        );

        // Hard remove after animation completes
        setTimeout(() => {
            hardRemove(id);
        }, 500); // matches transition duration-500
    };

    // Push a new item onto the visible stack─
    const pushToStack = (item) => {
        setStack(prev => {
            const current = prev.filter(s => !s.exiting);

            // If already at MAX_VISIBLE, dismiss the oldest first
            if (current.length >= MAX_VISIBLE) {
                const oldest = current[0];
                if (oldest) {
                    if (oldest.timerId) clearTimeout(oldest.timerId);

                    // Mark oldest as exiting
                    setTimeout(() => hardRemove(oldest.id), 500);

                    // Schedule new item after oldest finishes exiting
                    setTimeout(() => pushToStack(item), 520);

                    return prev.map(s =>
                        s.id === oldest.id ? { ...s, exiting: true } : s
                    );
                }
            }

            // Auto dismiss timer for new item
            const timerId = setTimeout(() => handleDismiss(item.id), TOAST_DURATION);

            return [...prev, { id: item.id, item, timerId, exiting: false }];
        });
    };

    // Consume Redux queue with thunks sequencing
    useEffect(() => {
        queue.forEach((item) => {
            pushToStack(item);
            dispatch(removeToast(item.id));
        });
    }, [queue]);

    // Visible stack = non-exiting entries, max 2─
    const visible = stack.slice(-MAX_VISIBLE);

    return (
    <>
        {visible.length > 0 && (
            <div
                style={{
                    position:  'fixed',
                    zIndex:    9999,
                    bottom:    '24px',
                    left:      '50%',
                    transform: 'translateX(-50%)',
                    display:   'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap:       '8px',
                    pointerEvents: 'none',
                    // ✅ This is the key fix — container animates its own height
                    // so surviving toasts slide smoothly instead of snapping
                    transition: 'all 400ms cubic-bezier(0.34, 1.56, 0.64, 1)',
                    willChange: 'transform',
                    // Mobile: keep away from bottom nav/home indicator
                    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
                }}
            >
                {visible.map((entry, index) => {
                    const isLatest = index === visible.length - 1;
                    return (
                        <div
                            key={entry.id}
                            className="pointer-events-auto"
                            style={{
                                // ✅ Each slot animates height to 0 on exit
                                // so siblings shift up/down smoothly
                                maxHeight: entry.exiting ? '0px' : '120px',
                                opacity:   entry.exiting ? 0 : 1,
                                overflow:  'hidden',
                                transition: 'max-height 400ms cubic-bezier(0.4, 0, 0.2, 1), opacity 300ms ease',
                                willChange: 'max-height',
                            }}
                        >
                            <ToastCard
                                item={entry.item}
                                isLatest={isLatest}
                                isExiting={entry.exiting}
                                onDismiss={handleDismiss}
                            />
                        </div>
                    );
                })}
            </div>
        )}

        <Toaster position="bottom-center" gutter={8}
            toastOptions={{
                duration: 4000,
                className: 'mm-toast',
                success: { className: 'mm-toast mm-toast--success',
                    iconTheme: { primary: '#2563eb', secondary: '#fff' } },
                error: { className: 'mm-toast mm-toast--error' },
            }}
        />
    </>
);
};

export default GlobalToastListener;