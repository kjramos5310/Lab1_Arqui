# Reporte ATAM — Sistema de Biblioteca

**Método:** Architecture Tradeoff Analysis Method (ATAM)  
**Sistema evaluado:** API REST de Biblioteca (Node.js + MySQL)  
**Fecha:** Abril 2026

---

## Introducción

Este reporte documenta los cuatro escenarios de calidad evaluados mediante pruebas de carga con Locust, siguiendo el método ATAM. Cada escenario se diseñó para estresar un atributo de calidad específico relacionado con los nuevos endpoints y la interacción entre las entidades `persona`, `libro` y `prestamo`.

Los escenarios fueron ejecutados sobre el sistema levantado localmente:
- **API:** `http://localhost:3000` (Node.js + Express)
- **BD:** MySQL 8 en Docker
- **Herramienta:** Locust

---

## Escenario 1 — CRUD de Autores y Libros

### Tabla ATAM

| Campo | Descripción |
|---|---|
| **Atributo de Calidad** | Rendimiento / Eficiencia de Desempeño (Performance Efficiency) |
| **Estímulo** | 20 usuarios concurrentes realizan operaciones CRUD (GET, POST, PUT) sobre autores y libros de forma sostenida durante 2 minutos |
| **Fuente del Estímulo** | Usuarios del sistema (bibliotecarios administrando el catálogo) |
| **Entorno** | Operación normal, sistema en estado estable con datos cargados |
| **Artefacto** | Endpoints `/api/autores` y `/api/libros` |
| **Respuesta** | El sistema procesa todas las peticiones; ninguna operación devuelve 500 |
| **Medida de Respuesta** | p50 < 100ms · p95 < 500ms · Tasa de error < 2% · RPS > 50 |

### Configuración de la Prueba

```bash
locust -f test/locust_escenario_1.py --host=http://localhost:3000 \
       --headless --users 20 --spawn-rate 5 --run-time 120s
```

### Resultados

| Métrica | Valor Obtenido |
|---|---|
| Usuarios simulados | 20 |
| Duración | 120 s |
| Total de peticiones | — |
| RPS promedio | — |
| p50 (mediana) | — ms |
| p95 | — ms |
| p99 | — ms |
| Tasa de error | — % |
| Peticiones fallidas | — |

### Capturas de Locust

**[Insertar captura: vista general de estadísticas - Escenario 1]**

**[Insertar captura: gráfica de tiempos de respuesta - Escenario 1]**

### Análisis

> _Completar tras ejecutar la prueba._

---

## Escenario 2 — Búsqueda de Autores bajo Carga

### Tabla ATAM

| Campo | Descripción |
|---|---|
| **Atributo de Calidad** | Rendimiento / Eficiencia de Desempeño (Performance Efficiency) |
| **Estímulo** | 30 usuarios concurrentes ejecutan búsquedas de autores con términos variados (cortos, largos, inexistentes) y sin parámetro `q` |
| **Fuente del Estímulo** | Lectores y bibliotecarios realizando búsquedas en el catálogo |
| **Entorno** | Pico de carga moderado-alto |
| **Artefacto** | Endpoint `GET /api/autores/buscar?q=<texto>` (RF-2) |
| **Respuesta** | 200 con lista para búsquedas válidas; 400 cuando falta el parámetro `q`; nunca 500 |
| **Medida de Respuesta** | p95 < 300ms · Tasa de error de servicio < 1% · RPS > 80 |

### Configuración de la Prueba

```bash
locust -f test/locust_escenario_2.py --host=http://localhost:3000 \
       --headless --users 30 --spawn-rate 10 --run-time 120s
```

### Resultados

| Endpoint | Peticiones | RPS | p50 (ms) | p95 (ms) | Errores |
|---|---|---|---|---|---|
| GET /api/autores/buscar?q=\<término\> | — | — | — | — | — |
| GET /api/autores/buscar?q=\<1char\> | — | — | — | — | — |
| GET /api/autores/buscar [sin q → 400] | — | — | — | — | — |
| GET /api/autores/buscar?q=\<término largo\> | — | — | — | — | — |

| Métrica Global | Valor |
|---|---|
| Total peticiones | — |
| RPS promedio | — |
| p95 global | — ms |
| Tasa de error (500s) | — % |

### Capturas de Locust

**[Insertar captura: tabla de estadísticas por endpoint - Escenario 2]**

**[Insertar captura: gráfica RPS vs tiempo - Escenario 2]**

### Análisis

> _Completar tras ejecutar la prueba._

Las peticiones sin parámetro `q` devuelven 400 por diseño (RF-2) y **no cuentan como errores de servicio**. Se espera que la búsqueda `LIKE` en MySQL sea eficiente gracias a la cláusula `esAutor = 1` que reduce el espacio de búsqueda.

---

## Escenario 3 — Historial de Préstamos por Usuario (Disponibilidad)

### Tabla ATAM

| Campo | Descripción |
|---|---|
| **Atributo de Calidad** | Disponibilidad (Availability) |
| **Estímulo** | 25 usuarios concurrentes consultan el historial de préstamos, mezclando IDs válidos, IDs inválidos (999999) e IDs malformados (cadenas de texto) |
| **Fuente del Estímulo** | Lectores revisando sus préstamos y peticiones erróneas de clientes mal configurados |
| **Entorno** | Operación sostenida; el sistema no debe degradarse ante entradas incorrectas |
| **Artefacto** | Endpoint `GET /api/usuarios/:id/prestamos` (RF-3) |
| **Respuesta** | 200 para IDs válidos; 404 para IDs inexistentes; **nunca 500** ante ningún input |
| **Medida de Respuesta** | Disponibilidad ≥ 99% · p95 < 400ms · 0 errores 500 durante la prueba |

### Configuración de la Prueba

```bash
locust -f test/locust_escenario_3.py --host=http://localhost:3000 \
       --headless --users 25 --spawn-rate 5 --run-time 120s
```

### Resultados

| Endpoint | Peticiones | p50 (ms) | p95 (ms) | Código Esperado | Errores |
|---|---|---|---|---|---|
| GET /api/usuarios/:id/prestamos [válido] | — | — | — | 200 | — |
| GET /api/usuarios/:id/prestamos [404] | — | — | — | 404 | — |
| GET /api/usuarios/abc/prestamos | — | — | — | 400/404 | — |
| GET /api/prestamos | — | — | — | 200 | — |

| Métrica | Valor |
|---|---|
| Disponibilidad medida | — % |
| Errores 500 | — |
| p95 global | — ms |

### Capturas de Locust

**[Insertar captura: tabla de estadísticas - Escenario 3]**

**[Insertar captura: gráfica de fallos vs tiempo - Escenario 3]**

### Análisis

> _Completar tras ejecutar la prueba._

El escenario valida que el JOIN entre `prestamo`, `libro` y `persona` en `findByUsuarioId` escala correctamente bajo carga. La ausencia de errores 500 ante IDs malformados confirma la robustez del manejo de errores en el controlador.

---

## Escenario 4 — Ciclo Completo: Préstamo → Consulta → Devolución (Confiabilidad)

### Tabla ATAM

| Campo | Descripción |
|---|---|
| **Atributo de Calidad** | Confiabilidad / Integridad de Datos (Reliability) |
| **Estímulo** | 15 usuarios concurrentes ejecutan el ciclo completo: crear préstamo → consultar historial → devolver libro, y adicionalmente intentan eliminar libros con préstamos activos |
| **Fuente del Estímulo** | Flujo real de uso: lectores pidiendo y devolviendo libros |
| **Entorno** | Carga moderada con operaciones de escritura intensas; validación de FK RESTRICT |
| **Artefacto** | `POST /api/prestamos`, `GET /api/usuarios/:id/prestamos`, `PUT /api/prestamos/:id/devolver`, `DELETE /api/libros/:id` |
| **Respuesta** | Todos los préstamos creados aparecen en el historial (integridad); los intentos de borrar libros con préstamos retornan 409 (RESTRICT activo) |
| **Medida de Respuesta** | 0 préstamos huérfanos · 100% de 409 al intentar borrar libros con préstamos · p95 del ciclo completo < 800ms |

### Configuración de la Prueba

```bash
locust -f test/locust_escenario_4.py --host=http://localhost:3000 \
       --headless --users 15 --spawn-rate 3 --run-time 180s
```

### Resultados

| Endpoint | Peticiones | p50 (ms) | p95 (ms) | Resultado Esperado | Errores |
|---|---|---|---|---|---|
| POST /api/prestamos | — | — | — | 201 Created | — |
| GET /api/usuarios/:id/prestamos [ciclo] | — | — | — | 200 Array | — |
| PUT /api/prestamos/:id/devolver | — | — | — | 200 OK | — |
| DELETE /api/libros/:id [RESTRICT test] | — | — | — | 409 Conflict | — |
| GET /api/prestamos | — | — | — | 200 Array | — |

| Métrica de Integridad | Valor |
|---|---|
| Préstamos creados | — |
| Préstamos devueltos | — |
| Intentos de borrado con RESTRICT | — |
| 409 Conflict recibidos (esperados) | — |
| Errores de integridad (500/inconsistencias) | — |

### Capturas de Locust

**[Insertar captura: estadísticas del ciclo completo - Escenario 4]**

**[Insertar captura: gráfica de tiempos por endpoint - Escenario 4]**

### Análisis

> _Completar tras ejecutar la prueba._

Este escenario es el más exigente para la integridad referencial. El `ON DELETE RESTRICT` en `libro_id` garantiza que nunca se pueda borrar un libro mientras tenga préstamos, protegiendo el historial. Se espera que todos los intentos de `DELETE /api/libros/:id` sobre libros con préstamos devuelvan 409, validando que la política de la BD y la capa de control del API funcionan de forma coordinada.

---

## Resumen Comparativo de Escenarios

| Escenario | Atributo ATAM | Usuarios | p95 Objetivo | Tasa error objetivo | Resultado |
|---|---|---|---|---|---|
| 1 — CRUD Autores/Libros | Rendimiento | 20 | < 500ms | < 2% | — |
| 2 — Búsqueda Autores | Rendimiento | 30 | < 300ms | < 1% (solo 500s) | — |
| 3 — Historial Préstamos | Disponibilidad | 25 | < 400ms | 0 errores 500 | — |
| 4 — Ciclo Completo | Confiabilidad | 15 | < 800ms | 0 inconsistencias | — |

---

## Conclusiones

> _Completar con el análisis final tras ejecutar todos los escenarios._

**Tradeoffs identificados:**
- La estrategia STI mejora el rendimiento de las consultas de préstamos (sin JOIN extra para identificar tipo de persona) pero requiere validación en la capa de aplicación para prevenir que lectores sean asignados como autores de libros.
- `ON DELETE RESTRICT` garantiza la integridad del historial pero implica que el borrado de libros debe gestionarse desde la aplicación (devolver todos los préstamos activos primero).
- La búsqueda `LIKE %q%` en ambos extremos impide el uso de índices de tipo B-Tree; si la tabla `persona` crece significativamente, se debería considerar Full-Text Search de MySQL.
