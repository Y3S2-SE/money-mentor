import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import authService from '../../services/authService';

// Get user from localStorage
const user = JSON.parse(localStorage.getItem('user'));
const token = localStorage.getItem('token');

const initialState = {
    user: user || null,
    token: token || null,
    isLoading: false,
    isSuccess: false,
    isError: false,
    message: ''
};

// Register user
export const register = createAsyncThunk(
    'auth/register',
    async (userData, thunkAPI) => {
        try {
            const response = await authService.register(userData);
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

export const { reset, clearMessage } = authSlice.actions;
export default authSlice.reducer;