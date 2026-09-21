// src/redux/inventorySlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { inventoryAPI } from '../api/endpoints/inventory';

export const fetchInventory = createAsyncThunk(
  'inventory/fetchInventory',
  async (params, { rejectWithValue }) => {
    try {
      const response = await inventoryAPI.getStockOverview(params);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const updateStock = createAsyncThunk(
  'inventory/updateStock',
  async (stockData, { rejectWithValue }) => {
    try {
      const response = await inventoryAPI.updateStock(stockData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    lowStockItems: [],
    loading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchInventory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchInventory.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        state.lowStockItems = action.payload.filter(
          item => item.stock <= item.reorderLevel
        );
      })
      .addCase(fetchInventory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message || 'Failed to fetch inventory';
      })
      .addCase(updateStock.fulfilled, (state, action) => {
        const index = state.items.findIndex(i => i._id === action.payload._id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
      });
  },
});

export const { clearError } = inventorySlice.actions;
export default inventorySlice.reducer;