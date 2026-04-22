import { apiClient } from './apiClient';

export const autorService = {
  getAutores: () => apiClient('/autores'),
  buscarAutores: (q) => apiClient(`/autores/buscar?q=${encodeURIComponent(q)}`),
  createAutor: (data) => apiClient('/autores', { method: 'POST', body: JSON.stringify(data) }),
  deleteAutor: (id) => apiClient(`/autores/${id}`, { method: 'DELETE' })
};
