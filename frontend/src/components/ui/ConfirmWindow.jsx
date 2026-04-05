import { useEffect } from 'react';
import { createPortal } from 'react-dom';

const VARIANTS = {
    danger: {
        icon: 'delete',
        iconBg: 'bg-red-50',
        iconColor: 'text-red-500',
        confirmBg: 'bg-red-500 hover:bg-red-600 text-white',
        titleColor: 'text-red-600',
    },
    warning: {
        icon: 'warning',
        iconBg: 'bg-amber-50',
        iconColor: 'text-amber-500',
        confirmBg: 'bg-amber-500 hover:bg-amber-600 text-white',
        titleColor: 'text-amber-600',
    },
    info: {
        icon: 'info',
        iconBg: 'bg-blue-50',
        iconColor: 'text-blue-500',
        confirmBg: 'bg-primary hover:bg-primary/90 text-white',
        titleColor: 'text-primary',
    },
    success: {
        icon: 'check_circle',
        iconBg: 'bg-green-50',
        iconColor: 'text-green-500',
        confirmBg: 'bg-green-500 hover:bg-green-600 text-white',
        titleColor: 'text-green-600',
    },
};

const ConfirmWindow = ({
    open,
    onConfirm,
    onCancel,
    title = 'Are you sure?',
    description = 'This action cannot be undone.',
    confirmLabel = 'Confirm',
    cancelLabel = 'Cancel',
    variant = 'danger',
    icon,               
    loading = false,   
}) => {
    const style = VARIANTS[variant] || VARIANTS.danger;
    const resolvedIcon = icon || style.icon;

    // Close on Escape
    useEffect(() => {
        if (!open) return;
        const handleKey = (e) => { if (e.key === 'Escape') onCancel(); };
        window.addEventListener('keydown', handleKey);
        return () => window.removeEventListener('keydown', handleKey);
    }, [open, onCancel]);

    // Lock body scroll when open
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [open]);

    if (!open) return null;

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) onCancel();
    };

    const modalContent = (
        <div
            className="fixed inset-0 z-9999 flex items-end sm:items-center
            justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
            onClick={handleBackdropClick}
            style={{ animation: 'fadeIn 0.15s ease forwards' }}
        >
            <div
                className="relative bg-white w-full sm:max-w-md
                rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
                style={{ animation: 'slideUp 0.2s cubic-bezier(0.34, 1.56, 0.64, 1) forwards' }}
            >
                {/* Drag handle — mobile only */}
                <div className="sm:hidden flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 rounded-full bg-outline-variant/30" />
                </div>

                <div className="px-6 pt-6 pb-8 sm:p-8">
                    {/* Icon */}
                    <div className={`w-14 h-14 rounded-2xl ${style.iconBg} flex items-center
                        justify-center mb-5 mx-auto sm:mx-0`}>
                        <span className={`material-symbols-outlined text-[28px] ${style.iconColor}`}>
                            {resolvedIcon}
                        </span>
                    </div>

                    {/* Text */}
                    <div className="text-center sm:text-left mb-7">
                        <h2 className={`font-headline text-lg font-bold mb-2 ${style.titleColor}`}>
                            {title}
                        </h2>
                        {description && (
                            <p className="font-body text-sm text-on-surface/60 leading-relaxed">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex flex-col-reverse sm:flex-row gap-3">
                        <button
                            onClick={onCancel}
                            disabled={loading}
                            className="flex-1 px-5 py-3 rounded-xl border border-outline-variant/30
                            font-label text-[12px] uppercase tracking-widest font-bold
                            text-on-surface/60 hover:bg-surface-bright hover:text-on-surface
                            transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {cancelLabel}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={loading}
                            className={`flex-1 px-5 py-3 rounded-xl font-label text-[12px]
                            uppercase tracking-widest font-bold transition-colors
                            flex items-center justify-center gap-2
                            disabled:opacity-70 disabled:cursor-not-allowed ${style.confirmBg}`}
                        >
                            {loading && (
                                <span className="material-symbols-outlined text-[16px] animate-spin">
                                    progress_activity
                                </span>
                            )}
                            {confirmLabel}
                        </button>
                    </div>
                </div>
            </div>

            <style>{`
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to   { opacity: 1; }
                }
                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(16px) scale(0.98); }
                    to   { opacity: 1; transform: translateY(0) scale(1); }
                }
            `}</style>
        </div>
    );

    if (typeof document === 'undefined' || !document.body) return modalContent;
    return createPortal(modalContent, document.body);
};

export default ConfirmWindow;