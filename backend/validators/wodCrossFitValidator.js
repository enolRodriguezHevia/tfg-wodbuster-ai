/**
 * Validaciones para WODs CrossFit
 */

// WODs válidos en el sistema
const VALID_WODS = [
  'Fran', 'Isabel', 'Grace', 'Randy', 'Diane', 
  'Elizabeth', 'Linda', 'King Kong', 'DT', 'Bear Complex'
];

// Niveles válidos
const VALID_NIVELES = ['rx', 'intermedio', 'escalado'];

/**
 * Valida los datos completos de un WOD
 * @param {Object} data - Datos del WOD
 * @returns {Object} - { valid: boolean, error: string|null }
 */
const validateWodData = (data) => {
  const { username, nombreWod, nivel, tiempo } = data;

  if (!username || !nombreWod || !nivel || tiempo === undefined) {
    return { 
      valid: false, 
      error: 'Faltan campos obligatorios: username, nombreWod, nivel y tiempo son requeridos' 
    };
  }

  if (!validateUsername(username)) {
    return { valid: false, error: 'Username inválido' };
  }

  if (!validateNombreWod(nombreWod)) {
    return { valid: false, error: `WOD inválido. Debe ser uno de: ${VALID_WODS.join(', ')}` };
  }

  if (!validateNivel(nivel)) {
    return { valid: false, error: 'Nivel inválido. Debe ser: rx, intermedio o escalado' };
  }

  if (!validateTiempo(tiempo)) {
    return { valid: false, error: 'El tiempo debe ser un número positivo (en segundos)' };
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
 * Valida nombre del WOD
 * @param {string} nombreWod - Nombre del WOD
 * @returns {boolean} - True si es un WOD válido
 */
const validateNombreWod = (nombreWod) => {
  return VALID_WODS.includes(nombreWod);
};

/**
 * Valida nivel del WOD
 * @param {string} nivel - Nivel del WOD
 * @returns {boolean} - True si es un nivel válido
 */
const validateNivel = (nivel) => {
  return VALID_NIVELES.includes(nivel);
};

/**
 * Valida tiempo del WOD
 * @param {number} tiempo - Tiempo en segundos
 * @returns {boolean} - True si es válido (número positivo)
 */
const validateTiempo = (tiempo) => {
  return typeof tiempo === 'number' && tiempo > 0;
};

/**
 * Valida notas opcionales
 * @param {string} notas - Notas del WOD
 * @returns {boolean} - True si es válido (máximo 500 caracteres)
 */
const validateNotas = (notas) => {
  if (!notas) return true;
  return typeof notas === 'string' && notas.length <= 500;
};

module.exports = {
  validateWodData,
  validateUsername,
  validateNombreWod,
  validateNivel,
  validateTiempo,
  validateNotas,
  VALID_WODS,
  VALID_NIVELES
};
