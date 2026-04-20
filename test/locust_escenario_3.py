"""
Escenario 3 - Historial de Préstamos por Usuario (Disponibilidad)
==================================================================
ATAM Quality Attribute: Disponibilidad (Availability)

Estímulo: Alta tasa de consultas concurrentes al historial de préstamos de usuarios,
          mezclando IDs válidos e inválidos, para estresar el sistema y verificar
          que siempre responde correctamente (200 o 404, nunca 500).
Respuesta esperada:
  - GET /api/usuarios/:id/prestamos con ID válido   → 200 con arreglo JSON
  - GET /api/usuarios/:id/prestamos con ID inválido → 404 con mensaje
  - El sistema NUNCA debe responder 500 bajo carga normal
  - Disponibilidad: 99%+ (tasa de error de servicio < 1%)
  - p95 < 400ms con 25 usuarios simultáneos

Endpoints ejercitados:
  - GET /api/usuarios/:id/prestamos   (RF-3)
  - GET /api/personas                 (para obtener IDs válidos)
"""

from locust import HttpUser, task, between
import random

# IDs inválidos fijos para probar manejo de 404
IDS_INVALIDOS = [99999, 88888, 77777, 12345678, 0]


class Escenario3HistorialPrestamos(HttpUser):
    """
    Usuario virtual que consulta el historial de préstamos.
    Simula lectores revisando sus préstamos y stress-testing de disponibilidad.
    """
    wait_time = between(0.5, 2.0)

    ids_usuarios_validos = []

    def on_start(self):
        """Carga IDs de usuarios válidos al iniciar."""
        with self.client.get("/api/personas", catch_response=True, name="GET /api/personas [setup]") as resp:
            if resp.status_code == 200:
                personas = resp.json()
                self.ids_usuarios_validos = [p.get("id") for p in personas if p.get("id")]
                resp.success()
            else:
                resp.failure(f"No se pudieron cargar personas: {resp.status_code}")

    # ──────────────── TAREAS ────────────────

    @task(5)
    def consultar_prestamos_usuario_valido(self):
        """
        GET /api/usuarios/:id/prestamos con ID real.
        Debe retornar 200 y un arreglo JSON (puede estar vacío).
        Es la tarea principal — peso 5.
        """
        if not self.ids_usuarios_validos:
            self._recargar_usuarios()
            return

        usuario_id = random.choice(self.ids_usuarios_validos)
        with self.client.get(
            f"/api/usuarios/{usuario_id}/prestamos",
            catch_response=True,
            name="GET /api/usuarios/:id/prestamos [válido]"
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    resp.success()
                else:
                    resp.failure(f"Respuesta no es un arreglo: {type(data)}")
            elif resp.status_code == 404:
                # Usuario puede haber sido eliminado, actualizar cache
                self.ids_usuarios_validos = [i for i in self.ids_usuarios_validos if i != usuario_id]
                resp.success()
            else:
                resp.failure(f"Error inesperado: {resp.status_code} — {resp.text[:200]}")

    @task(2)
    def consultar_prestamos_usuario_invalido(self):
        """
        GET /api/usuarios/:id/prestamos con ID inexistente.
        Debe retornar 404 — verificar que el sistema maneja bien usuarios inexistentes.
        """
        usuario_id = random.choice(IDS_INVALIDOS)
        with self.client.get(
            f"/api/usuarios/{usuario_id}/prestamos",
            catch_response=True,
            name="GET /api/usuarios/:id/prestamos [404 esperado]"
        ) as resp:
            if resp.status_code == 404:
                resp.success()
            elif resp.status_code == 200:
                resp.failure(f"Debería ser 404 para usuario {usuario_id} inexistente")
            else:
                resp.failure(f"Error inesperado: {resp.status_code}")

    @task(1)
    def consultar_prestamos_usuario_string(self):
        """
        GET /api/usuarios/abc/prestamos con ID no numérico.
        Evalúa la robustez del sistema ante parámetros malformados.
        """
        with self.client.get(
            "/api/usuarios/abc/prestamos",
            catch_response=True,
            name="GET /api/usuarios/abc/prestamos [ID inválido]"
        ) as resp:
            # Cualquier respuesta definida (400 o 404) es aceptable, NO 500
            if resp.status_code in (400, 404, 200):
                resp.success()
            elif resp.status_code == 500:
                resp.failure("El sistema no debe devolver 500 ante IDs malformados")
            else:
                resp.success()  # cualquier otra respuesta controlada es aceptable

    @task(1)
    def listar_todos_prestamos(self):
        """
        GET /api/prestamos — lista global de préstamos.
        Evalúa el rendimiento de la consulta más pesada.
        """
        with self.client.get("/api/prestamos", catch_response=True) as resp:
            if resp.status_code == 200 and isinstance(resp.json(), list):
                resp.success()
            else:
                resp.failure(f"Error al listar préstamos: {resp.status_code}")

    def _recargar_usuarios(self):
        """Reintenta cargar IDs de usuarios si la cache está vacía."""
        with self.client.get("/api/personas", catch_response=True, name="GET /api/personas [recarga]") as resp:
            if resp.status_code == 200:
                personas = resp.json()
                self.ids_usuarios_validos = [p.get("id") for p in personas if p.get("id")]
                resp.success()
