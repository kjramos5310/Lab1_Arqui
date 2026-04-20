"""
Escenario 1 - Carga Mixta (Todos los Nuevos Endpoints)
=======================================================
ATAM Quality Attribute: Rendimiento / Eficiencia de Desempeño (Performance Efficiency)

Estímulo: Múltiples usuarios concurrentes ejecutan simultáneamente todos los
          nuevos endpoints del sistema: búsqueda de autores, consulta de historial
          de préstamos, creación de préstamos y devoluciones. Representa el uso
          real del sistema bajo carga heterogénea.
Respuesta esperada:
  - Todos los endpoints responden correctamente bajo carga combinada
  - p95 global < 600ms con 25 usuarios simultáneos
  - Tasa de error de servicio < 2%

Endpoints ejercitados (carga mixta de los 4 nuevos endpoints):
  - GET /api/autores/buscar?q=<texto>         (RF-2)
  - GET /api/usuarios/:id/prestamos           (RF-3)
  - POST /api/prestamos                       (nuevo)
  - PUT  /api/prestamos/:id/devolver          (nuevo)
  - GET  /api/autores                         (base)
  - GET  /api/libros                          (base)
"""

from locust import HttpUser, task, between
import random
from datetime import date, timedelta

TERMINOS = ["García", "ar", "Cervantes", "ma", "pe", "Borges", "ro", "za"]


def fecha_futura():
    return (date.today() + timedelta(days=random.randint(7, 30))).isoformat()


class Escenario1CargaMixta(HttpUser):
    """
    Usuario virtual que mezcla todos los nuevos endpoints en proporciones
    similares a un uso real del sistema de biblioteca.
    """
    wait_time = between(0.5, 2.0)

    usuario_id = None
    libro_id = None
    prestamos_abiertos = []

    def on_start(self):
        """Carga datos base al iniciar el usuario virtual."""
        # Cargar un usuario válido
        with self.client.get("/api/personas", catch_response=True, name="[setup] GET personas") as r:
            if r.status_code == 200:
                personas = r.json()
                lectores = [p for p in personas if p.get("esAutor") == 0]
                pool = lectores if lectores else personas
                if pool:
                    self.usuario_id = random.choice(pool).get("id")
                r.success()

        # Cargar un libro válido
        with self.client.get("/api/libros", catch_response=True, name="[setup] GET libros") as r:
            if r.status_code == 200:
                libros = r.json()
                if libros:
                    self.libro_id = random.choice(libros).get("id")
                r.success()

    # ── Peso 3: Búsqueda de autores (RF-2) ──
    @task(3)
    def buscar_autores(self):
        termino = random.choice(TERMINOS)
        with self.client.get(
            f"/api/autores/buscar?q={termino}",
            catch_response=True,
            name="GET /api/autores/buscar?q="
        ) as r:
            if r.status_code == 200 and isinstance(r.json(), list):
                r.success()
            else:
                r.failure(f"buscar_autores: {r.status_code}")

    # ── Peso 3: Consulta historial por usuario (RF-3) ──
    @task(3)
    def historial_prestamos(self):
        if not self.usuario_id:
            return
        with self.client.get(
            f"/api/usuarios/{self.usuario_id}/prestamos",
            catch_response=True,
            name="GET /api/usuarios/:id/prestamos"
        ) as r:
            if r.status_code == 200 and isinstance(r.json(), list):
                r.success()
            elif r.status_code == 404:
                r.success()
            else:
                r.failure(f"historial: {r.status_code}")

    # ── Peso 2: Crear préstamo ──
    @task(2)
    def crear_prestamo(self):
        if not self.usuario_id or not self.libro_id:
            return
        payload = {
            "usuario_id": self.usuario_id,
            "libro_id": self.libro_id,
            "fecha_devolucion_esperada": fecha_futura()
        }
        with self.client.post("/api/prestamos", json=payload, catch_response=True) as r:
            if r.status_code in (200, 201):
                pid = r.json().get("id")
                if pid:
                    self.prestamos_abiertos.append(pid)
                r.success()
            elif r.status_code == 404:
                r.success()
            else:
                r.failure(f"crear_prestamo: {r.status_code} {r.text[:150]}")

    # ── Peso 2: Devolver préstamo ──
    @task(2)
    def devolver_prestamo(self):
        if not self.prestamos_abiertos:
            return
        pid = self.prestamos_abiertos.pop(0)
        with self.client.put(
            f"/api/prestamos/{pid}/devolver",
            catch_response=True,
            name="PUT /api/prestamos/:id/devolver"
        ) as r:
            if r.status_code in (200, 404):
                r.success()
            else:
                r.failure(f"devolver: {r.status_code}")

    # ── Peso 1: Listar autores ──
    @task(1)
    def listar_autores(self):
        with self.client.get("/api/autores", catch_response=True) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"listar_autores: {r.status_code}")

    # ── Peso 1: Listar libros ──
    @task(1)
    def listar_libros(self):
        with self.client.get("/api/libros", catch_response=True) as r:
            if r.status_code == 200:
                r.success()
            else:
                r.failure(f"listar_libros: {r.status_code}")
