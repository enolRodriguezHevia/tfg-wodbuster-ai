/**
 * Validaciones para autenticación y usuarios
 */

/**
 * Valida formato de email
 * @param {string} email - Email a validar
 * @returns {boolean} - True si el email es válido
 */
const validateEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

/**
 * Valida formato de username
 * @param {string} username - Username a validar
 * @returns {boolean} - True si el username es válido (4-20 caracteres alfanuméricos, guiones y guiones bajos)
 */
const validateUsername = (username) => {
  return /^[a-zA-Z0-9_-]{4,20}$/.test(username);
};

/**
 * Valida formato de contraseña
 * @param {string} password - Contraseña a validar
 * @returns {boolean} - True si la contraseña es válida (8-64 caracteres sin espacios)
 */
const validatePassword = (password) => {
  return /^[\S]{8,64}$/.test(password);
};

/**
 * Valida sexo del usuario
 * @param {string} sex - Sexo a validar
 * @returns {boolean} - True si es masculino, femenino o N/D
 */
const validateSex = (sex) => {
  return ['masculino', 'femenino', 'N/D'].includes(sex);
};

/**
 * Valida edad del usuario
 * @param {number} age - Edad a validar
 * @returns {boolean} - True si está entre 0 y 150
 */
const validateAge = (age) => {
  return !isNaN(age) && age >= 0 && age <= 150;
};

/**
 * Valida peso del usuario
 * @param {number} weight - Peso a validar en kg
 * @returns {boolean} - True si está entre 0 y 500
 */
const validateWeight = (weight) => {
  return !isNaN(weight) && weight >= 0 && weight <= 500;
};

/**
 * Valida altura del usuario
 * @param {number} height - Altura a validar en cm
 * @returns {boolean} - True si está entre 0 y 300
 */
const validateHeight = (height) => {
  return !isNaN(height) && height >= 0 && height <= 300;
};

module.exports = {
  validateEmail,
  validateUsername,
  validatePassword,
  validateSex,
  validateAge,
  validateWeight,
  validateHeight
};
