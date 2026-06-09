let csrfToken = null;

const getCsrfToken = async () => {
  if (csrfToken) {
    return csrfToken;
  }

  const response = await fetch('/api/security/csrf-token', {
    method: 'GET',
    credentials: 'include'
  });

  if (!response.ok) {
    throw new Error('Failed to fetch CSRF token.');
  }

  const data = await response.json();
  csrfToken = data.csrfToken;
  return csrfToken;
};

export const apiFetch = async (url, options = {}) => {
  const method = (options.method || 'GET').toUpperCase();
  const headers = { ...(options.headers || {}) };

  if (method !== 'GET' && method !== 'HEAD') {
    const token = await getCsrfToken();
    headers['x-csrf-token'] = token;
  }

  const response = await fetch(url, {
    ...options,
    headers,
    credentials: 'include'
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = errorBody.message || `Request failed with status ${response.status}`;
    const error = new Error(message);
    error.status = response.status;
    error.details = errorBody.errors || [];
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
};
