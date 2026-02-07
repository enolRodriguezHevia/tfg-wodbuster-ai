/**
 * Validaciones para registros 1RM
 */

/**
 * Valida los datos de un registro 1RM
 * @param {Object} data - Datos del registro
 * @returns {Object} - { valid: boolean, error: string|null }
 */
const validateOneRMData = (data) => {
  const { username, nombreEjercicio, peso } = data;

  if (!username || !nombreEjercicio || !peso) {
    return { 
      valid: false, 
      error: 'Faltan campos obligatorios: username, nombreEjercicio y peso son requeridos' 
    };
  }

  if (!validateUsername(username)) {
    return { valid: false, error: 'Username inválido' };
  }

  if (!validateNombreEjercicio(nombreEjercicio)) {
    return { valid: false, error: 'Nombre de ejercicio inválido' };
  }

  if (!validatePeso(peso)) {
    return { valid: false, error: 'El peso debe ser un número mayor que 0' };
  }

  return { valid: true, error: null };
};

/**
 * Valida username
 * @param {string} username - Username a validar
 * @returns {boolean} - True si es válido
 */
const validateUsername = (username) => {
  return username && typeof username === 'string' && username.trim() !== '';
};

/**
 * Valida nombre de ejercicio
 * @param {string} nombreEjercicio - Nombre del ejercicio
 * @returns {boolean} - True si es válido
 */
const validateNombreEjercicio = (nombreEjercicio) => {
  return nombreEjercicio && typeof nombreEjercicio === 'string' && nombreEjercicio.trim() !== '';
};

/**
 * Valida peso para 1RM
 * @param {number} peso - Peso a validar
 * @returns {boolean} - True si es válido (número mayor que 0)
 */
const validatePeso = (peso) => {
  return typeof peso === 'number' && peso > 0;
};

module.exports = {
  validateOneRMData,
  validateUsername,
  validateNombreEjercicio,
  validatePeso
};
