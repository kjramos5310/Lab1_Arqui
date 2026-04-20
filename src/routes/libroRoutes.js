const express = require('express');
const router = express.Router();


const {
    getLibros,
    getLibroById,
    createLibro,
    deleteLibro,
    updateLibro

} = require('../controllers/libroController');

router.get('/', getLibros);
router.get('/:id', getLibroById);
router.post('/', createLibro);
router.delete('/:id', deleteLibro);
router.put('/:id', updateLibro);

module.exports = router;
