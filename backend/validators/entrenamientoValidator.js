/**
 * Validaciones para entrenamientos y ejercicios
 */

/**
 * Valida un array de ejercicios completo
 * @param {Array} ejercicios - Array de ejercicios a validar
 * @returns {Object} - { valid: boolean, error: string|null }
 */
const validateEjercicios = (ejercicios) => {
  if (!ejercicios || !Array.isArray(ejercicios) || ejercicios.length === 0) {
    return { valid: false, error: 'Ejercicios debe ser un array no vacío' };
  }

  for (let i = 0; i < ejercicios.length; i++) {
    const error = validateEjercicio(ejercicios[i], i + 1);
    if (error) {
      return { valid: false, error };
    }
  }

  return { valid: true, error: null };
};

/**
 * Valida un ejercicio individual
 * @param {Object} ejercicio - Ejercicio a validar
 * @param {number} index - Índice del ejercicio (para mensajes de error)
 * @returns {string|null} - Mensaje de error o null si es válido
 */
const validateEjercicio = (ejercicio, index) => {
  if (!ejercicio.nombre || typeof ejercicio.nombre !== 'string' || !ejercicio.nombre.trim()) {
    return `Ejercicio ${index}: El nombre es obligatorio`;
  }

  if (typeof ejercicio.series !== 'number' || ejercicio.series < 1) {
    return `Ejercicio ${index}: Las series deben ser al menos 1`;
  }

  if (typeof ejercicio.repeticiones !== 'number' || ejercicio.repeticiones < 1) {
    return `Ejercicio ${index}: Las repeticiones deben ser al menos 1`;
  }

  if (typeof ejercicio.peso !== 'number' || ejercicio.peso < 0) {
    return `Ejercicio ${index}: El peso debe ser 0 o mayor`;
  }

  if (typeof ejercicio.valoracion !== 'number' || ejercicio.valoracion < 1 || ejercicio.valoracion > 10) {
    return `Ejercicio ${index}: La valoración debe estar entre 1 y 10`;
  }

  return null;
};

/**
 * Calcula el volumen total de un entrenamiento
 * @param {Array} ejercicios - Array de ejercicios
 * @returns {number} - Volumen total calculado
 */
const calcularVolumenTotal = (ejercicios) => {
  return ejercicios.reduce((total, ej) => {
    return total + (ej.peso * ej.repeticiones * ej.series);
  }, 0);
};

/**
 * Valida username
 * @param {string} username - Username a validar
 * @returns {boolean} - True si es válido
 */
const validateUsername = (username) => {
  return username && typeof username === 'string' && username.trim() !== '';
};

module.exports = {
  validateEjercicios,
  validateEjercicio,
  calcularVolumenTotal,
  validateUsername
};
