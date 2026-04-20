CREATE TABLE persona (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(35) NOT NULL,
    apellido VARCHAR(35) NOT NULL,
    fecha_nacimiento DATE,
    nacionalidad VARCHAR(255) NOT NULL,
    correo_electronico VARCHAR(255) UNIQUE,
    esAutor TINYINT(1) DEFAULT 0
);

CREATE TABLE libro (
    id INT AUTO_INCREMENT PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    isbn VARCHAR(14) UNIQUE,
    anio_publicacion INT NOT NULL,
    edicion VARCHAR(35) NOT NULL,
    autor_id INT,
    FOREIGN KEY (autor_id) REFERENCES persona(id) ON DELETE SET NULL
);

CREATE TABLE prestamo (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    libro_id INT NOT NULL,
    fecha_prestamo DATETIME DEFAULT CURRENT_TIMESTAMP,
    fecha_devolucion_esperada DATE NOT NULL,
    fecha_devolucion_real DATETIME,
    estado ENUM('activo', 'devuelto', 'vencido') DEFAULT 'activo',
    FOREIGN KEY (usuario_id) REFERENCES persona(id) ON DELETE RESTRICT,
    FOREIGN KEY (libro_id) REFERENCES libro(id) ON DELETE RESTRICT
);