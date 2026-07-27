import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../../app/api.js';

export const fetchMetricsLookups = createAsyncThunk('metrics/fetchLookups', async () => {
  return apiFetch('/api/metrics/lookups');
});

export const fetchMetricsEvents = createAsyncThunk('metrics/fetchEvents', async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, value);
    }
  });

  return apiFetch(`/api/metrics/events?${params.toString()}`);
});

export const fetchMetricsSummary = createAsyncThunk('metrics/fetchSummary', async (filters = {}) => {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      params.set(key, value);
    }
  });

  const data = await apiFetch(`/api/metrics/summary?${params.toString()}`);
  return data.summary;
});

const metricsSlice = createSlice({
  name: 'metrics',
  initialState: {
    lookups: { eventTypes: [], platforms: [], pages: [] },
    events: [],
    total: 0,
    summary: { byType: [], byPlatform: [] },
    loading: false,
    error: ''
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMetricsLookups.fulfilled, (state, action) => {
        state.lookups = action.payload;
      })
      .addCase(fetchMetricsEvents.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchMetricsEvents.fulfilled, (state, action) => {
        state.loading = false;
        state.events = action.payload.events || [];
        state.total = action.payload.total || 0;
      })
      .addCase(fetchMetricsEvents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load metrics.';
      })
      .addCase(fetchMetricsSummary.fulfilled, (state, action) => {
        state.summary = action.payload || { byType: [], byPlatform: [] };
      });
  }
});

export default metricsSlice.reducer;
