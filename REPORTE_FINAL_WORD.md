# REPORTE ATAM — Sistema de Biblioteca (Préstamos)

**Método:** Architecture Tradeoff Analysis Method (ATAM)  
**Sistema:** API REST de Biblioteca · Node.js + Express + MySQL 8  
**Fecha:** Abril 2026  
**Herramienta de pruebas:** Locust

---

## Introducción

Este reporte documenta los cuatro escenarios de calidad definidos y ejecutados sobre el sistema de biblioteca. Los escenarios cubren las dimensiones de rendimiento, escalabilidad, estabilidad y correctitud, con énfasis en los nuevos endpoints correspondientes a la API de Biblioteca.

Cada escenario fue ejecutado de forma independiente con Locust, levantando la API en `http://localhost:3000` y la base de datos MySQL en contenedores Docker.

---

## 7.1. Escenario 1: Búsqueda de Autores bajo Carga Moderada (ESC-BUSQ-01)

### Tabla ATAM

| Componente ATAM | Descripción |
|---|---|
| **ID del Escenario** | ESC-BUSQ-01 |
| **Nombre del Escenario** | Rendimiento en búsqueda de autores con coincidencia parcial |
| **Fuente** | 80 usuarios concurrentes simulados en Locust |
| **Estímulo** | Peticiones `GET /api/autores/buscar?q=<término>` con términos que aparecen en aproximadamente el 30 % de los registros. Cada usuario realiza una búsqueda cada 1 a 2 segundos. |
| **Artefacto** | Endpoint de búsqueda de autores (consulta SQL con `WHERE nombre LIKE '%?%' OR apellido LIKE '%?%'`) |
| **Entorno** | Base de datos con 500 autores precargados. No se han creado índices adicionales a las claves primarias. La API y MySQL se ejecutan localmente en contenedores Docker. |
| **Respuesta** | El sistema retorna una lista JSON con los autores que coinciden con el criterio de búsqueda y código HTTP 200. Se espera que el tiempo de respuesta sea bajo y que no se produzcan errores. |
| **Medida de respuesta** | _(A completar tras ejecutar la prueba: tiempo de respuesta promedio, percentil 95, RPS máximo, tasa de errores)_ |
| **Objetivo de calidad** | Rendimiento (latencia y throughput en operaciones de lectura con filtros) |

### Capturas de Pantalla (ESC-BUSQ-01)

**[Inserte aquí la captura de la pestaña Statistics de Locust para el Escenario 1]**

**[Inserte aquí la captura de la pestaña Charts (RPS y Latencias) de Locust para el Escenario 1]**

### Análisis de Resultados (ESC-BUSQ-01)

> _(Completar aquí la interpretación de las métricas recolectadas, comparando con el objetivo propuesto, y detallando el comportamiento general)_

---

## 7.2. Escenario 2: Consulta de Préstamos por Usuario con Relaciones (ESC-PREST-02)

### Tabla ATAM

| Componente ATAM | Descripción |
|---|---|
| **ID del Escenario** | ESC-PREST-02 |
| **Nombre del Escenario** | Rendimiento en consulta de historial de préstamos con múltiples JOINs |
| **Fuente** | 50 usuarios concurrentes simulados |
| **Estímulo** | Peticiones `GET /api/usuarios/{id}/prestamos` con identificadores de usuario existentes (rango 1-200). Cada usuario realiza una consulta cada 2 a 4 segundos. |
| **Artefacto** | Endpoint de préstamos por usuario, que implica una consulta SQL con `JOIN` entre las tablas `prestamo`, `libro` y `persona`. |
| **Entorno** | Base de datos con 200 usuarios, 500 libros y 1000 préstamos registrados (50 % activos, 50 % históricos con fecha de devolución). Las tablas tienen claves foráneas definidas. |
| **Respuesta** | El sistema retorna un arreglo JSON con todos los préstamos del usuario, incluyendo detalles del libro (título, ISBN) y fechas, con código 200. |
| **Medida de respuesta** | _(A completar tras ejecutar la prueba: tiempo de respuesta promedio, percentil 95, RPS máximo, tasa de errores)_ |
| **Objetivo de calidad** | Rendimiento en consultas que involucran relaciones entre múltiples tablas |

### Capturas de Pantalla (ESC-PREST-02)

**[Inserte aquí la captura de la pestaña Statistics de Locust para el Escenario 2]**

**[Inserte aquí la captura de la pestaña Charts de Locust para el Escenario 2]**

### Análisis de Resultados (ESC-PREST-02)

> _(Completar aquí el análisis y comportamiento del sistema bajo estas lecturas multi-tabla)_

---

## 7.3. Escenario 3: Creación Concurrente de Préstamos (ESC-PREST-03)

### Tabla ATAM

| Componente ATAM | Descripción |
|---|---|
| **ID del Escenario** | ESC-PREST-03 |
| **Nombre del Escenario** | Escalabilidad y control de concurrencia en la creación de préstamos |
| **Fuente** | 60 usuarios (bibliotecarios) concurrentes registrando préstamos |
| **Estímulo** | Peticiones `POST /api/prestamos` con datos válidos (`usuario_id`, `libro_id`, `fecha_prestamo`, `fecha_devolucion_esperada`). La tasa objetivo es de 30 peticiones por segundo. |
| **Artefacto** | Endpoint de creación de préstamo, que debe verificar que el libro esté disponible (no prestado activamente) antes de insertar el registro. |
| **Entorno** | Base de datos con 200 usuarios, 500 libros. Cada libro tiene un campo o verificación de disponibilidad (stock entre 1 y 3). |
| **Respuesta** | Si el libro está disponible, se crea el préstamo y se retorna 201 Created con los detalles. Si no está disponible, se retorna 400 Bad Request. |
| **Medida de respuesta** | _(A completar: tasa de éxito (201), tiempo de respuesta promedio, percentil 95, RPS máximo, porcentaje de errores 400 por falta de disponibilidad)_ |
| **Objetivo de calidad** | Escalabilidad (manejo de escrituras concurrentes) y correctitud (control de integridad de préstamos) |

### Capturas de Pantalla (ESC-PREST-03)

**[Inserte aquí la captura de la pestaña Statistics de Locust para el Escenario 3]**

**[Inserte aquí la captura de la pestaña Charts de Locust para el Escenario 3]**

### Análisis de Resultados (ESC-PREST-03)

> _(Completar aquí el análisis, destacando la eficiencia del control de concurrencia y la respuesta correcta ante el bloqueo por falta de disponibilidad)_

---

## 7.4. Escenario 4: Carga Mixta con Pico de Tráfico (ESC-MIXTO-04)

### Tabla ATAM

| Componente ATAM | Descripción |
|---|---|
| **ID del Escenario** | ESC-MIXTO-04 |
| **Nombre del Escenario** | Comportamiento general del sistema bajo carga mixta y picos de usuarios |
| **Fuente** | 200 usuarios concurrentes con comportamiento variado (simulando lectores y bibliotecarios) |
| **Estímulo** | Mezcla de peticiones: 40 % búsqueda de autores (`GET /api/autores/buscar`), 30 % consulta de préstamos por usuario (`GET /api/usuarios/:id/prestamos`), 20 % creación de préstamos (`POST /api/prestamos`), 10 % health check (`GET /health`). Los usuarios se incorporan rápidamente (spawn rate = 40 usuarios/segundo). |
| **Artefacto** | Conjunto completo de endpoints de la API (autores, libros, usuarios, préstamos, health) |
| **Entorno** | Base de datos con 1000 autores, 2000 libros, 500 usuarios y 3000 préstamos precargados. La API y MySQL en Docker sin balanceo de carga. |
| **Respuesta** | El sistema debe manejar todas las peticiones sin errores del lado del servidor (5xx). Se tolera un pequeño porcentaje de errores 4xx por lógica de negocio (libro no disponible, etc.). |
| **Medida de respuesta** | _(A completar: percentil 95 del tiempo de respuesta global, RPS máximo sostenido, tasa de errores 5xx, distribución de latencias por endpoint)_ |
| **Objetivo de calidad** | Estabilidad y disponibilidad bajo condiciones de estrés mixto |

### Capturas de Pantalla (ESC-MIXTO-04)

**[Inserte aquí la captura de la pestaña Statistics de Locust para el Escenario 4]**

**[Inserte aquí la captura de la pestaña Charts de Locust para el Escenario 4]**

### Análisis de Resultados (ESC-MIXTO-04)

> _(Completar aquí la interpretación global sobre cómo el sistema soporta altas cargas mixtas, comparando los latencias de cada endpoint bajo estrés masivo)_

---

## Propuestas de Mejora

Con base en los hallazgos de las pruebas, se recomiendan las siguientes optimizaciones para mejorar el rendimiento, escalabilidad y robustez del sistema:

1. **Rendimiento de Búsquedas (Escenario 1):**
    - La búsqueda de coincidencia parcial (`LIKE '%q%'`) impide el uso eficiente de índices B-Tree estándar. Se recomienda implementar un índice `FULLTEXT` en las columnas `nombre` y `apellido` de la tabla `persona` para mejorar la escalabilidad y reducir la latencia bajo alta concurrencia.
2. **Consultas Relacionales (Escenario 2):**
    - Agregar un índice en `prestamo(usuario_id)` para acelerar significativamente la consulta de historial de préstamos, minimizando el escaneo de filas.
    - Se puede optimizar aún más con índices compuestos que incluyan también el campo de `fecha_prestamo` para casos donde se necesita ordenamiento optimizado.
3. **Escrituras y Concurrencia (Escenario 3):**
    - El control actual de disponibilidad (bloqueo por préstamo activo) asegura correctitud y evita sobreasignación. Para mejorar la escalabilidad bajo concurrencia más intensa o múltiples réplicas se sugiere utilizar transacciones (`SELECT FOR UPDATE`) para crear un candado pessimista, o bien, si se cambia el esquema, utilizar un campo de `stock` con actualización atómica en la tabla libros.
4. **Resistencia bajo Picos de Tráfico (Escenario 4):**
    - Ante un entorno real productivo la base de datos podría convertirse en el principal cuello de botella. Se sugiere el uso de conexiones mediante connection pools bien calibrados en la API de Node.js, e idealmente la implementación de un proxy o balanceador de carga.
    - Las consultas frecuentes de lectura pesada pueden ser oxigenadas con la integración de una capa de caché (por ejemplo, con Redis) para solicitudes de catálogos casi estáticos (libross y búsquedas genéricas).
