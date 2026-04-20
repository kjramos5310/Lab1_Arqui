const db = require('../config/db');

const Libro = {
    findAll: async () => {
        console.log("[MODEL] Libro.findAll - Consultando todos los libros");
        const [rows] = await db.query('SELECT l.*, a.nombre, a.apellido FROM libro l JOIN persona a ON l.autor_id = a.id');
        console.log("[MODEL] Libro.findAll - Libros encontrados:", rows.length);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query('SELECT l.*, a.nombre, a.apellido FROM libro l JOIN persona a ON l.autor_id = a.id WHERE l.id = ?', [id]);
        return rows[0] || null;
    },

    createLibro : async ({ titulo, isbn, anio_publicacion, edicion, autor_id }) => {
        console.log("[MODEL] Libro.createLibro - Creando libro con datos:", { titulo, isbn, anio_publicacion, edicion, autor_id });
        const [result] = await db.query(
            'INSERT INTO libro (titulo, isbn, anio_publicacion, edicion, autor_id) VALUES (?, ?, ?, ?, ?)',
            [titulo, isbn, anio_publicacion, edicion, autor_id]
        );
        console.log("[MODEL] Libro.createLibro - Libro creado con ID:", result.insertId);
        return { id: result.insertId, titulo, isbn, anio_publicacion, edicion, autor_id };
    },

    deleteLibro: async (id) => {
        console.log("[MODEL] Libro.deleteLibro - Eliminando libro ID:", id);
        await db.query('DELETE FROM libro WHERE id = ?', [id]);
        console.log("[MODEL] Libro.deleteLibro - Libro eliminado");
        return { message: 'Libro eliminado exitosamente' };
    }, 

    updateLibro: async (id, { titulo, isbn, anio_publicacion, edicion, autor_id }) => {
        console.log("[MODEL] Libro.updateLibro - Actualizando libro ID:", id, "con datos:", { titulo, isbn, anio_publicacion, edicion, autor_id });
        await db.query(
            'UPDATE libro SET titulo = ?, isbn = ?, anio_publicacion = ?, edicion = ?, autor_id = ? WHERE id = ?',
            [titulo, isbn, anio_publicacion, edicion, autor_id, id]
        );
        console.log("[MODEL] Libro.updateLibro - Libro actualizado");
        return { id, titulo, isbn, anio_publicacion, edicion, autor_id };
    }

};

module.exports = Libro;
