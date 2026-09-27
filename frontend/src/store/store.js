import { configureStore } from "@reduxjs/toolkit";
import authReducer, { clearSession } from './slices/authSlice.js';
import { configureAuth } from '../services/api.js';
import toastReducer from './slices/toastSlice.js'
import gamifcationReducer from './slices/gamingSlice.js';

// Remove keys written by older versions without restoring authentication from them.
if (typeof window !== 'undefined') {
    try {
        window.localStorage.removeItem('token');
        window.localStorage.removeItem('user');
    } catch {
        // Storage may be unavailable; Redux still starts unauthenticated.
    }
}

export const store = configureStore({
    reducer: { 
        auth: authReducer, 
        toast: toastReducer, 
        gamification: gamifcationReducer,
    },
});

configureAuth({
    getAccessToken: () => store.getState().auth.token,
    getSessionGeneration: () => store.getState().auth.sessionGeneration,
    onUnauthorized: ({ token, generation }) => {
        const auth = store.getState().auth;
        if (auth.token === token && auth.sessionGeneration === generation) {
            store.dispatch(clearSession());
        }
    },
});
