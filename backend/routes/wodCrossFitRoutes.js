const express = require('express');
const router = express.Router();
const wodCrossFitController = require('../controllers/wodCrossFitController');
const authMiddleware = require('../middleware/authMiddleware');

// Proteger todas las rutas con autenticación
router.use(authMiddleware);

// Rutas de WODs CrossFit
router.post('/', wodCrossFitController.registrarWod);
router.get('/:username', wodCrossFitController.obtenerWods);
router.delete('/:id', wodCrossFitController.eliminarWod);

module.exports = router;
