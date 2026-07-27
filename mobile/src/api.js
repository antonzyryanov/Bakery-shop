import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from './config';

const TOKEN_KEY = 'bakery_access_token';

export const getAccessToken = async () => AsyncStorage.getItem(TOKEN_KEY);

export const setAccessToken = async (token) => {
  if (!token) {
    await AsyncStorage.removeItem(TOKEN_KEY);
    return;
  }

  await AsyncStorage.setItem(TOKEN_KEY, token);
};

export const apiFetch = async (path, options = {}) => {
  const headers = {
    Accept: 'application/json',
    'X-Client-Platform': 'MOBILE',
    ...(options.headers || {})
  };

  const token = await getAccessToken();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  if (options.body && !headers['Content-Type'] && !(typeof FormData !== 'undefined' && options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const error = new Error(errorBody.message || `Request failed (${response.status})`);
    error.status = response.status;
    error.details = errorBody.errors || [];
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
