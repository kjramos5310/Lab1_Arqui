const express = require('express');
const router = express.Router();

const { getPrestamosPorUsuarioArray } = require('../controllers/prestamoController');

// RF-3: GET /api/usuarios/:id/prestamos
router.get('/:id/prestamos', getPrestamosPorUsuarioArray);

module.exports = router;
