const express = require('express');
const router = express.Router();

const {
    getPersonas,
    getPersonaById,
    buscarAutores,
    createPersona,
    deletePersona,
    updatePersona
} = require('../controllers/personaController');
const { getPrestamosPorUsuarioArray } = require('../controllers/prestamoController');

router.get('/', getPersonas);
router.get('/buscar', buscarAutores);
router.get('/:id', getPersonaById);
router.get('/:id/prestamos', getPrestamosPorUsuarioArray);
router.post('/', createPersona);
router.delete('/:id', deletePersona);
router.put('/:id', updatePersona);

module.exports = router;
