const Persona = require('../models/Persona');

const getPersonas = async (req, res) => {
    try {
        const personas = await Persona.findAll();
        res.json(personas);
    } catch (error) {
        console.error("[CONTROLLER] getPersonas - Error:", error.message);
        res.status(500).json({ error: 'Error al obtener las personas' });
    }
};

const getPersonaById = async (req, res) => {
    try {
        const persona = await Persona.findById(req.params.id);
        if (!persona) {
            return res.status(404).json({ error: 'Persona no encontrada' });
        }
        res.json(persona);
    } catch (error) {
        console.error("[CONTROLLER] getPersonaById - Error:", error.message);
        res.status(500).json({ error: 'Error al obtener la persona' });
    }
};

const buscarAutores = async (req, res) => {
    try {
        const { q } = req.query;
        if (!q || q.length < 1) {
            return res.status(400).json({ error: 'El parámetro de búsqueda es requerido' });
        }
        const autores = await Persona.findByNombreOApellido(q);
        res.json(autores);
    } catch (error) {
        console.error("[CONTROLLER] buscarAutores - Error:", error.message);
        res.status(500).json({ error: 'Error en la búsqueda de autores' });
    }
};

const createPersona = async (req, res) => {
    try {
        const { nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico, esAutor } = req.body;
        const nuevaPersona = await Persona.createPersona({ 
            nombre, 
            apellido, 
            fecha_nacimiento, 
            nacionalidad, 
            correo_electronico, 
            esAutor: esAutor || 0 
        });
        res.status(201).json(nuevaPersona);
    }
    catch (error) {
        console.error("[CONTROLLER] createPersona:", error.message);
        res.status(500).json({ error: 'Error al crear la persona', details: error.message });
    }
};

const deletePersona = async (req, res) => {
    try {
        const resultado = await Persona.deletePersona(req.params.id);
        res.json(resultado);
    } catch (error) {
        console.error("[CONTROLLER] deletePersona - Error:", error.message);
        res.status(500).json({ error: 'Error al eliminar la persona' });
    }
};

const updatePersona = async (req, res) => {
    try {
        const { nombre, apellido, fecha_nacimiento, nacionalidad, correo_electronico, esAutor } = req.body;
        const personaActualizada = await Persona.updatePersona(req.params.id, { 
            nombre, 
            apellido, 
            fecha_nacimiento, 
            nacionalidad, 
            correo_electronico, 
            esAutor 
        });
        res.json(personaActualizada);
    } catch (error) {
        console.error("[CONTROLLER] updatePersona - Error:", error.message);
        res.status(500).json({ error: 'Error al actualizar la persona' });
    }
};

module.exports = {
    getPersonas,
    getPersonaById,
    buscarAutores,
    createPersona,
    deletePersona,
    updatePersona
};
