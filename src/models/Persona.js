const db = require('../config/db');

const Persona = {
    findAll: async () => {
        const [rows] = await db.query('SELECT * FROM persona');
        return rows;
    },

    findById: async (id) => {
        const [rows] = await db.query('SELECT * FROM persona WHERE id = ?', [id]);
        return rows[0] || null;
    },

    findByNombreOApellido: async (q) => {
        const search = `%${q}%`;
        const [rows] = await db.query(
            'SELECT * FROM persona WHERE esAutor = 1 AND (nombre LIKE ? OR apellido LIKE ?) ORDER BY nombre, apellido',
            [search, search]
        );
        return rows;
    },

    createPersona: async ({ nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico, esAutor = 0 }) => {
        const [result] = await db.query(
            'INSERT INTO persona (nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico, esAutor) VALUES (?, ?, ?, ?, ?, ?)',
            [nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico, esAutor ? 1 : 0]
        );
        return { id: result.insertId, nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico, esAutor: esAutor ? 1 : 0 };
    },

    deletePersona: async (id) => {
        await db.query('DELETE FROM persona WHERE id = ?', [id]);
        return { message: 'Persona eliminada exitosamente' };
    },

    updatePersona: async (id, { nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico, esAutor }) => {
        const updateData = { nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico };
        
        if (esAutor !== undefined) {
            updateData.esAutor = esAutor ? 1 : 0;
        }

        const updates = Object.keys(updateData).map(key => `${key} = ?`).join(', ');
        const values = [...Object.values(updateData), id];

        await db.query(
            `UPDATE persona SET ${updates} WHERE id = ?`,
            values
        );
        return { id, ...updateData };
    }
};

module.exports = Persona;
