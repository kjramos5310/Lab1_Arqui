const express = require('express');
const router = express.Router();


const {
    getLibros,
    createLibro,
    deleteLibro,
    updateLibro

} = require('../controllers/libroController');

router.get('/', getLibros);
router.post('/', createLibro);
router.delete('/:id', deleteLibro);
router.put('/:id', updateLibro);

module.exports = router;
