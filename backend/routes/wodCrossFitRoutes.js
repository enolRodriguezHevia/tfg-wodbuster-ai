const express = require('express');
const router = express.Router();
const wodCrossFitController = require('../controllers/wodCrossFitController');

// Rutas de WODs CrossFit
router.post('/', wodCrossFitController.registrarWod);
router.get('/:username', wodCrossFitController.obtenerWods);
router.delete('/:id', wodCrossFitController.eliminarWod);

module.exports = router;
