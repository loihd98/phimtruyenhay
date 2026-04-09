import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import apiClient from "../../utils/api";
import { VipSubscription } from "../../types";

interface VipState {
  isVip: boolean;
  subscription: VipSubscription | null;
  isLoading: boolean;
}

const initialState: VipState = {
  isVip: false,
  subscription: null,
  isLoading: false,
};

export const fetchVipStatus = createAsyncThunk(
  "vip/fetchStatus",
  async (_, { rejectWithValue }) => {
    try {
      const res = await apiClient.get("/vip/status");
      return res.data?.data as { isVip: boolean; subscription: VipSubscription | null };
    } catch (error: any) {
      return rejectWithValue(error.message || "Failed to fetch VIP status");
    }
  }
);

const vipSlice = createSlice({
  name: "vip",
  initialState,
  reducers: {
    clearVipStatus: (state) => {
      state.isVip = false;
      state.subscription = null;
      state.isLoading = false;
    },
    setVipActive: (state, action) => {
      state.isVip = true;
      state.subscription = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVipStatus.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchVipStatus.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isVip = action.payload?.isVip ?? false;
        state.subscription = action.payload?.subscription ?? null;
      })
      .addCase(fetchVipStatus.rejected, (state) => {
        state.isLoading = false;
      });
  },
});

export const { clearVipStatus, setVipActive } = vipSlice.actions;
export default vipSlice.reducer;
