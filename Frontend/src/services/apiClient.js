const BASE_URL = '/api';

export const apiClient = async (endpoint, options = {}) => {
  const url = `${BASE_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json().catch(() => null);

    if (!response.ok) {
        throw new Error(data?.error || `Error HTTP: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};
