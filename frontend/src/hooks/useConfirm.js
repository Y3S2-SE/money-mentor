import { useState, useCallback } from 'react';

const useConfirm = () => {
    const [state, setState] = useState({
        open: false,
        title: '',
        description: '',
        confirmLabel: 'Confirm',
        cancelLabel: 'Cancel',
        variant: 'danger',
        icon: null,
        loading: false,
        onConfirm: null,
    });

    const confirm = useCallback((options) => {
        return new Promise((resolve) => {
            setState({
                open: true,
                title: options.title || 'Are you sure?',
                description: options.description || 'This action cannot be undone.',
                confirmLabel: options.confirmLabel || 'Confirm',
                cancelLabel: options.cancelLabel || 'Cancel',
                variant: options.variant || 'danger',
                icon: options.icon || null,
                loading: false,
                onConfirm: resolve,
            });
        });
    }, []);

    const handleConfirm = useCallback(() => {
        state.onConfirm?.(true);
        setState(prev => ({ ...prev, open: false }));
    }, [state]);

    const handleCancel = useCallback(() => {
        state.onConfirm?.(false);
        setState(prev => ({ ...prev, open: false }));
    }, [state]);

    const setLoading = useCallback((val) => {
        setState(prev => ({ ...prev, loading: val }));
    }, []);

    return { confirm, setLoading, modalProps: { ...state, onConfirm: handleConfirm, onCancel: handleCancel } };
};

export default useConfirm;