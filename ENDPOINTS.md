# Nuevos Endpoints API

## Búsqueda de Autores

### GET /api/personas/buscar?q=<cadena>
Busca autores (personas con esAutor=1) por coincidencia parcial en nombre o apellido.

**Ejemplo:**
```bash
curl "http://localhost:3000/api/personas/buscar?q=García"
```

**Respuesta:**
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
  },
  {
    "id": 3,
    "nombre": "Federico",
    "apellido": "García Lorca",
    "fecha_nacimiento": "1898-06-05",
    "nacionalidad": "Española",
    "correo_electronico": "fgarca@example.com",
    "esAutor": 1
  }
]
```

---

## Préstamos de Usuarios

### GET /api/prestamos/usuario/:id
Obtiene todos los préstamos (activos, devueltos, vencidos) de un usuario específico.

**Ejemplo:**
```bash
curl "http://localhost:3000/api/prestamos/usuario/2"
```

**Respuesta:**
```json
{
  "usuario": {
    "id": 2,
    "nombre": "Juan",
    "apellido": "Pérez",
    "correo_electronico": "juan@example.com"
  },
  "prestamos": [
    {
      "id": 1,
      "usuario_id": 2,
      "libro_id": 1,
      "fecha_prestamo": "2026-04-15T10:30:00.000Z",
      "fecha_devolucion_esperada": "2026-05-15",
      "fecha_devolucion_real": null,
      "estado": "activo",
      "libro_titulo": "Cien Años de Soledad",
      "isbn": "978-84-204-2049-0",
      "autor_nombre": "Gabriel",
      "autor_apellido": "García Márquez"
    },
    {
      "id": 2,
      "usuario_id": 2,
      "libro_id": 2,
      "fecha_prestamo": "2026-04-10T14:20:00.000Z",
      "fecha_devolucion_esperada": "2026-05-10",
      "fecha_devolucion_real": "2026-05-08T09:15:00.000Z",
      "estado": "devuelto",
      "libro_titulo": "Don Quijote",
      "isbn": "978-84-204-9033-0",
      "autor_nombre": "Miguel",
      "autor_apellido": "de Cervantes"
    }
  ]
}
```

---

## Crear Préstamo

### POST /api/prestamos
Crea un nuevo préstamo de libro para un usuario.

**Body:**
```json
{
  "usuario_id": 2,
  "libro_id": 1,
  "fecha_devolucion_esperada": "2026-05-17"
}
```

**Respuesta:**
```json
{
  "id": 3,
  "usuario_id": 2,
  "libro_id": 1,
  "fecha_devolucion_esperada": "2026-05-17"
}
```

---

## Devolver Préstamo

### PUT /api/prestamos/:id/devolver
Marca un préstamo como devuelto (registra la fecha y cambia estado).

**Ejemplo:**
```bash
curl -X PUT "http://localhost:3000/api/prestamos/3/devolver"
```

**Respuesta:**
```json
{
  "message": "Libro devuelto exitosamente"
}
```

---

## Endpoints Existentes (Compatibles)

### GET /api/personas
Obtiene todas las personas (autores y usuarios)

### POST /api/personas
Crea una nueva persona

**Body:**
```json
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "2000-05-15",
  "nacionalidad": "Española",
  "correo_electronico": "juan@example.com",
  "esAutor": 0
}
```

### PUT /api/personas/:id
Actualiza una persona (incluyendo el estado de esAutor)

### DELETE /api/personas/:id
Elimina una persona

### GET /api/libros
Obtiene todos los libros

### POST /api/libros
Crea un nuevo libro (solo autores con esAutor=1)

### PUT /api/libros/:id
Actualiza un libro

### DELETE /api/libros/:id
Elimina un libro

---

## Notas

- Los parámetros de búsqueda son **case-insensitive** (no distinguen mayúsculas)
- La búsqueda de autores busca en el nombre Y apellido
- Los préstamos se filtran automáticamente por usuario
- Los estados de préstamo son: `activo`, `devuelto`, `vencido`
