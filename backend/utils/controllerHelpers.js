const User = require('../models/User');

/**
 * Busca un usuario por username y devuelve un error estándar si no se encuentra
 * @param {string} username - El username del usuario a buscar
 * @param {Object} res - Objeto de respuesta Express
 * @returns {Promise<Object|null>} El usuario encontrado o null si no existe (con respuesta enviada)
 */
const buscarUsuario = async (username, res) => {
  const user = await User.findOne({ username });
  if (!user) {
    res.status(404).json({ message: 'Usuario no encontrado' });
    return null;
  }
  return user;
};

/**
 * Maneja errores de servidor de forma estandarizada
 * @param {Object} res - Objeto de respuesta Express
 * @param {Error} err - El error capturado
 * @param {string} contexto - Contexto del error (ej: "al registrar entrenamiento")
 * @param {boolean} includeStack - Si se debe incluir stack trace en los logs
 */
const manejarErrorServidor = (res, err, contexto = '', includeStack = false) => {
  res.status(500).json({ 
    message: 'Error del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message })
  });
};

/**
 * Valida datos de entrada y envía respuesta de error si no son válidos
 * @param {Object} validation - Objeto de validación con propiedades { valid, error }
 * @param {Object} res - Objeto de respuesta Express
 * @returns {boolean} true si la validación pasó, false si falló (con respuesta enviada)
 */
const validarDatos = (validation, res) => {
  if (!validation.valid) {
    res.status(400).json({ message: validation.error });
    return false;
  }
  return true;
};

/**
 * Wrapper para controladores asíncronos que maneja errores automáticamente
 * @param {Function} fn - Función asíncrona del controlador
 * @param {string} contexto - Contexto para logging de errores
 * @returns {Function} Función envuelta con manejo de errores
 */
const asyncHandler = (fn, contexto = '') => {
  return async (req, res, next) => {
    try {
      await fn(req, res, next);
    } catch (err) {
      manejarErrorServidor(res, err, contexto, true);
    }
  };
};

module.exports = {
  buscarUsuario,
  manejarErrorServidor,
  validarDatos,
  asyncHandler
};
