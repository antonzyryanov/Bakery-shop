import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../api';

export const fetchMyOrders = createAsyncThunk('customerOrders/fetchMyOrders', async () => {
  const data = await apiFetch('/api/orders/mine');
  return data.orders || [];
});

export const cancelMyOrder = createAsyncThunk('customerOrders/cancelMyOrder', async (orderId) => {
  const data = await apiFetch(`/api/orders/${orderId}/cancel`, { method: 'POST' });
  return data.order;
});

export const fetchMyChat = createAsyncThunk('customerOrders/fetchMyChat', async () => {
  return apiFetch('/api/chat/me');
});

export const sendMyChatMessage = createAsyncThunk('customerOrders/sendMyChatMessage', async (body) => {
  const data = await apiFetch('/api/chat/me/messages', {
    method: 'POST',
    body: JSON.stringify({ body })
  });
  return data.message;
});

const customerOrdersSlice = createSlice({
  name: 'customerOrders',
  initialState: {
    orders: [],
    loading: false,
    error: '',
    messages: [],
    chatLoading: false,
    chatError: '',
    sending: false
  },
  reducers: {
    clearChatError: (state) => {
      state.chatError = '';
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchMyOrders.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchMyOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchMyOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load orders.';
      })
      .addCase(cancelMyOrder.fulfilled, (state, action) => {
        const updated = action.payload;
        state.orders = state.orders.map((order) => (
          order.id === updated.id
            ? { ...order, status: updated.status, canCancel: false }
            : order
        ));
      })
      .addCase(cancelMyOrder.rejected, (state, action) => {
        state.error = action.error.message || 'Failed to cancel order.';
      })
      .addCase(fetchMyChat.pending, (state) => {
        state.chatLoading = true;
        state.chatError = '';
      })
      .addCase(fetchMyChat.fulfilled, (state, action) => {
        state.chatLoading = false;
        state.messages = action.payload.messages || [];
      })
      .addCase(fetchMyChat.rejected, (state, action) => {
        state.chatLoading = false;
        state.chatError = action.error.message || 'Failed to load chat.';
      })
      .addCase(sendMyChatMessage.pending, (state) => {
        state.sending = true;
      })
      .addCase(sendMyChatMessage.fulfilled, (state, action) => {
        state.sending = false;
        state.messages.push(action.payload);
      })
      .addCase(sendMyChatMessage.rejected, (state, action) => {
        state.sending = false;
        state.chatError = action.error.message || 'Failed to send message.';
      });
  }
});

export const { clearChatError } = customerOrdersSlice.actions;
export default customerOrdersSlice.reducer;
