import { createAsyncThunk, createSlice, nanoid } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { addToast } from './toastSlice';

const initialState = {
    user: null,
    token: null,
    sessionGeneration: 0,
    authRequestId: null,
    googleAttemptId: null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    dailyLoginReward: null,
    pendingBadges: []
};

const canStartAuth = (_, { getState }) => {
    const { user, token } = getState().auth;
    return !user && !token;
};

// Keep Google's one-use code out of Redux actions (including DevTools metadata).
// It is consumed immediately when the guarded async thunk starts.
const pendingGoogleCodes = new Map();

export const beginGooglePopup = () => (dispatch, getState) => {
    const auth = getState().auth;
    if (auth.user || auth.token || auth.authRequestId || auth.googleAttemptId) return null;

    const attemptId = nanoid();
    dispatch(googlePopupStarted(attemptId));
    return { attemptId, generation: auth.sessionGeneration };
};

export const isCurrentGooglePopup = ({ attemptId, generation }) => (_, getState) => {
    const auth = getState().auth;
    return !auth.user && !auth.token && !auth.authRequestId &&
        auth.googleAttemptId === attemptId && auth.sessionGeneration === generation;
};

const dispatchSequential = (thunkAPI, toasts, delayBetween = 1500, shouldDispatch = () => true) => {
    toasts.forEach((toast, index) => {
        if (!toast)  return;
        setTimeout(() => {
            if (shouldDispatch()) thunkAPI.dispatch(addToast(toast));
        }, index * delayBetween);
    });
};

// Register user
export const register = createAsyncThunk(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            const response = await authService.register(userData);
            const reward = response.data?.dailyLogin;

            const toastSequence = [];

            toastSequence.push({
                type: 'success',
                message: 'Welcome to MoneyMentor!',
                subMessage: 'Your account has been created successfully'
            });

            if (reward && !reward.alreadyCheckedIn) {
                toastSequence.push({
                    type: 'streak',
                    message: 'Daily login reward!',
                    subMessage: `+${reward.xpAwarded} XP awarded`
                });
            }


            if (reward?.leveledUp) {
                toastSequence.push({
                    type: 'level',
                    message: `Level up! You are now Level ${reward.level}`,
                    subMessage: reward.levelTitle
                });
            }

            reward?.newlyEarnedBadges?.forEach(badge => {
                toastSequence.push({
                    type: 'badge',
                    message: `Badge unlocked: ${badge.name}!`,
                    subMessage: `+${badge.xpReward} XP · ${badge.description}`
                });
            });

            dispatchSequential(thunkAPI, toastSequence, 1800);

            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Registration failed';
            return thunkAPI.rejectWithValue(message);
        }
    },
    { condition: canStartAuth }
);

// Login user
export const login = createAsyncThunk(
    'auth/login',
    async (credentials, thunkAPI) => {
        try {
            const response = await authService.login(credentials);
            const reward = response.data?.dailyLogin;

            const toastSequence = [];

            toastSequence.push({
                type: 'info',
                message: `Welcome back, ${response.data.user.username}!`,
                subMessage: 'Great to see you again'
            });

            if (reward && !reward.alreadyCheckedIn) {
                toastSequence.push({
                    type: 'streak',
                    message: `Day ${reward.currentStreak} streak!`,
                    subMessage: `+${reward.xpAwarded} XP for daily login`
                });
            } 

            if (reward?.leveledUp) {
                toastSequence.push({
                    type: 'level',
                    message: `Level up! You are now Level ${reward.level}`,
                    subMessage: reward.levelTitle
                });
            }

            reward?.newlyEarnedBadges?.forEach(badge => {
                toastSequence.push({
                    type: 'badge',
                    message: `Badge unlocked: ${badge.name}!`,
                    subMessage: `+${badge.xpReward} XP · ${badge.description}`
                });
            });

            dispatchSequential(thunkAPI, toastSequence, 1800);

            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Login failed';
            return thunkAPI.rejectWithValue(message);
        }
    },
    { condition: canStartAuth }
);

const googleLoginRequest = createAsyncThunk(
    'auth/googleLogin',
    async ({ attemptId, generation }, thunkAPI) => {
        const code = pendingGoogleCodes.get(attemptId);
        pendingGoogleCodes.delete(attemptId);

        try {
            const response = await authService.googleLogin(code);
            const reward = response.data?.dailyLogin;

            const toastSequence = [{
                type: 'info',
                message: `Welcome, ${response.data.user.username}!`,
                subMessage: 'You are signed in to MoneyMentor'
            }];
            if (reward && !reward.alreadyCheckedIn) {
                toastSequence.push({
                    type: 'streak',
                    message: `Day ${reward.currentStreak} streak!`,
                    subMessage: `+${reward.xpAwarded} XP for daily login`
                });
            }
            if (reward?.leveledUp) {
                toastSequence.push({
                    type: 'level',
                    message: `Level up! You are now Level ${reward.level}`,
                    subMessage: reward.levelTitle
                });
            }
            reward?.newlyEarnedBadges?.forEach(badge => {
                toastSequence.push({
                    type: 'badge',
                    message: `Badge unlocked: ${badge.name}!`,
                    subMessage: `+${badge.xpReward} XP - ${badge.description}`
                });
            });
            dispatchSequential(thunkAPI, toastSequence, 1800, () => {
                const auth = thunkAPI.getState().auth;
                return auth.token === response.data.token &&
                    auth.sessionGeneration === generation + 1;
            });

            return response.data;
        } catch (error) {
            const code = error.response?.data?.code;
            const messages = {
                GOOGLE_ACCOUNT_LINK_REQUIRED: 'An account with this email already exists. Please use its existing sign-in method.',
                GOOGLE_ORIGIN_INVALID: 'Google sign-in is unavailable from this page.',
                GOOGLE_REQUEST_INVALID: 'Google sign-in request was rejected. Please try again.',
                GOOGLE_CODE_INVALID: 'Google sign-in expired or could not be completed. Please try again.',
                GOOGLE_IDENTITY_INVALID: 'Google identity could not be verified. Please try again.',
                GOOGLE_EMAIL_UNVERIFIED: 'Please verify your Google email before signing in.',
                GOOGLE_ACCOUNT_UNAVAILABLE: 'Google sign-in is unavailable for this account.',
                GOOGLE_AUTH_UNAVAILABLE: 'Google sign-in is temporarily unavailable. Please try again later.',
                GOOGLE_AUTH_FAILED: 'Google sign-in could not be completed. Please try again.'
            };
            return thunkAPI.rejectWithValue(messages[code] ||
                (error.response ? 'Google sign-in could not be completed. Please try again.' :
                    'Could not contact MoneyMentor. Please try again.'));
        }
    },
    {
        condition: (attempt, thunkAPI) => {
            const auth = thunkAPI.getState().auth;
            return canStartAuth(null, thunkAPI) &&
                auth.googleAttemptId === attempt.attemptId &&
                auth.sessionGeneration === attempt.generation &&
                !auth.authRequestId && pendingGoogleCodes.has(attempt.attemptId);
        }
    }
);

export const googleLogin = (code, attempt) => async (dispatch) => {
    if (!attempt || typeof code !== 'string' || !code) return null;
    pendingGoogleCodes.set(attempt.attemptId, code);
    try {
        return await dispatch(googleLoginRequest(attempt));
    } finally {
        pendingGoogleCodes.delete(attempt.attemptId);
    }
};

// Logout user 
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, thunkAPI) => {
        const { token, sessionGeneration } = thunkAPI.getState().auth;
        try {
            if (token) {
                await authService.logout({ token, generation: sessionGeneration });
                thunkAPI.dispatch(addToast({
                    type: 'info',
                    message: 'Logged out successfully',
                    subMessage: 'See you next time!'
                }));
            }
        } catch {
            // Clear local auth even when the token was expired or already revoked.
        }
        return { token, sessionGeneration };
    }
);

// Get user profile
export const getProfile = createAsyncThunk(
    'auth/getProfile',
    async (_, thunkAPI) => {
        const { token: sessionToken, sessionGeneration } = thunkAPI.getState().auth;
        try {
            const response = await authService.getProfile({ token: sessionToken, generation: sessionGeneration });
            return { user: response.data, sessionToken, sessionGeneration };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch profile';
            return thunkAPI.rejectWithValue(message, { sessionToken, sessionGeneration });
        }
    }
);

// Update profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData, thunkAPI) => {
        const { token: sessionToken, sessionGeneration } = thunkAPI.getState().auth;
        try {
            const response = await authService.updateProfile(userData, { token: sessionToken, generation: sessionGeneration });
            return { user: response.data, sessionToken, sessionGeneration };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to update profile';
            return thunkAPI.rejectWithValue(message, { sessionToken, sessionGeneration });
        }
    }
);

// Change password
export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async (passwordData, thunkAPI) => {
        const { token: sessionToken, sessionGeneration } = thunkAPI.getState().auth;
        try {
            const response = await authService.changePassword(passwordData, { token: sessionToken, generation: sessionGeneration });
            return { ...response.data, sessionToken, sessionGeneration };
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to chaneg password';
            return thunkAPI.rejectWithValue(message, {
                sessionToken, sessionGeneration, code: error.response?.data?.code
            });
        }
    }
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        googlePopupStarted: (state, action) => {
            if (!state.user && !state.token && !state.authRequestId && !state.googleAttemptId) {
                state.googleAttemptId = action.payload;
            }
        },
        cancelGooglePopup: (state, action) => {
            if (state.googleAttemptId !== action.payload) return;
            state.googleAttemptId = null;
            state.authRequestId = null;
            state.isLoading = false;
        },
        clearSession: (state) => {
            state.sessionGeneration += 1;
            state.authRequestId = null;
            state.googleAttemptId = null;
            state.user = null;
            state.token = null;
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
            state.dailyLoginReward = null;
            state.pendingBadges = [];
        },
        reset: (state) => {
            state.isLoading = false;
            state.isSuccess = false;
            state.isError = false;
            state.message = '';
        },
        clearMessage: (state) => {
            state.message = '';
        },
        clearDailyLoginReward: (state) => {
            state.dailyLoginReward = null;
        },
        clearPendingBadges: (state) => {
            state.pendingBadges = [];
        },
        addPendingBadges: (state, action) => {
            if (action.payload?.length > 0) {
                state.pendingBadges.push(...action.payload);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            // Register
            .addCase(register.pending, (state, action) => {
                state.isLoading = true;
                state.authRequestId = action.meta.requestId;
                state.googleAttemptId = null;
            })
            .addCase(register.fulfilled, (state, action) => {
                if (state.authRequestId !== action.meta.requestId) return;
                state.authRequestId = null;
                state.sessionGeneration += 1;
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.message = 'Registration successful';
                const reward = action.payload.dailyLogin;
                if (reward && !reward.alreadyCheckedIn) {
                    state.dailyLoginReward = reward;
                }
                const badges = reward?.newlyEarnedBadges ?? [];
                if (badges.length > 0) {
                    state.pendingBadges.push(...badges);
                }
            })
            .addCase(register.rejected, (state, action) => {
                if (state.authRequestId !== action.meta.requestId) return;
                state.authRequestId = null;
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Login
            .addCase(login.pending, (state, action) => {
                state.isLoading = true;
                state.authRequestId = action.meta.requestId;
                state.googleAttemptId = null;
            })
            .addCase(login.fulfilled, (state, action) => {
                if (state.authRequestId !== action.meta.requestId) return;
                state.authRequestId = null;
                state.sessionGeneration += 1;
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.message = 'Login successful';
                const reward = action.payload.dailyLogin;
                if (reward && !reward.alreadyCheckedIn) {
                    state.dailyLoginReward = reward;
                }
                const badges = reward?.newlyEarnedBadges ?? [];
                if (badges.length > 0) {
                    state.pendingBadges.push(...badges);
                }
            })
            .addCase(login.rejected, (state, action) => {
                if (state.authRequestId !== action.meta.requestId) return;
                state.authRequestId = null;
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Google popup authorization-code exchange
            .addCase(googleLoginRequest.pending, (state, action) => {
                state.authRequestId = action.meta.requestId;
                state.isLoading = true;
            })
            .addCase(googleLoginRequest.fulfilled, (state, action) => {
                if (state.authRequestId !== action.meta.requestId ||
                    state.googleAttemptId !== action.meta.arg.attemptId ||
                    state.sessionGeneration !== action.meta.arg.generation ||
                    state.user || state.token) return;
                state.authRequestId = null;
                state.googleAttemptId = null;
                state.sessionGeneration += 1;
                state.isLoading = false;
                state.isSuccess = true;
                state.isError = false;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.message = 'Login successful';
                const reward = action.payload.dailyLogin;
                if (reward && !reward.alreadyCheckedIn) {
                    state.dailyLoginReward = reward;
                }
                const badges = reward?.newlyEarnedBadges ?? [];
                if (badges.length > 0) {
                    state.pendingBadges.push(...badges);
                }
            })
            .addCase(googleLoginRequest.rejected, (state, action) => {
                if (state.authRequestId !== action.meta.requestId ||
                    state.googleAttemptId !== action.meta.arg.attemptId ||
                    state.sessionGeneration !== action.meta.arg.generation) return;
                state.authRequestId = null;
                state.googleAttemptId = null;
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload || 'Google sign-in failed. Please try again.';
            })
            // Logout
            .addCase(logout.fulfilled, (state, action) => {
                if (
                    state.token !== action.payload.token ||
                    state.sessionGeneration !== action.payload.sessionGeneration
                ) return;
                state.sessionGeneration += 1;
                state.authRequestId = null;
                state.googleAttemptId = null;
                state.user = null;
                state.token = null;
                state.isLoading = false;
                state.isSuccess = false;
                state.isError = false;
                state.message = '';
                state.dailyLoginReward = null;
                state.pendingBadges = [];
            })
            // Get Profile
            .addCase(getProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(getProfile.fulfilled, (state, action) => {
                if (
                    state.token !== action.payload.sessionToken ||
                    state.sessionGeneration !== action.payload.sessionGeneration
                ) return;
                state.isLoading = false;
                state.user = action.payload.user;
            })
            .addCase(getProfile.rejected, (state, action) => {
                if (
                    state.token !== action.meta.sessionToken ||
                    state.sessionGeneration !== action.meta.sessionGeneration
                ) return;
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                if (
                    state.token !== action.payload.sessionToken ||
                    state.sessionGeneration !== action.payload.sessionGeneration
                ) return;
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
                state.message = 'Profile updated successfully';
            })
            .addCase(updateProfile.rejected, (state, action) => {
                if (
                    state.token !== action.meta.sessionToken ||
                    state.sessionGeneration !== action.meta.sessionGeneration
                ) return;
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Change Password
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(changePassword.fulfilled, (state, action) => {
                if (
                    state.token !== action.payload.sessionToken ||
                    state.sessionGeneration !== action.payload.sessionGeneration
                ) return;
                state.isLoading = false;
                state.authRequestId = null;
                state.googleAttemptId = null;
                state.isSuccess = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.sessionGeneration += 1;
                state.message = 'Password changed successfully';
            })
            .addCase(changePassword.rejected, (state, action) => {
                if (
                    state.token !== action.meta.sessionToken ||
                    state.sessionGeneration !== action.meta.sessionGeneration
                ) return;
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { googlePopupStarted, cancelGooglePopup, clearSession, reset, clearMessage, clearDailyLoginReward, clearPendingBadges, addPendingBadges } = authSlice.actions;
export default authSlice.reducer;
