const express = require('express');
const router = express.Router();
const entrenamientoController = require('../controllers/entrenamientoController');

// Rutas de entrenamientos
router.post('/', entrenamientoController.registrarEntrenamiento);
router.get('/:username', entrenamientoController.obtenerEntrenamientos);
router.get('/detalle/:id', entrenamientoController.obtenerEntrenamientoPorId);
router.delete('/:id', entrenamientoController.eliminarEntrenamiento);
router.get('/:username/stats', entrenamientoController.obtenerEstadisticas);

module.exports = router;
