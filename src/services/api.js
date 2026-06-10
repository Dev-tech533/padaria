const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

export async function apiFetch(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  return response;
}

export { API_BASE_URL };
