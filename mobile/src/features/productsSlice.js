import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../api';

export const fetchProducts = createAsyncThunk('products/fetchProducts', async () => {
  const data = await apiFetch('/api/products');
  return data.products;
});

const productsSlice = createSlice({
  name: 'products',
  initialState: {
    items: [],
    loading: false,
    error: ''
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load products.';
      });
  }
});

export default productsSlice.reducer;
