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

router.get('/', getPersonas);
router.get('/buscar', buscarAutores);
router.get('/:id', getPersonaById);
router.post('/', createPersona);
router.delete('/:id', deletePersona);
router.put('/:id', updatePersona);

module.exports = router;
