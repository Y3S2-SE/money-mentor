import { createSlice } from "@reduxjs/toolkit";

const toastSlice = createSlice({
    name: 'toast',
    initialState: { queue: [] },
    reducers: {
        addToast: (state, action) => {
            state.queue.push({
                id: Date.now() + Math.random(),
                type: action.payload.type || 'info',
                message: action.payload.message,
                subMessage: action.payload.subMessage || null,
                icon: action.payload.icon || null
            });
        },
        removeToast: (state, action) => {
            state.queue = state.queue.filter(t => t.id !== action.payload);
        },
        clearToast: (state) => {
            state.queue = [];
        }
    }
});

export const { addToast, removeToast, clearToast } = toastSlice.actions;
export default toastSlice.reducer;