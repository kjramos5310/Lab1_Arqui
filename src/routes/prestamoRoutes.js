const express = require('express');
const router = express.Router();

const {
    getPrestamos,
    getPrestamoById,
    getPrestamosPorUsuario,
    createPrestamo,
    devolverPrestamo,
    deletePrestamo
} = require('../controllers/prestamoController');

router.get('/', getPrestamos);
router.get('/:id', getPrestamoById);
router.get('/usuario/:id', getPrestamosPorUsuario);
router.post('/', createPrestamo);
router.put('/:id/devolver', devolverPrestamo);
router.delete('/:id', deletePrestamo);

module.exports = router;
