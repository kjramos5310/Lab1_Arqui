import { apiClient } from './apiClient';

export const libroService = {
  getLibros: () => apiClient('/libros'),
  getLibroById: (id) => apiClient(`/libros/${id}`),
  createLibro: (data) => apiClient('/libros', { method: 'POST', body: JSON.stringify(data) }),
  updateLibro: (id, data) => apiClient(`/libros/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteLibro: (id) => apiClient(`/libros/${id}`, { method: 'DELETE' })
};
