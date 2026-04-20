# Sistema de Biblioteca — API REST

API REST para la gestión de una biblioteca: autores, libros, usuarios y préstamos.

## Tabla de Contenidos

1. [Modelado de Datos](#1-modelado-de-datos)
2. [Levantamiento del Entorno](#2-levantamiento-del-entorno)
3. [Endpoints de la API](#3-endpoints-de-la-api)
4. [Pruebas de Carga con Locust](#4-pruebas-de-carga-con-locust)

---

## 1. Modelado de Datos

### Estrategia Elegida: Herencia en Base de Datos (Single Table Inheritance — STI)

Se utiliza **una única tabla `persona`** con un campo discriminador `esAutor` (TINYINT 0/1) en lugar de crear tablas separadas `USUARIO` y `AUTOR`.

```sql
CREATE TABLE persona (
    id                 INT AUTO_INCREMENT PRIMARY KEY,
    nombre             VARCHAR(35) NOT NULL,
    apellido           VARCHAR(35) NOT NULL,
    fecha_nacimiento   DATE,
    nacionalidad       VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(255) UNIQUE,
    esAutor            TINYINT(1) DEFAULT 0   -- 0 = lector, 1 = autor
);
```

### Justificación de la Estrategia

| Criterio | STI (tabla única) | Tabla de roles (3 tablas) |
|---|---|---|
| **Rendimiento** | ✅ Sin JOIN para distinguir roles | ⚠️ JOIN entre usuario, rol, usuario_rol |
| **Mantenibilidad** | ✅ Un único modelo `Persona.js` | ⚠️ Tres modelos sincronizados |
| **Escalabilidad** | ✅ Nuevos campos opcionales sin migración compleja | ⚠️ Nuevos roles requieren filas en rol |
| **Flexibilidad** | ✅ Una persona puede ser autor Y lector | ⚠️ Requiere lógica extra de asociación |
| **Integridad referencial** | ✅ Un solo FK en `prestamo.usuario_id` | ⚠️ FK podría apuntar a tabla base o derivada |

**Ventajas en este contexto:**
- El dominio tiene exactamente 2 tipos de persona, con atributos idénticos → STI evita duplicación.
- Las consultas de préstamos (`JOIN persona ... WHERE p.usuario_id = persona.id`) son simples y directas.
- El campo `esAutor` actúa como filtro ligero en las búsquedas.

**Desventajas aceptadas:**
- Si los roles crecieran mucho (10+ tipos con atributos muy distintos), STI añadiría columnas NULL para subtipos no aplican → en ese caso se preferiría tabla de roles.
- El campo discriminador no es auto-validado por la BD (puede coexistir esAutor=0 con autor_id en libro si no hay validación en capa de aplicación).

### Tabla `prestamo` — Política de Eliminación

```sql
CREATE TABLE prestamo (
    id                       INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id               INT NOT NULL,
    libro_id                 INT NOT NULL,
    fecha_prestamo           DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_esperada DATE NOT NULL,
    fecha_devolucion_real    DATETIME,
    estado                   ENUM('activo', 'devuelto', 'vencido') DEFAULT 'activo',
    FOREIGN KEY (usuario_id) REFERENCES persona(id) ON DELETE RESTRICT,
    FOREIGN KEY (libro_id)   REFERENCES libro(id)   ON DELETE RESTRICT
);
```

Se eligió `ON DELETE RESTRICT` para **ambas FKs** con el fin de preservar la integridad del historial de préstamos: no se puede eliminar un libro ni un usuario si tienen préstamos asociados. La API retorna `409 Conflict` en este caso.

---

## 2. Levantamiento del Entorno

### Prerrequisitos

- [Docker Desktop](https://www.docker.com/products/docker-desktop)
- [Node.js ≥ 18](https://nodejs.org)
- [Python ≥ 3.9](https://www.python.org) + [Locust](https://locust.io)

### Paso 1 — Base de datos con Docker

```bash
# Levantar contenedor MySQL (incluye init.sql automáticamente)
docker-compose up -d

# Verificar que el contenedor está corriendo
docker ps

# Si ya tenías datos previos y necesitas reiniciar el schema:
docker-compose down -v
docker-compose up -d
```

> ⚠️ **Nota:** Si cambias `scripts/init.sql` debes hacer `docker-compose down -v` para que los cambios se apliquen (el volumen `mysql-data` persiste el estado anterior).

### Paso 2 — API Node.js

```bash
# Instalar dependencias
npm install

# Modo desarrollo (auto-restart con nodemon)
npm run dev

# Modo producción
npm start
```

La API queda disponible en `http://localhost:3000`.

Verificar:
```bash
curl http://localhost:3000/health
# { "status": "ok", "message": "API de biblioteca funcionando" }
```

### Paso 3 — Instalar y ejecutar Locust

```bash
# Instalar Locust
pip install locust

# Ejecutar un escenario (interfaz web en http://localhost:8089)
locust -f test/locust_escenario_1.py --host=http://localhost:3000

# Ejecutar en modo headless (sin interfaz web)
locust -f test/locust_escenario_2.py --host=http://localhost:3000 \
       --headless --users 20 --spawn-rate 5 --run-time 60s
```

---

## 3. Endpoints de la API

### Autores (`/api/autores` o `/api/personas`)

#### `GET /api/autores` — Listar todos los autores/personas
```bash
curl http://localhost:3000/api/autores
```

#### `GET /api/autores/buscar?q=<texto>` — Buscar autores (RF-2)
```bash
# Búsqueda normal
curl "http://localhost:3000/api/autores/buscar?q=García"

# Sin distinción de mayúsculas
curl "http://localhost:3000/api/autores/buscar?q=garcia"

# Sin parámetro → 400
curl "http://localhost:3000/api/autores/buscar"
```

**Respuesta exitosa (200):**
```json
[
  {
    "id": 1,
    "nombre": "Gabriel",
    "apellido": "García Márquez",
    "fecha_nacimiento": "1927-03-06",
    "nacionalidad": "Colombiana",
    "correo_electronico": "gabriel@example.com",
    "esAutor": 1
  }
]
```

**Sin parámetro q (400):**
```json
{ "error": "El parámetro de búsqueda es requerido" }
```

#### `POST /api/autores` — Crear persona/autor
```bash
curl -X POST http://localhost:3000/api/autores \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Isabel",
    "apellido": "Allende",
    "fecha_nacimiento": "1942-08-02",
    "nacionalidad": "Chilena",
    "correo_electronico": "isabel@example.com",
    "esAutor": 1
  }'
```

#### `PUT /api/autores/:id` — Actualizar
```bash
curl -X PUT http://localhost:3000/api/autores/1 \
  -H "Content-Type: application/json" \
  -d '{ "nombre": "Gabriel", "apellido": "García Márquez", "nacionalidad": "Colombiana", "correo_electronico": "gabriel@updated.com", "esAutor": 1 }'
```

#### `DELETE /api/autores/:id` — Eliminar
```bash
curl -X DELETE http://localhost:3000/api/autores/1
```

---

### Libros (`/api/libros`)

#### `GET /api/libros` — Listar libros
```bash
curl http://localhost:3000/api/libros
```

#### `POST /api/libros` — Crear libro
```bash
curl -X POST http://localhost:3000/api/libros \
  -H "Content-Type: application/json" \
  -d '{
    "titulo": "Cien Años de Soledad",
    "isbn": "978-84-204-2049-0",
    "anio_publicacion": 1967,
    "edicion": "1",
    "autor_id": 1
  }'
```

#### `DELETE /api/libros/:id` — Eliminar (falla si tiene préstamos)
```bash
curl -X DELETE http://localhost:3000/api/libros/1
# Si tiene préstamos → 409 Conflict
# { "error": "No se puede eliminar el libro porque tiene préstamos asociados (ON DELETE RESTRICT)" }
```

---

### Préstamos (`/api/prestamos` y `/api/usuarios`)

#### `GET /api/usuarios/:id/prestamos` — Historial de préstamos (RF-3)
```bash
# Usuario existente → 200
curl http://localhost:3000/api/usuarios/2/prestamos

# Usuario inexistente → 404
curl http://localhost:3000/api/usuarios/9999/prestamos
```

**Respuesta exitosa (200) — arreglo plano:**
```json
[
  {
    "id": 1,
    "fecha_prestamo": "2026-04-15T10:30:00.000Z",
    "fecha_devolucion": null,
    "libro": {
      "titulo": "Cien Años de Soledad",
      "isbn": "978-84-204-2049-0",
      "anio_publicacion": 1967
    }
  },
  {
    "id": 2,
    "fecha_prestamo": "2026-04-10T14:20:00.000Z",
    "fecha_devolucion": "2026-05-08T09:15:00.000Z",
    "libro": {
      "titulo": "Don Quijote",
      "isbn": "978-84-204-9033-0",
      "anio_publicacion": 1605
    }
  }
]
```

**Usuario no encontrado (404):**
```json
{ "error": "Usuario no encontrado" }
```

#### `POST /api/prestamos` — Crear préstamo
```bash
curl -X POST http://localhost:3000/api/prestamos \
  -H "Content-Type: application/json" \
  -d '{
    "usuario_id": 2,
    "libro_id": 1,
    "fecha_devolucion_esperada": "2026-05-30"
  }'
```

#### `PUT /api/prestamos/:id/devolver` — Devolver libro
```bash
curl -X PUT http://localhost:3000/api/prestamos/1/devolver
```

#### `GET /api/prestamos` — Listar todos los préstamos
```bash
curl http://localhost:3000/api/prestamos
```

---

## 4. Decisiones Técnicas Relevantes

### Índices en la Base de Datos

La tabla `persona` no tiene índice adicional sobre `(nombre, apellido)` dado el alcance actual del sistema. Sin embargo, la búsqueda `LIKE %q%` en ambos extremos **no puede usar un índice B-Tree clásico**. Para producción se recomendaría habilitar `FULLTEXT INDEX`:

```sql
ALTER TABLE persona ADD FULLTEXT INDEX ft_nombre_apellido (nombre, apellido);
-- Luego la consulta usaría: MATCH(nombre, apellido) AGAINST(? IN BOOLEAN MODE)
```

Por ahora, el filtro previo `esAutor = 1` reduce significativamente el espacio de búsqueda y la operación es aceptable a escala de biblioteca mediana.

### Manejo de Concurrencia en Préstamos

No se implementó un mecanismo de bloqueo optimista (p. ej. campo `version`) ni de reserva de ejemplares porque el modelo de datos no incluye el concepto de "stock de ejemplares". Cada `libro` es una entrada única; si múltiples usuarios solicitan el mismo libro simultáneamente, **todos** crearán un préstamo válido.

Para un sistema real se recomendaría:
1. Agregar campo `disponible TINYINT(1)` en `libro`.
2. Usar transacciones con `SELECT ... FOR UPDATE` al crear un préstamo para evitar condiciones de carrera.

### Política ON DELETE RESTRICT

Se eligió `ON DELETE RESTRICT` (en lugar de `CASCADE` o `SET NULL`) en ambas FKs de `prestamo` para **preservar el historial completo**. Esto implica:

- No se puede borrar un libro si tiene préstamos registrados → la API devuelve **409 Conflict**.
- No se puede borrar un usuario si tiene préstamos registrados → misma respuesta.
- Para eliminar, se debe primero registrar la devolución (`PUT /api/prestamos/:id/devolver`) y luego el borrado procederá.

### Estrategia de Rutas: Alias Backward-Compatible

Los endpoints nuevos (`/api/autores/...` y `/api/usuarios/...`) son **aliases** que montan los mismos controladores que las rutas originales (`/api/personas/...` y `/api/prestamos/...`). Esto garantiza que código cliente existente no se rompa.

---

## 5. Pruebas de Carga con Locust

### Escenario 1 — CRUD de Autores y Libros
**Atributo ATAM:** Rendimiento (Performance Efficiency)
```bash
locust -f test/locust_escenario_1.py --host=http://localhost:3000
```

### Escenario 2 — Búsqueda de Autores bajo Carga
**Atributo ATAM:** Rendimiento (Performance Efficiency)
```bash
locust -f test/locust_escenario_2.py --host=http://localhost:3000
```

### Escenario 3 — Historial de Préstamos (Disponibilidad)
**Atributo ATAM:** Disponibilidad (Availability)
```bash
locust -f test/locust_escenario_3.py --host=http://localhost:3000
```

### Escenario 4 — Ciclo Completo Préstamo → Devolución (Integridad)
**Atributo ATAM:** Confiabilidad / Integridad de Datos (Reliability)
```bash
locust -f test/locust_escenario_4.py --host=http://localhost:3000
```

Acceder a la interfaz web de Locust en: **http://localhost:8089**


