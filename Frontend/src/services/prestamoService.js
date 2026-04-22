import { apiClient } from './apiClient';

export const prestamoService = {
  getPrestamos: () => apiClient('/prestamos'),
  getPrestamosPorUsuario: (userId) => apiClient(`/usuarios/${userId}/prestamos`),
  createPrestamo: (data) => apiClient('/prestamos', { method: 'POST', body: JSON.stringify(data) }),
  devolverPrestamo: (id) => apiClient(`/prestamos/${id}/devolver`, { method: 'PUT' })
};

export const usuarioService = {
  getLectores: () => apiClient('/usuarios') // Endpoint recien creado
};
