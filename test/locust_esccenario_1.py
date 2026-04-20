from locust import HttpUser, task, between
import random

class Escenario1(HttpUser):

    wait_time = between(0.3, 1.0)

    @task
    def obtener_autores(self):
        print("[LOCUST] Iniciando tarea: obtener_autores")
        with self.client.get("/api/autores", catch_response=True) as response:
            if response.status_code == 200:
                data = response.json()
                print(f"[LOCUST] obtener_autores - Status: {response.status_code}, Cantidad: {len(data)}")
                if isinstance(data, list) and len(data) > 0:
                    response.success()
                else:
                    response.failure("La respuesta no es una lista de autores o está vacía")
            else:
                print(f"[LOCUST] obtener_autores - Error: {response.status_code}")
                response.failure(f"Error al obtener autores: {response.status_code}")

    @task
    def createAutor(self):
        print("[LOCUST] Iniciando tarea: createAutor")
        new_autor = {
            "nombre": f"Nuevo Autor {random.randint(1, 1000)}",
            "apellido": "Apellido",
            "fecha_nacimiento": "1990-01-01",
            "nacionalidad": f"nacionalidad{random.randint(100, 999)}",
            "correo_electronico": f"correo_{random.randint(101, 1000)}@example.com",
            "esAutor": 1
        }
        print(f"[LOCUST] createAutor - Enviando: {new_autor}")
        with self.client.post("/api/autores", json=new_autor, catch_response=True) as response:
            print(f"[LOCUST] createAutor - Status: {response.status_code}")

    @task
    def updateAutor(self):
        print("[LOCUST] Iniciando tarea: updateAutor")
        # Get list of existing authors first
        with self.client.get("/api/autores", catch_response=True) as response:
            if response.status_code == 200 and len(response.json()) > 0:
                autores = response.json()
                # Pick a random existing author
                autor = random.choice(autores)
                autor_id = autor.get("id") or autor.get("_id")
                print(f"[LOCUST] updateAutor - Actualizando autor ID: {autor_id}")
                
                updated_autor = {
                    "nombre": f"Autor Actualizado {random.randint(1, 1000)}",
                    "apellido": "Apellido Actualizado",
                    "fecha_nacimiento": "1990-01-01",
                    "nacionalidad": f"nacionalidad{random.randint(100, 999)}",
                    "correo_electronico": f"correo_actualizado_{random.randint(101, 1000)}@example.com",
                    "esAutor": 1
                }
                print(f"[LOCUST] updateAutor - Enviando: {updated_autor}")
                with self.client.put(f"/api/autores/{autor_id}", json=updated_autor, catch_response=True) as response:
                    print(f"[LOCUST] updateAutor - Status: {response.status_code}")
    
    @task
    def deleteAutor(self):
        print("[LOCUST] Iniciando tarea: deleteAutor")
        # Get list of existing authors first
        with self.client.get("/api/autores", catch_response=True) as response:
            if response.status_code == 200 and len(response.json()) > 0:
                autores = response.json()
                # Pick a random existing author
                autor = random.choice(autores)
                autor_id = autor.get("id") or autor.get("_id")
                print(f"[LOCUST] deleteAutor - Eliminando autor ID: {autor_id}")
                with self.client.delete(f"/api/autores/{autor_id}", catch_response=True) as response:
                    print(f"[LOCUST] deleteAutor - Status: {response.status_code}")

    @task
    def createLibro(self):
        print("[LOCUST] Iniciando tarea: createLibro")
        # First get list of existing authors
        with self.client.get("/api/autores", catch_response=True) as response:
            if response.status_code == 200 and len(response.json()) > 0:
                autores = response.json()
                autor = random.choice(autores)
                autor_id = autor.get("id") or autor.get("_id")
                print(f"[LOCUST] createLibro - Autor seleccionado ID: {autor_id}")
                
                new_libro = {
                    "titulo": f"Nuevo Libro {random.randint(1, 1000)}",
                    "isbn": f"ISBN{random.randint(1000000000, 9999999999)}",
                    "anio_publicacion": 2020,
                    "edicion": 1,
                    "autor_id": autor_id
                }
                print(f"[LOCUST] createLibro - Enviando: {new_libro}")
                with self.client.post("/api/libros", json=new_libro, catch_response=True) as response:
                    print(f"[LOCUST] createLibro - Status: {response.status_code}")
            else:
                print("[LOCUST] createLibro - No hay autores disponibles")
        