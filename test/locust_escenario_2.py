"""
Escenario 2 - Búsqueda de Autores bajo Carga
=============================================
ATAM Quality Attribute: Rendimiento / Eficiencia de Desempeño (Performance Efficiency)

Estímulo: Múltiples usuarios realizan búsquedas concurrentes de autores por nombre
          o apellido, incluyendo términos cortos, largos y vacíos.
Respuesta esperada:
  - GET /api/autores/buscar?q=<texto> → 200 con lista (puede ser vacía)
  - GET /api/autores/buscar (sin q)   → 400 con mensaje de error
  - p95 de tiempos de respuesta < 300ms con 30 usuarios simultáneos
  - Tasa de error < 1% (solo 400 por q ausente son esperados)

Endpoints ejercitados:
  - GET /api/autores/buscar?q=<término>   (RF-2)
  - GET /api/autores/buscar               (manejo de error 400)
"""

from locust import HttpUser, task, between
import random

TERMINOS_BUSQUEDA = [
    "García", "López", "Martínez", "Sánchez", "González",
    "ar", "jo", "ma", "pe", "ro",
    "za", "ex", "ia", "on", "el",
    "Cervantes", "Borges", "Neruda", "Paz", "Fuentes",
    "xyz_inexistente", "ñoño", "123", "autor", "lib",
]


class Escenario2BusquedaAutores(HttpUser):
    """
    Usuario virtual que simula la búsqueda concurrente de autores.
    Representa lectores y bibliotecarios buscando autores en el catálogo.
    """
    wait_time = between(0.3, 1.5)

    # ──────────────── TAREAS ────────────────

    @task(5)
    def buscar_autor_valido(self):
        """
        GET /api/autores/buscar?q=<término>
        Búsqueda válida con parámetro q presente.
        Verifica que el resultado sea siempre un arreglo (200), incluso si está vacío.
        Peso 5: operación principal del escenario.
        """
        termino = random.choice(TERMINOS_BUSQUEDA)
        with self.client.get(
            f"/api/autores/buscar?q={termino}",
            catch_response=True,
            name="GET /api/autores/buscar?q=<término>"
        ) as resp:
            if resp.status_code == 200:
                data = resp.json()
                if isinstance(data, list):
                    resp.success()
                else:
                    resp.failure(f"Respuesta no es un arreglo: {type(data)}")
            else:
                resp.failure(f"Error inesperado en búsqueda: {resp.status_code}")

    @task(2)
    def buscar_con_termino_partido(self):
        """
        Búsqueda con solo 1-2 caracteres — prueba el rendimiento con resultados amplios.
        """
        termino = random.choice(["a", "e", "i", "o", "r", "s", "m", "n"])
        with self.client.get(
            f"/api/autores/buscar?q={termino}",
            catch_response=True,
            name="GET /api/autores/buscar?q=<1char>"
        ) as resp:
            if resp.status_code == 200 and isinstance(resp.json(), list):
                resp.success()
            else:
                resp.failure(f"Error en búsqueda de 1 char: {resp.status_code}")

    @task(1)
    def buscar_sin_parametro_q(self):
        """
        GET /api/autores/buscar (sin parámetro q)
        Debe retornar 400 — esto es comportamiento esperado (no falla de servicio).
        Peso 1: es un caso de borde menos frecuente.
        """
        with self.client.get(
            "/api/autores/buscar",
            catch_response=True,
            name="GET /api/autores/buscar [sin q → 400]"
        ) as resp:
            if resp.status_code == 400:
                # 400 es el comportamiento CORRECTO cuando no se envía q
                resp.success()
            elif resp.status_code == 200:
                resp.failure("Debería retornar 400 cuando falta el parámetro q")
            else:
                resp.failure(f"Error inesperado: {resp.status_code}")

    @task(1)
    def buscar_termino_largo(self):
        """
        Búsqueda con un término largo para evaluar rendimiento bajo texto extenso.
        """
        terminos_largos = [
            "García Márquez", "Miguel de Cervantes", "Pablo Neruda",
            "Federico García Lorca", "Jorge Luis Borges"
        ]
        termino = random.choice(terminos_largos).replace(" ", "%20")
        with self.client.get(
            f"/api/autores/buscar?q={termino}",
            catch_response=True,
            name="GET /api/autores/buscar?q=<término largo>"
        ) as resp:
            if resp.status_code == 200 and isinstance(resp.json(), list):
                resp.success()
            else:
                resp.failure(f"Error en búsqueda larga: {resp.status_code}")
