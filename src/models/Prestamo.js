const db = require('../config/db');

const Prestamo = {
    findAll: async () => {
        const [rows] = await db.query(`
            SELECT p.*, 
                   pers.nombre as usuario_nombre, 
                   pers.apellido as usuario_apellido,
                   l.titulo as libro_titulo,
                   l.autor_id
            FROM prestamo p
            JOIN persona pers ON p.usuario_id = pers.id
            JOIN libro l ON p.libro_id = l.id
            ORDER BY p.fecha_prestamo DESC
        `);
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query(`
            SELECT p.*, 
                   pers.nombre as usuario_nombre, 
                   pers.apellido as usuario_apellido,
                   l.titulo as libro_titulo,
                   l.autor_id
            FROM prestamo p
            JOIN persona pers ON p.usuario_id = pers.id
            JOIN libro l ON p.libro_id = l.id
            WHERE p.id = ?
        `, [id]);
        return rows[0] || null;
    },

    findByUsuarioId: async (usuarioId) => {
        const [rows] = await db.query(`
            SELECT p.*,
                   l.titulo as libro_titulo,
                   l.isbn,
                   l.anio_publicacion,
                   a.nombre as autor_nombre,
                   a.apellido as autor_apellido
            FROM prestamo p
            JOIN libro l ON p.libro_id = l.id
            LEFT JOIN persona a ON l.autor_id = a.id
            WHERE p.usuario_id = ?
            ORDER BY p.fecha_prestamo DESC
        `, [usuarioId]);
        return rows;
    },

    isLibroDisponible: async (libroId) => {
        const [rows] = await db.query(
            'SELECT id FROM prestamo WHERE libro_id = ? AND estado = "activo"',
            [libroId]
        );
        return rows.length === 0;
    },

    createPrestamo: async ({ usuario_id, libro_id, fecha_devolucion_esperada }) => {
        const [result] = await db.query(
            `INSERT INTO prestamo (usuario_id, libro_id, fecha_devolucion_esperada) 
             VALUES (?, ?, ?)`,
            [usuario_id, libro_id, fecha_devolucion_esperada]
        );
        return { id: result.insertId, usuario_id, libro_id, fecha_devolucion_esperada };
    },

    devolverPrestamo: async (id) => {
        await db.query(
            'UPDATE prestamo SET fecha_devolucion_real = NOW(), estado = "devuelto" WHERE id = ?',
            [id]
        );
        return { message: 'Libro devuelto exitosamente' };
    },

    deletePrestamo: async (id) => {
        await db.query('DELETE FROM prestamo WHERE id = ?', [id]);
        return { message: 'Préstamo eliminado exitosamente' };
    },

    updateEstadoPrestamo: async (id, estado) => {
        await db.query(
            'UPDATE prestamo SET estado = ? WHERE id = ?',
            [estado, id]
        );
        return { message: 'Estado del préstamo actualizado' };
    }
};

module.exports = Prestamo;
