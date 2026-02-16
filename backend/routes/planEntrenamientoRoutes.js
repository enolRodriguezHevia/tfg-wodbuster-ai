const express = require('express');
const router = express.Router();
const planEntrenamientoController = require('../controllers/planEntrenamientoController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Generar nuevo plan de entrenamiento (devuelve el prompt por ahora)
router.post('/generar/:username', planEntrenamientoController.generarPlanEntrenamiento);

// Obtener planes anteriores del usuario
router.get('/mis-planes/:username', planEntrenamientoController.obtenerPlanesAnteriores);

// Obtener un plan específico por ID
router.get('/:username/:planId', planEntrenamientoController.obtenerPlanPorId);

// Eliminar un plan
router.delete('/:username/:planId', planEntrenamientoController.eliminarPlan);

module.exports = router;
