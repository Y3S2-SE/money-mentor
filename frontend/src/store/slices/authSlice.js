import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import authService from '../../services/authService';
import { addToast } from './toastSlice';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
    user: user || null,
    token: token || null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: '',
    dailyLoginReward: null,
    pendingBadges: []
};

const dispatchSequential = (thunkAPI, toasts, delayBetween = 1500) => {
    toasts.forEach((toast, index) => {
        if (!toast)  return;
        setTimeout(() => {
            thunkAPI.dispatch(addToast(toast));
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
    }
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
    }
);

// Logout user 
export const logout = createAsyncThunk(
    'auth/logout',
    async (_, thunkAPI) => {
        try {
            await authService.logout();
            thunkAPI.dispatch(addToast({
                type: 'info',
                message: 'Logged out successfully',
                subMessage: 'See you next time!'
            }));
        } catch (error) {
            console.error('Logout error:', error);
        }
    }
);

// Get user profile
export const getProfile = createAsyncThunk(
    'auth/getProfile',
    async (_, thunkAPI) => {
        try {
            const response = await authService.getProfile();
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to fetch profile';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Update profile
export const updateProfile = createAsyncThunk(
    'auth/updateProfile',
    async (userData, thunkAPI) => {
        try {
            const response = await authService.updateProfile(userData);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to update profile';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

// Change password
export const changePassword = createAsyncThunk(
    'auth/changePassword',
    async (passwordData, thunkAPI) => {
        try {
            const response = await authService.changePassword(passwordData);
            return response.data;
        } catch (error) {
            const message = error.response?.data?.message || error.message || 'Failed to chaneg password';
            return thunkAPI.rejectWithValue(message);
        }
    }
);

export const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
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
            .addCase(register.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(register.fulfilled, (state, action) => {
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
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.token = null;
            })
            // Login
            .addCase(login.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(login.fulfilled, (state, action) => {
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
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
                state.user = null;
                state.token = null;
            })
            // Logout
            .addCase(logout.fulfilled, (state) => {
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
                state.isLoading = false;
                state.user = action.payload;
            })
            .addCase(getProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Update Profile
            .addCase(updateProfile.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(updateProfile.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload;
                state.message = 'Profile updated successfully';
            })
            .addCase(updateProfile.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            })
            // Change Password
            .addCase(changePassword.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(changePassword.fulfilled, (state, action) => {
                state.isLoading = false;
                state.isSuccess = true;
                state.user = action.payload.user;
                state.token = action.payload.token;
                state.message = 'Password changed successfully';
            })
            .addCase(changePassword.rejected, (state, action) => {
                state.isLoading = false;
                state.isError = true;
                state.message = action.payload;
            });
    },
});

export const { reset, clearMessage, clearDailyLoginReward, clearPendingBadges, addPendingBadges } = authSlice.actions;
export default authSlice.reducer;