const express = require('express');
const router = express.Router();
const multer = require('multer');
const userController = require('../controllers/userController');

// Rutas de usuario
router.get('/:username', userController.obtenerPerfil);
router.put('/:username', userController.actualizarPerfil);

// Ruta para subir foto de perfil con middleware de multer
router.post('/:username/photo', (req, res, next) => {
  userController.upload.single('profilePhoto')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'La imagen es demasiado grande. Tamaño máximo: 5MB' });
      }
      return res.status(400).json({ message: `Error al subir archivo: ${err.message}` });
    } else if (err) {
      // Error personalizado (tipo de archivo)
      return res.status(400).json({ message: err.message });
    }
    // Sin errores, continuar con el controlador
    next();
  });
}, userController.subirFotoPerfil);

router.delete('/:username', userController.eliminarCuenta);

// Rutas para configuración de LLM
router.get('/:username/llm/config', userController.obtenerConfiguracionLLM);
router.put('/:username/llm/preference', userController.actualizarPreferenciaLLM);

module.exports = router;
