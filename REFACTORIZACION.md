# Refactorización: Sistema de Personas y Préstamos

## Cambios Realizados

### 1. Base de Datos (init.sql)
- **Renombrado**: tabla `autor` → tabla `persona`
- **Nuevo Campo**: `esAutor` (TINYINT(1)) 
  - 0 = Usuario (puede hacer préstamos)
  - 1 = Autor (puede crear libros)
- **Nueva Tabla**: `prestamo` para gestionar préstamos de libros

### 2. Modelos
- **Persona.js**: Reemplaza Autor.js con métodos mejorados
  - Con búsqueda por nombre/apellido
  - Manejo del booleano `esAutor`
- **Prestamo.js**: Nuevo modelo para gestionar préstamos
  - Historial de préstamos activos y devueltos
  - Estados: activo, devuelto, vencido

### 3. Controladores
- **personaController.js**: Reemplaza autorController.js
  - Nuevo endpoint: `buscarAutores` (GET /api/personas/buscar?q=...)
  - Búsqueda parcial en nombre/apellido
  - Solo devuelve personas con `esAutor=1`
- **prestamoController.js**: Nuevo controlador
  - Gestión completa de préstamos
  - Devolver libros (marcar como devueltos)

### 4. Rutas
- **/api/personas**: CRUD completo de personas
  - GET /api/personas/buscar?q=<cadena> → búsqueda de autores
  - POST, PUT, DELETE → crear/actualizar/eliminar personas
- **/api/prestamos**: Gestión de préstamos
  - GET /api/prestamos/:id/usuario → obtener préstamos de un usuario
  - POST → crear nuevo préstamo
  - PUT /api/prestamos/:id/devolver → marcar como devuelto

## Ventajas del Diseño

### Herencia en BD (Single Table Inheritance)
✓ **No duplica datos** entre tablas AUTOR y USUARIO
✓ **Flexible**: Una persona puede ser autor Y usuario
✓ **Mantenible**: Un único modelo de persona
✓ **Performante**: Sin JOINs complejos
✓ **Escalable**: Fácil agregar más roles con booleanos

## Ejemplos de Uso

### Crear un Autor
```json
POST /api/personas
{
  "nombre": "Gabriel",
  "apellido": "García Márquez",
  "fecha_nacimiento": "1927-03-06",
  "nacionalidad": "Colombiana",
  "correo_electronico": "gabriel@example.com",
  "esAutor": 1
}
```

### Crear un Usuario (Lector)
```json
POST /api/personas
{
  "nombre": "Juan",
  "apellido": "Pérez",
  "fecha_nacimiento": "2000-05-15",
  "nacionalidad": "Española",
  "correo_electronico": "juan@example.com",
  "esAutor": 0
}
```

### Buscar Autores
```
GET /api/personas/buscar?q=García
```

### Crear Préstamo
```json
POST /api/prestamos
{
  "usuario_id": 2,
  "libro_id": 1,
  "fecha_devolucion_esperada": "2026-05-17"
}
```

### Obtener Préstamos de un Usuario
```
GET /api/prestamos/usuario/2
```

## Compatibilidad Backwards
- `/api/autores` sigue funcionando (alias a `/api/personas`)
- Código existente de libros mantiene compatibilidad
