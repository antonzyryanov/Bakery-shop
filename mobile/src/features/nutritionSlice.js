import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { apiFetch } from '../api';

const buildQuery = (filter) => {
  const params = new URLSearchParams();
  params.set('range', filter.range || 'last_month');
  if (filter.range === 'custom') {
    if (filter.from) params.set('from', filter.from);
    if (filter.to) params.set('to', filter.to);
  }
  return params.toString();
};

export const fetchNutritionEntries = createAsyncThunk('nutrition/fetchEntries', async (filter = { range: 'last_month' }) => {
  const data = await apiFetch(`/api/nutrition/entries?${buildQuery(filter)}`);
  return { range: filter.range || 'last_month', entries: data.entries || [] };
});

export const fetchNutritionStats = createAsyncThunk('nutrition/fetchStats', async (filter = { range: 'last_month' }) => {
  const data = await apiFetch(`/api/nutrition/stats?${buildQuery(filter)}`);
  return { range: filter.range || 'last_month', stats: data.stats };
});

export const addNutritionDish = createAsyncThunk('nutrition/addDish', async (formData) => {
  const tokenHeaders = {};
  const data = await apiFetch('/api/nutrition/entries', {
    method: 'POST',
    headers: tokenHeaders,
    body: formData
  });
  return data.entry;
});

const nutritionSlice = createSlice({
  name: 'nutrition',
  initialState: {
    entries: [],
    stats: null,
    range: 'last_month',
    loading: false,
    statsLoading: false,
    saving: false,
    error: ''
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNutritionEntries.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchNutritionEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload.entries;
        state.range = action.payload.range;
      })
      .addCase(fetchNutritionEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load nutrition entries.';
      })
      .addCase(fetchNutritionStats.pending, (state) => {
        state.statsLoading = true;
      })
      .addCase(fetchNutritionStats.fulfilled, (state, action) => {
        state.statsLoading = false;
        state.stats = action.payload.stats;
        state.range = action.payload.range;
      })
      .addCase(fetchNutritionStats.rejected, (state, action) => {
        state.statsLoading = false;
        state.error = action.error.message || 'Failed to load nutrition stats.';
      })
      .addCase(addNutritionDish.pending, (state) => {
        state.saving = true;
        state.error = '';
      })
      .addCase(addNutritionDish.fulfilled, (state, action) => {
        state.saving = false;
        state.entries = [action.payload, ...state.entries];
      })
      .addCase(addNutritionDish.rejected, (state, action) => {
        state.saving = false;
        state.error = action.error.message || 'Failed to save dish.';
      });
  }
});

export default nutritionSlice.reducer;
