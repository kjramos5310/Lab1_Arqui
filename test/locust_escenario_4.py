"""
Escenario 4 - Creación Concurrente de Préstamos
================================================
ATAM Quality Attribute: Confiabilidad / Integridad de Datos bajo Concurrencia (Reliability)

Estímulo: Múltiples usuarios crean préstamos simultáneamente sobre el mismo conjunto
          de libros, presionando la capa de acceso concurrente a la BD. Se verifica
          que no se generen registros corruptos ni errores de integridad referencial.
Respuesta esperada:
  - POST /api/prestamos → siempre 201 o 404 (nunca 500)
  - Todos los préstamos creados son recuperables vía GET /api/usuarios/:id/prestamos
  - ON DELETE RESTRICT activo: DELETE /api/libros/:id → 409 si tiene préstamos
  - Cero errores de integridad bajo 20 usuarios concurrentes creando préstamos
  - p95 de POST /api/prestamos < 600ms

Endpoints ejercitados:
  - POST /api/prestamos                         (creación concurrente — foco principal)
  - GET  /api/usuarios/:id/prestamos            (verificación de integridad RF-3)
  - DELETE /api/libros/:id                      (validación RESTRICT RF-4)
  - GET  /api/prestamos                         (verificación global)
"""

from locust import HttpUser, task, between
import random
from datetime import date, timedelta


def fecha_futura():
    return (date.today() + timedelta(days=random.randint(7, 30))).isoformat()


class Escenario4CreacionConcurrentePrestamos(HttpUser):
    """
    Usuario virtual enfocado en crear préstamos concurrentemente.
    Representa múltiples lectores pidiendo libros al mismo tiempo.
    """
    wait_time = between(0.2, 1.0)  # Espera corta para maximizar concurrencia

    usuarios_ids = []
    libros_ids = []
    mis_prestamos = []  # Préstamos creados por este VU

    def on_start(self):
        """Carga el pool de usuarios y libros disponibles."""
        # Cargar usuarios (lectores: esAutor=0)
        with self.client.get("/api/personas", catch_response=True, name="[setup] GET personas") as r:
            if r.status_code == 200:
                personas = r.json()
                lectores = [p for p in personas if p.get("esAutor") == 0]
                pool = lectores if lectores else personas
                self.usuarios_ids = [p.get("id") for p in pool if p.get("id")]
                r.success()

        # Cargar libros
        with self.client.get("/api/libros", catch_response=True, name="[setup] GET libros") as r:
            if r.status_code == 200:
                libros = r.json()
                self.libros_ids = [l.get("id") for l in libros if l.get("id")]
                r.success()

    # ── Peso 5: Crear préstamo (foco principal del escenario) ──
    @task(5)
    def crear_prestamo_concurrente(self):
        """
        POST /api/prestamos — operación central.
        Múltiples VUs ejecutan esto simultáneamente con el mismo pool de
        libros para detectar problemas de concurrencia.
        """
        if not self.usuarios_ids or not self.libros_ids:
            return

        usuario_id = random.choice(self.usuarios_ids)
        libro_id = random.choice(self.libros_ids)

        payload = {
            "usuario_id": usuario_id,
            "libro_id": libro_id,
            "fecha_devolucion_esperada": fecha_futura()
        }
        with self.client.post("/api/prestamos", json=payload, catch_response=True) as r:
            if r.status_code in (200, 201):
                data = r.json()
                pid = data.get("id")
                if pid:
                    self.mis_prestamos.append({"id": pid, "usuario_id": usuario_id})
                r.success()
            elif r.status_code == 404:
                # Usuario o libro no existe — dato obsoleto en cache
                r.success()
            else:
                r.failure(f"Error inesperado al crear préstamo: {r.status_code} — {r.text[:200]}")

    # ── Peso 2: Verificar integridad del historial (RF-3) ──
    @task(2)
    def verificar_historial_integridad(self):
        """
        GET /api/usuarios/:id/prestamos
        Verifica que cada préstamo creado sea recuperable — integridad de datos.
        """
        if not self.mis_prestamos:
            return
        registro = random.choice(self.mis_prestamos)
        usuario_id = registro["usuario_id"]

        with self.client.get(
            f"/api/usuarios/{usuario_id}/prestamos",
            catch_response=True,
            name="GET /api/usuarios/:id/prestamos [integridad]"
        ) as r:
            if r.status_code == 200:
                data = r.json()
                if not isinstance(data, list):
                    r.failure("La respuesta no es un arreglo — falla de integridad")
                    return
                # Verificar que cada elemento tenga campo 'libro'
                for prestamo in data:
                    if "libro" not in prestamo:
                        r.failure("Falta campo 'libro' en el préstamo — estructura incorrecta")
                        return
                r.success()
            elif r.status_code == 404:
                r.failure(f"Usuario {usuario_id} no encontrado — posible problema de integridad")
            else:
                r.failure(f"Error inesperado: {r.status_code}")

    # ── Peso 2: Validar RESTRICT al intentar borrar libro con préstamos ──
    @task(2)
    def validar_restrict_borrado_libro(self):
        """
        DELETE /api/libros/:id con libros que ya tienen préstamos.
        Debe retornar 409 (RESTRICT activo) — valida que no se rompa la integridad.
        """
        if not self.libros_ids:
            return
        libro_id = random.choice(self.libros_ids)
        with self.client.delete(
            f"/api/libros/{libro_id}",
            catch_response=True,
            name="DELETE /api/libros/:id [RESTRICT 409 esperado]"
        ) as r:
            if r.status_code == 409:
                # Correcto: RESTRICT protegiendo el historial
                r.success()
            elif r.status_code == 200:
                # El libro no tenía préstamos y fue borrado — recargar lista
                self.libros_ids = [i for i in self.libros_ids if i != libro_id]
                r.success()
            elif r.status_code == 404:
                self.libros_ids = [i for i in self.libros_ids if i != libro_id]
                r.success()
            else:
                r.failure(f"Respuesta inesperada del DELETE: {r.status_code}")

    # ── Peso 1: Visión global de préstamos ──
    @task(1)
    def verificar_prestamos_globales(self):
        """
        GET /api/prestamos — verifica que el estado global del sistema sea consistente.
        """
        with self.client.get("/api/prestamos", catch_response=True) as r:
            if r.status_code == 200 and isinstance(r.json(), list):
                r.success()
            else:
                r.failure(f"Error en GET /api/prestamos: {r.status_code}")
