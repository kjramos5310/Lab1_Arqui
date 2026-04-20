const Libro = require('../models/Libro');
const Persona = require('../models/Persona');

const getLibros = async (req, res) => {
    try {
        console.log("[CONTROLLER] getLibros - Obteniendo todos los libros");
        const libros = await Libro.findAll();
        console.log("[CONTROLLER] getLibros - Libros encontrados:", libros.length);
        res.json(libros);
    }
    catch (error) {
        console.error("[CONTROLLER] getLibros - Error:", error.message);
        res.status(500).json({ error: 'Error al obtener los libros' });
    }
};

const getLibroById = async (req, res) => {
    try {
        const libro = await Libro.findById(req.params.id);
        if (!libro) {
            return res.status(404).json({ error: 'Libro no encontrado' });
        }
        res.json(libro);
    } catch (error) {
        console.error("[CONTROLLER] getLibroById - Error:", error.message);
        res.status(500).json({ error: 'Error al obtener el libro' });
    }
};

const createLibro = async (req, res) => {
    try {
        console.log("[CONTROLLER] createLibro - Body recibido:", req.body);
        const { titulo, isbn, anio_publicacion, edicion, autor_id } = req.body;
        console.log("[CONTROLLER] createLibro - Datos extraídos:", { titulo, isbn, anio_publicacion, edicion, autor_id });
        
        // Validar que el autor existe y tiene esAutor = 1
        const autor = await Persona.findById(autor_id);
        if (!autor) {
            return res.status(404).json({ error: 'Autor no encontrado' });
        }
        if (autor.esAutor !== 1) {
            return res.status(403).json({ error: 'Solo personas con privilegios de autor (esAutor=1) pueden crear libros' });
        }
        
        const nuevoLibro = await Libro.createLibro({ titulo, isbn, anio_publicacion, edicion, autor_id });
        console.log("[CONTROLLER] createLibro - Libro creado:", nuevoLibro);
        res.status(201).json(nuevoLibro);
    }
    catch (error) {
        console.error("[CONTROLLER] createLibro - Error:", error.message);
        console.error("[CONTROLLER] createLibro - Stack:", error.stack);
        res.status(500).json({ error: 'Error al crear el libro', details: error.message });
    }
};

const deleteLibro = async (req, res) => {
    try {
        console.log("[CONTROLLER] deleteLibro - ID recibido:", req.params.id);
        const resultado = await Libro.deleteLibro(req.params.id);
        console.log("[CONTROLLER] deleteLibro - Libro eliminado");
        res.json(resultado);
    } catch (error) {
        // RF-4: ON DELETE RESTRICT — el libro tiene préstamos activos
        if (error.errno === 1451 || error.code === 'ER_ROW_IS_REFERENCED_2') {
            return res.status(409).json({ 
                error: 'No se puede eliminar el libro porque tiene préstamos asociados (ON DELETE RESTRICT)' 
            });
        }
        console.error("[CONTROLLER] deleteLibro - Error:", error.message);
        res.status(500).json({ error: 'Error al eliminar el libro' });
    }
};

const updateLibro = async (req, res) => {
    try {
        console.log("[CONTROLLER] updateLibro - ID:", req.params.id, "Body:", req.body);
        const { titulo, isbn, anio_publicacion, edicion, autor_id } = req.body;
        
        // Validar que el autor existe y tiene esAutor = 1 (si se proporciona)
        if (autor_id) {
            const autor = await Persona.findById(autor_id);
            if (!autor) {
                return res.status(404).json({ error: 'Autor no encontrado' });
            }
            if (autor.esAutor !== 1) {
                return res.status(403).json({ error: 'Solo personas con privilegios de autor (esAutor=1) pueden ser asignadas como autores' });
            }
        }
        
        const libroActualizado = await Libro.updateLibro(req.params.id, { titulo, isbn, anio_publicacion, edicion, autor_id });
        console.log("[CONTROLLER] updateLibro - Libro actualizado");
        res.json(libroActualizado);
    } catch (error) {
        console.error("[CONTROLLER] updateLibro - Error:", error.message);
        res.status(500).json({ error: 'Error al actualizar el libro' });
    }
};

module.exports = {
    getLibros,
    getLibroById,
    createLibro,
    deleteLibro,
    updateLibro
 };