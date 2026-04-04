import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import gamificationSerivce from "../../services/gamificationService";

export const fetchProfile = createAsyncThunk(
    'gamification/fetchProfile',
    async (sync = false, { rejectWithValue }) => {
        try {
            const res = await gamificationSerivce.getProfile(sync);
            return res;
        } catch (error) {
            return rejectWithValue(error.message);
        }
    }
);

const gamingSlice = createSlice({
    name: 'gamification',
    initialState: { profile: null, loading: false, lastFetched: null },
    reducers: {
        invalidateProfile : (state) => {
            state.lastFetched = null;
        },
    },
    extraReducers: (buidler) => {
        buidler
            .addCase(fetchProfile.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchProfile.fulfilled, (state, action) => {
                state.profile = action.payload.data;
                state.loading = false;
                state.lastFetched = Date.now();
            })
            .addCase(fetchProfile.rejected, (state) => {
                state.loading = false;
            });
    },
});

export const { invalidateProfile } = gamingSlice.actions;
export default gamingSlice.reducer;