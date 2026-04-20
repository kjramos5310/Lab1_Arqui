const Prestamo = require('../models/Prestamo');
const Persona = require('../models/Persona');

const getPrestamos = async (req, res) => {
    try {
        console.log("[CONTROLLER] getPrestamos - Obteniendo todos los préstamos");
        const prestamos = await Prestamo.findAll();
        console.log("[CONTROLLER] getPrestamos - Préstamos encontrados:", prestamos.length);
        res.json(prestamos);
    } catch (error) {
        console.error("[CONTROLLER] getPrestamos - Error:", error.message);
        res.status(500).json({ error: 'Error al obtener los préstamos' });
    }
};

const getPrestamosPorUsuario = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("[CONTROLLER] getPrestamosPorUsuario - Usuario ID:", id);
        
        // Validar que la persona existe y no es un autor
        const persona = await Persona.findById(id);
        if (!persona) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }

        const prestamos = await Prestamo.findByUsuarioId(id);
        console.log("[CONTROLLER] getPrestamosPorUsuario - Préstamos encontrados:", prestamos.length);
        
        res.json({
            usuario: {
                id: persona.id,
                nombre: persona.nombre,
                apellido: persona.apellido,
                correo_electronico: persona.correo_electronico
            },
            prestamos: prestamos
        });
    } catch (error) {
        console.error("[CONTROLLER] getPrestamosPorUsuario - Error:", error.message);
        res.status(500).json({ error: 'Error al obtener los préstamos del usuario' });
    }
};

const createPrestamo = async (req, res) => {
    try {
        const { usuario_id, libro_id, fecha_devolucion_esperada } = req.body;
        console.log("[CONTROLLER] createPrestamo - Datos:", { usuario_id, libro_id, fecha_devolucion_esperada });

        // Validar que la persona existe
        const persona = await Persona.findById(usuario_id);
        if (!persona) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // RF-3: Verificar que el libro esté disponible (no prestado activamente)
        const isDisponible = await Prestamo.isLibroDisponible(libro_id);
        if (!isDisponible) {
            return res.status(400).json({ error: 'El libro no está disponible (ya está prestado)' });
        }

        const nuevoPrestamo = await Prestamo.createPrestamo({ 
            usuario_id, 
            libro_id, 
            fecha_devolucion_esperada 
        });
        
        console.log("[CONTROLLER] createPrestamo - Préstamo creado:", nuevoPrestamo);
        res.status(201).json(nuevoPrestamo);
    } catch (error) {
        console.error("[CONTROLLER] createPrestamo - Error:", error.message);
        res.status(500).json({ error: 'Error al crear el préstamo', details: error.message });
    }
};

const devolverPrestamo = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("[CONTROLLER] devolverPrestamo - ID:", id);
        
        const resultado = await Prestamo.devolverPrestamo(id);
        console.log("[CONTROLLER] devolverPrestamo - Libro devuelto");
        res.json(resultado);
    } catch (error) {
        console.error("[CONTROLLER] devolverPrestamo - Error:", error.message);
        res.status(500).json({ error: 'Error al devolver el préstamo' });
    }
};

const deletePrestamo = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("[CONTROLLER] deletePrestamo - ID:", id);
        
        const resultado = await Prestamo.deletePrestamo(id);
        console.log("[CONTROLLER] deletePrestamo - Préstamo eliminado");
        res.json(resultado);
    } catch (error) {
        console.error("[CONTROLLER] deletePrestamo - Error:", error.message);
        res.status(500).json({ error: 'Error al eliminar el préstamo' });
    }
};

// RF-3: GET /api/usuarios/:id/prestamos — retorna array plano con detalles de libro
const getPrestamosPorUsuarioArray = async (req, res) => {
    try {
        const { id } = req.params;
        console.log("[CONTROLLER] getPrestamosPorUsuarioArray - Usuario ID:", id);

        const persona = await Persona.findById(id);
        if (!persona) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const prestamos = await Prestamo.findByUsuarioId(id);
        console.log("[CONTROLLER] getPrestamosPorUsuarioArray - Préstamos encontrados:", prestamos.length);

        const result = prestamos.map(p => ({
            id: p.id,
            fecha_prestamo: p.fecha_prestamo,
            fecha_devolucion: p.fecha_devolucion_real || null,
            libro: {
                titulo: p.libro_titulo,
                isbn: p.isbn,
                anio_publicacion: p.anio_publicacion
            }
        }));

        res.json(result);
    } catch (error) {
        console.error("[CONTROLLER] getPrestamosPorUsuarioArray - Error:", error.message);
        res.status(500).json({ error: 'Error al obtener los préstamos del usuario' });
    }
};

module.exports = {
    getPrestamos,
    getPrestamosPorUsuario,
    getPrestamosPorUsuarioArray,
    createPrestamo,
    devolverPrestamo,
    deletePrestamo
};
