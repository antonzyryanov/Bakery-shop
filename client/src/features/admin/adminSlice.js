import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api.js';
import { fetchProducts } from '../products/productsSlice.js';

export const fetchAdminStats = createAsyncThunk('admin/fetchStats', async () => {
  const data = await apiFetch('/api/admin/stats');
  return data.stats;
});

export const fetchAdminOrders = createAsyncThunk('admin/fetchOrders', async (filter = 'last_month') => {
  const normalizedFilter = typeof filter === 'string'
    ? { range: filter }
    : {
      range: filter?.range || 'last_month',
      from: filter?.from || '',
      to: filter?.to || ''
    };

  const params = new URLSearchParams();
  params.set('range', normalizedFilter.range);
  if (normalizedFilter.range === 'custom') {
    if (normalizedFilter.from) {
      params.set('from', normalizedFilter.from);
    }
    if (normalizedFilter.to) {
      params.set('to', normalizedFilter.to);
    }
  }

  const data = await apiFetch(`/api/admin/orders?${params.toString()}`);
  return { range: normalizedFilter.range, orders: data.orders };
});

export const createAdminProduct = createAsyncThunk('admin/createProduct', async (payload, thunkApi) => {
  await apiFetch('/api/admin/products', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  thunkApi.dispatch(fetchAdminStats());
  await thunkApi.dispatch(fetchProducts());
});

export const updateAdminProduct = createAsyncThunk('admin/updateProduct', async ({ id, ...payload }, thunkApi) => {
  await apiFetch(`/api/admin/products/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await thunkApi.dispatch(fetchProducts());
});

export const deleteAdminProduct = createAsyncThunk('admin/deleteProduct', async (id, thunkApi) => {
  await apiFetch(`/api/admin/products/${id}`, { method: 'DELETE' });
  thunkApi.dispatch(fetchAdminStats());
  await thunkApi.dispatch(fetchProducts());
});

export const acceptAdminOrder = createAsyncThunk('admin/acceptOrder', async (orderId, thunkApi) => {
  const data = await apiFetch(`/api/admin/orders/${orderId}/accept`, { method: 'POST' });
  thunkApi.dispatch(fetchAdminStats());
  return data.order;
});

const adminSlice = createSlice({
  name: 'admin',
  initialState: {
    stats: null,
    orders: [],
    ordersRange: 'last_month',
    ordersLoading: false,
    ordersError: '',
    acceptingOrderId: '',
    loading: false,
    error: ''
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminStats.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchAdminStats.fulfilled, (state, action) => {
        state.loading = false;
        state.stats = action.payload;
      })
      .addCase(fetchAdminStats.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load admin stats.';
      })
      .addCase(fetchAdminOrders.pending, (state) => {
        state.ordersLoading = true;
        state.ordersError = '';
      })
      .addCase(fetchAdminOrders.fulfilled, (state, action) => {
        state.ordersLoading = false;
        state.orders = action.payload.orders;
        state.ordersRange = action.payload.range;
      })
      .addCase(fetchAdminOrders.rejected, (state, action) => {
        state.ordersLoading = false;
        state.ordersError = action.error.message || 'Failed to load orders.';
      })
      .addCase(acceptAdminOrder.pending, (state, action) => {
        state.acceptingOrderId = action.meta.arg;
        state.ordersError = '';
      })
      .addCase(acceptAdminOrder.fulfilled, (state, action) => {
        state.acceptingOrderId = '';
        const updated = action.payload;
        state.orders = state.orders.map((order) => (
          order.id === updated.id ? { ...order, status: updated.status } : order
        ));
      })
      .addCase(acceptAdminOrder.rejected, (state, action) => {
        state.acceptingOrderId = '';
        state.ordersError = action.error.message || 'Failed to accept order.';
      });
  }
});

export default adminSlice.reducer;
