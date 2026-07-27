import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch, setAccessToken } from '../api';

export const registerUser = createAsyncThunk('auth/registerUser', async (payload) => {
  const data = await apiFetch('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await setAccessToken(data.token);
  return data.user;
});

export const loginUser = createAsyncThunk('auth/loginUser', async (payload) => {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
  await setAccessToken(data.token);
  return data.user;
});

export const loadSession = createAsyncThunk('auth/loadSession', async () => {
  const data = await apiFetch('/api/auth/me');
  return data.user;
});

export const logoutUser = createAsyncThunk('auth/logoutUser', async () => {
  try {
    await apiFetch('/api/auth/logout', { method: 'POST' });
  } catch (error) {
    // Ignore network logout failures; still clear local token.
  }
  await setAccessToken(null);
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    loading: false,
    error: ''
  },
  reducers: {
    clearAuthError: (state) => {
      state.error = '';
    }
  },
  extraReducers: (builder) => {
    const pending = (state) => {
      state.loading = true;
      state.error = '';
    };
    const rejected = (state, action) => {
      state.loading = false;
      state.error = action.error.message || 'Request failed.';
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
