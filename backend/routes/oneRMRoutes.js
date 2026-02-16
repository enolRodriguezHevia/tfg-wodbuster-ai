const express = require('express');
const router = express.Router();
const oneRMController = require('../controllers/oneRMController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Rutas de 1RM
router.post('/', oneRMController.registrarOneRM);
router.get('/:username/:ejercicio', oneRMController.obtenerHistorialPorEjercicio);
router.get('/:username/ejercicios/lista', oneRMController.obtenerListaEjercicios);
router.get('/:username', oneRMController.obtenerTodosLosRegistros);
router.delete('/:id', oneRMController.eliminarOneRM);

module.exports = router;
