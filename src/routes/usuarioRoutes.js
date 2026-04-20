const express = require('express');
const router = express.Router();
const Persona = require('../models/Persona');

const { getPrestamosPorUsuarioArray } = require('../controllers/prestamoController');

// GET /api/usuarios -> Listar todas las personas que NO son autores (lectores)
router.get('/', async (req, res) => {
    try {
        const personas = await Persona.findAll();
        const usuarios = personas.filter(p => p.esAutor === 0);
        res.json(usuarios);
    } catch (error) {
        res.status(500).json({ error: 'Error al obtener los usuarios' });
    }
});

// RF-3: GET /api/usuarios/:id/prestamos
router.get('/:id/prestamos', getPrestamosPorUsuarioArray);

module.exports = router;
