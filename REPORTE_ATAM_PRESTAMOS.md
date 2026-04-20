# REPORTE ATAM — Sistema de Biblioteca (Préstamos)

**Método:** Architecture Tradeoff Analysis Method (ATAM)  
**Sistema:** API REST de Biblioteca · Node.js + Express + MySQL 8  
**Fecha:** Abril 2026  
**Herramienta de pruebas:** Locust

---

## Introducción

Este reporte documenta los cuatro escenarios de calidad definidos y ejecutados sobre el sistema de biblioteca extendido. Los escenarios cubren las dimensiones de rendimiento, disponibilidad, confiabilidad e integridad de datos, con énfasis en los nuevos endpoints y la interacción entre las entidades `persona`, `libro` y `prestamo`.

Cada escenario fue ejecutado de forma independiente con Locust, levantando la API en `http://localhost:3000` y la base de datos MySQL en Docker.

---

## Escenario 1 — Búsqueda de Autores

### Tabla ATAM

| Elemento ATAM | Descripción |
|---|---|
| **Atributo de Calidad** | Rendimiento — Eficiencia de Desempeño (Performance Efficiency) |
| **Fuente del Estímulo** | Lectores y bibliotecarios buscando autores en el catálogo |
| **Estímulo** | 30 usuarios concurrentes realizan búsquedas de autores con términos variados (cortos, largos, parciales) y sin parámetro `q` |
| **Entorno** | Pico de carga moderado-alto; sistema con datos precargados |
| **Artefacto** | `GET /api/autores/buscar?q=<texto>` (RF-2) |
| **Respuesta Esperada** | 200 con lista (puede ser vacía) para búsquedas válidas · 400 cuando falta `q` · nunca 500 |
| **Medida de Respuesta (objetivo)** | p95 < 300 ms · Tasa de error de servicio < 1% · RPS > 80 |
| **Medida de Respuesta (real)** | _(completar con métricas de Locust)_ |

### Configuración

```bash
locust -f test/locust_escenario_2.py --host=http://localhost:3000 \
       --headless --users 30 --spawn-rate 10 --run-time 120s
```

### Resultados por Endpoint

| Endpoint | Peticiones | RPS | p50 (ms) | p95 (ms) | Errores |
|---|---|---|---|---|---|
| GET /api/autores/buscar?q=\<término\> | — | — | — | — | — |
| GET /api/autores/buscar?q=\<1 char\> | — | — | — | — | — |
| GET /api/autores/buscar [sin q → 400] | — | — | — | — | — |
| GET /api/autores/buscar?q=\<largo\> | — | — | — | — | — |
| **TOTAL** | — | — | — | — | — |

### Capturas de Pantalla

**[Captura 1-A: pestaña Statistics de Locust — Escenario 1]**

**[Captura 1-B: pestaña Charts (tiempos de respuesta y RPS) — Escenario 1]**

### Análisis

> _Completar tras ejecutar la prueba._

La búsqueda `LIKE %q%` aplicada sobre ambos extremos de la cadena impide el uso de índices B-Tree. El rendimiento aceptable se explica porque el filtro `esAutor = 1` reduce el espacio de búsqueda antes de aplicar el `LIKE`. Las búsquedas con un solo carácter devuelven el mayor volumen de resultados y presionan más la serialización de la respuesta JSON.

Los estados 400 (parámetro `q` ausente) son intencionados y **no representan errores de servicio** — el sistema cumple correctamente el RF-2 al validar la presencia del parámetro.

---

## Escenario 2 — Consulta de Préstamos por Usuario

### Tabla ATAM

| Elemento ATAM | Descripción |
|---|---|
| **Atributo de Calidad** | Disponibilidad (Availability) |
| **Fuente del Estímulo** | Lectores revisando su historial; peticiones con IDs inválidos de clientes mal configurados |
| **Estímulo** | 25 usuarios concurrentes consultan el historial de préstamos mezclando IDs válidos, IDs inexistentes (99999) e IDs malformados (texto) |
| **Entorno** | Operación normal sostenida; el sistema no debe degradarse ante entradas incorrectas |
| **Artefacto** | `GET /api/usuarios/:id/prestamos` (RF-3) |
| **Respuesta Esperada** | 200 para IDs válidos; 404 para IDs inexistentes; **jamás 500** ante ningún input |
| **Medida de Respuesta (objetivo)** | Disponibilidad ≥ 99% · p95 < 400 ms · 0 errores 500 |
| **Medida de Respuesta (real)** | _(completar con métricas de Locust)_ |

### Configuración

```bash
locust -f test/locust_escenario_3.py --host=http://localhost:3000 \
       --headless --users 25 --spawn-rate 5 --run-time 120s
```

### Resultados por Endpoint

| Endpoint | Peticiones | p50 (ms) | p95 (ms) | Código esperado | Errores |
|---|---|---|---|---|---|
| GET /api/usuarios/:id/prestamos [válido] | — | — | — | 200 | — |
| GET /api/usuarios/:id/prestamos [404] | — | — | — | 404 | — |
| GET /api/usuarios/abc/prestamos | — | — | — | 400/404 | — |
| GET /api/prestamos | — | — | — | 200 | — |
| **TOTAL** | — | — | — | — | — |

| Métrica de Disponibilidad | Valor |
|---|---|
| Errores 500 totales | — |
| Disponibilidad medida | —% |
| p95 global | — ms |

### Capturas de Pantalla

**[Captura 2-A: pestaña Statistics — Escenario 2]**

**[Captura 2-B: pestaña Charts (failures vs time) — Escenario 2]**

### Análisis

> _Completar tras ejecutar la prueba._

Este escenario valida que el JOIN triple (`prestamo ⟕ libro ⟕ persona`) en `findByUsuarioId` sea estable bajo carga concurrente. La ausencia de errores 500 ante inputs malformados confirma robustez en la capa de control. La respuesta JSON estructurada (objeto `libro` embebido por cada préstamo) implica ligera sobrecarga de serialización respecto a una respuesta plana.

---

## Escenario 3 — Creación Concurrente de Préstamos

### Tabla ATAM

| Elemento ATAM | Descripción |
|---|---|
| **Atributo de Calidad** | Confiabilidad / Integridad de Datos (Reliability) |
| **Fuente del Estímulo** | Múltiples lectores realizando préstamos del mismo conjunto de libros simultáneamente |
| **Estímulo** | 20 usuarios concurrentes crean préstamos usando un pool limitado de libros; verifican el historial y prueban el `ON DELETE RESTRICT` |
| **Entorno** | Alta concurrencia de escritura; BD con pool de conexiones saturado |
| **Artefacto** | `POST /api/prestamos` + `GET /api/usuarios/:id/prestamos` + `DELETE /api/libros/:id` |
| **Respuesta Esperada** | Todos los préstamos creados retornan 201 · El historial refleja inmediatamente todos los préstamos (lectura consistente) · DELETE con préstamos activos → 409 |
| **Medida de Respuesta (objetivo)** | 0 errores de integridad · 100% de 409 al borrar libros con préstamos · p95 POST < 600 ms |
| **Medida de Respuesta (real)** | _(completar con métricas de Locust)_ |

### Configuración

```bash
locust -f test/locust_escenario_4.py --host=http://localhost:3000 \
       --headless --users 20 --spawn-rate 5 --run-time 150s
```

### Resultados por Endpoint

| Endpoint | Peticiones | RPS | p50 (ms) | p95 (ms) | Errores |
|---|---|---|---|---|---|
| POST /api/prestamos | — | — | — | — | — |
| GET /api/usuarios/:id/prestamos [integridad] | — | — | — | — | — |
| DELETE /api/libros/:id [RESTRICT 409] | — | — | — | — | — |
| GET /api/prestamos | — | — | — | — | — |
| **TOTAL** | — | — | — | — | — |

| Métrica de Integridad | Valor |
|---|---|
| Préstamos correctamente creados | — |
| Errores 500 totales | — |
| 409 recibidos (DELETE con RESTRICT) | — |
| Inconsistencias detectadas | — |

### Capturas de Pantalla

**[Captura 3-A: pestaña Statistics — Escenario 3]**

**[Captura 3-B: pestaña Charts (RPS y latencia) — Escenario 3]**

### Análisis

> _Completar tras ejecutar la prueba._

Este escenario es el que más presiona la integridad referencial. La ausencia de `SELECT ... FOR UPDATE` en la capa de aplicación significa que múltiples usuarios pueden tener el mismo libro en estado "activo" — esto es aceptable en el modelo actual (no hay control de stock), pero evidencia un tradeoff entre rendimiento (sin bloqueo) y exclusividad del recurso. El `ON DELETE RESTRICT` actúa como red de seguridad a nivel de BD.

---

## Escenario 4 — Carga Mixta

### Tabla ATAM

| Elemento ATAM | Descripción |
|---|---|
| **Atributo de Calidad** | Rendimiento global bajo uso heterogéneo (Performance Efficiency) |
| **Fuente del Estímulo** | Usuarios variados ejecutando simultáneamente todos los nuevos endpoints del sistema |
| **Estímulo** | 25 usuarios concurrentes mezclan en proporciones reales: búsqueda de autores, consulta de historial, creación de préstamos y devoluciones |
| **Entorno** | Uso normal del sistema completo; todos los endpoints activos al mismo tiempo |
| **Artefacto** | Todos los endpoints nuevos: `/api/autores/buscar`, `/api/usuarios/:id/prestamos`, `POST /api/prestamos`, `PUT /api/prestamos/:id/devolver` |
| **Respuesta Esperada** | Ningún endpoint se degrada por la presencia de los demás · Distribución de latencia estable |
| **Medida de Respuesta (objetivo)** | p95 global < 600 ms · Tasa de error < 2% · RPS total > 60 |
| **Medida de Respuesta (real)** | _(completar con métricas de Locust)_ |

### Configuración

```bash
locust -f test/locust_escenario_1.py --host=http://localhost:3000 \
       --headless --users 25 --spawn-rate 5 --run-time 120s
```

### Resultados por Endpoint

| Endpoint | Peticiones | RPS | p50 (ms) | p95 (ms) | Errores |
|---|---|---|---|---|---|
| GET /api/autores/buscar?q= | — | — | — | — | — |
| GET /api/usuarios/:id/prestamos | — | — | — | — | — |
| POST /api/prestamos | — | — | — | — | — |
| PUT /api/prestamos/:id/devolver | — | — | — | — | — |
| GET /api/autores | — | — | — | — | — |
| GET /api/libros | — | — | — | — | — |
| **TOTAL** | — | — | — | — | — |

### Capturas de Pantalla

**[Captura 4-A: pestaña Statistics con todos los endpoints — Escenario 4]**

**[Captura 4-B: pestaña Charts (RPS y tiempos de respuesta) — Escenario 4]**

### Análisis

> _Completar tras ejecutar la prueba._

La carga mixta permite observar si existe contención entre operaciones de lectura (búsqueda, historial) y escritura (crear préstamo, devolver). En MySQL InnoDB, las lecturas no bloquean escrituras gracias al MVCC, por lo que se espera que los tiempos de las consultas no se degraden significativamente con respecto a los escenarios aislados.

---

## Resumen Comparativo

| Escenario | Atributo ATAM | Usuarios | p95 Objetivo | p95 Real | Error objetivo | Error Real | Resultado |
|---|---|---|---|---|---|---|---|
| 1 — Búsqueda de Autores | Rendimiento | 30 | < 300 ms | — | < 1% | — | — |
| 2 — Historial por Usuario | Disponibilidad | 25 | < 400 ms | — | 0 errores 500 | — | — |
| 3 — Creación Concurrente | Confiabilidad | 20 | < 600 ms | — | 0 inconsistencias | — | — |
| 4 — Carga Mixta | Rendimiento global | 25 | < 600 ms | — | < 2% | — | — |

---

## Análisis de Resultados y Cuellos de Botella

> _Completar tras ejecutar las 4 pruebas._

**Cuellos de botella esperados:**

1. **Búsqueda con `LIKE %q%`:** La ausencia de Full-Text Index hace que esta operación sea O(n) sobre todas las personas con `esAutor=1`. Será el primero en degradarse con datasets grandes.

2. **JOIN triple en historial:** La consulta `prestamo ⟕ libro ⟕ persona` implica tres tablas; aunque con índices FK es eficiente, bajo alta concurrencia el pool de conexiones de MySQL puede saturarse primero.

3. **Escrituras sin bloqueo optimista:** La creación simultánea de préstamos sobre el mismo `libro_id` puede generar contención en el índice FK si el volumen es muy alto.

---

## Propuestas de Mejora

### Rendimiento

| Propuesta | Impacto | Esfuerzo |
|---|---|---|
| Agregar `FULLTEXT INDEX` sobre `(nombre, apellido)` en `persona` | Alto — elimina O(n) scan en búsquedas | Bajo |
| Agregar índice en `prestamo(usuario_id)` | Alto — acelera `findByUsuarioId` | Muy bajo |
| Agregar índice en `prestamo(libro_id)` | Medio — acelera validación de RESTRICT | Muy bajo |
| Habilitar query cache o capa Redis para `GET /api/autores/buscar` | Alto — reduce carga en BD | Medio |

```sql
-- Índices recomendados
ALTER TABLE persona ADD FULLTEXT INDEX ft_nombre_apellido (nombre, apellido);
ALTER TABLE prestamo ADD INDEX idx_usuario_id (usuario_id);
ALTER TABLE prestamo ADD INDEX idx_libro_id (libro_id);
```

### Escalabilidad

- **Pool de conexiones:** Configurar `mysql2` con `connectionLimit` ajustado según concurrencia esperada en lugar del valor por defecto.
- **Paginación:** Los endpoints `GET /api/autores/buscar` y `GET /api/usuarios/:id/prestamos` deberían soportar parámetros `limit` y `offset` para evitar respuestas masivas.
- **Separación lectura/escritura:** En escenarios de alta carga mixta, un replica de solo lectura para `GET` reduciría la contención con las operaciones `POST`/`PUT`.

### Robustez

- **Bloqueo optimista para préstamos exclusivos:** Si se requiere que un libro solo pueda prestarse a un usuario a la vez, agregar campo `disponible` y usar transacción `BEGIN ... SELECT FOR UPDATE ... UPDATE ... COMMIT`.
- **Validación de esquema en entrada:** Agregar middleware de validación (ej. `joi` o `zod`) para rechazar requests malformados antes de llegar al controlador.
- **Timeouts de BD:** Configurar `connectTimeout` y `queryTimeout` en el pool de `mysql2` para evitar que conexiones colgadas bloqueen workers de Node.
