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

  if (!username || nombreEjercicio === undefined || nombreEjercicio === null || peso === undefined || peso === null) {
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
  // Debe ser string, 4-20 caracteres, solo letras, números y guiones bajos
  return (
    typeof username === 'string' &&
    /^[a-zA-Z0-9_]{4,20}$/.test(username)
  );
};

/**
 * Valida nombre de ejercicio
 * @param {string} nombreEjercicio - Nombre del ejercicio
 * @returns {boolean} - True si es válido
 */
const validateNombreEjercicio = (nombreEjercicio) => {
  // Debe ser string no vacío, solo letras y espacios
  return (
    typeof nombreEjercicio === 'string' &&
    /^[a-zA-ZáéíóúÁÉÍÓÚñÑ ]{3,40}$/.test(nombreEjercicio.trim())
  );
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
