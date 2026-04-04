import { configureStore } from "@reduxjs/toolkit";
import authReducer from './slices/authSlice.js';
import toastReducer from './slices/toastSlice.js'
import gamifcationReducer from './slices/gamingSlice.js';

export const store = configureStore({
    reducer: { 
        auth: authReducer, 
        toast: toastReducer, 
        gamification: gamifcationReducer,
    },
});