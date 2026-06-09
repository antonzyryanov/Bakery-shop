import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api.js';

export const placeOrder = createAsyncThunk('cart/placeOrder', async (_, thunkApi) => {
  const state = thunkApi.getState();
  const items = Object.entries(state.cart.items)
    .filter(([, quantity]) => quantity > 0)
    .map(([productId, quantity]) => ({ productId, quantity }));

  const data = await apiFetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items })
  });

  return data.order;
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: {
    items: {},
    placing: false,
    error: '',
    lastOrder: null
  },
  reducers: {
    incrementItem: (state, action) => {
      const id = action.payload;
      state.items[id] = (state.items[id] || 0) + 1;
    },
    decrementItem: (state, action) => {
      const id = action.payload;
      const current = state.items[id] || 0;
      if (current <= 1) {
        delete state.items[id];
      } else {
        state.items[id] = current - 1;
      }
    },
    clearCart: (state) => {
      state.items = {};
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(placeOrder.pending, (state) => {
        state.placing = true;
        state.error = '';
      })
      .addCase(placeOrder.fulfilled, (state, action) => {
        state.placing = false;
        state.lastOrder = action.payload;
        state.items = {};
      })
      .addCase(placeOrder.rejected, (state, action) => {
        state.placing = false;
        state.error = action.error.message || 'Order request failed.';
      });
  }
});

export const { incrementItem, decrementItem, clearCart } = cartSlice.actions;
export default cartSlice.reducer;
