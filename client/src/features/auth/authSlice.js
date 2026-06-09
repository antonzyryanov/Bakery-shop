import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api.js';

export const registerUser = createAsyncThunk('auth/registerUser', async (payload) => {
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return data.user;
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload) => {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  return data.user;
});

export const loadSession = createAsyncThunk('auth/loadSession', async () => {
  const data = await apiFetch('/api/auth/me');
  return data.user;
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  await apiFetch('/api/auth/logout', { method: 'POST' });
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: '',
    fieldErrors: []
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = '';
      state.fieldErrors = [];
    }
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = '';
      state.fieldErrors = [];
    };

    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Request failed.';
      state.fieldErrors = action.error.details || [];
    };

    builder
      .addCase(registerUser.pending, pending)
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(registerUser.rejected, rejected)
      .addCase(loginUser.pending, pending)
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(loginUser.rejected, rejected)
      .addCase(loadSession.fulfilled, (state, action) => {
        state.user = action.payload;
      })
      .addCase(loadSession.rejected, (state) => {
        state.user = null;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
      });
  }
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;
