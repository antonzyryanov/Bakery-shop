import { nutritionApiFetch } from './nutritionClient.js';

const buildQuery = (params) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      search.set(key, String(value));
    }
  });
  return search.toString();
};

export const listNutritionEntries = async ({ userId, range, from, to }) => {
  const query = buildQuery({
    user_id: userId,
    range,
    from,
    to
  });
  return nutritionApiFetch(`/api/v1/entries?${query}`);
};

export const createNutritionEntry = async ({ userId, payload }) => {
  const query = buildQuery({ user_id: userId });
  return nutritionApiFetch(`/api/v1/entries?${query}`, {
    method: 'POST',
    body: JSON.stringify(payload)
  });
};

export const getNutritionStats = async ({ userId, range, from, to }) => {
  const query = buildQuery({
    user_id: userId,
    range,
    from,
    to
  });
  return nutritionApiFetch(`/api/v1/stats?${query}`);
};
