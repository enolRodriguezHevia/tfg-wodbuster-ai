/**
 * Utilidades para manejo de autenticación
 */

/**
 * Obtiene el usuario logueado desde localStorage
 * @returns {Object|null} Usuario con username, email, etc, o null si no existe
 */
export const getLoggedUser = () => {
  try {
    const userString = localStorage.getItem("user");
    if (!userString) return null;
    return JSON.parse(userString);
  } catch (error) {
    console.error("Error al obtener usuario del localStorage:", error);
    return null;
  }
};

/**
 * Obtiene solo el token del usuario logueado
 * @returns {string|null} Token de autenticación o null
 */
export const getAuthToken = () => {
  return localStorage.getItem("token") || null;
};

/**
 * Obtiene solo el username del usuario logueado
 * @returns {string|null} Username o null
 */
export const getUsername = () => {
  const user = getLoggedUser();
  return user?.username || null;
};

/**
 * Verifica si hay un usuario autenticado
 * @returns {boolean} True si hay un usuario logueado
 */
export const isAuthenticated = () => {
  return getLoggedUser() !== null;
};

/**
 * Guarda el usuario en localStorage
 * @param {Object} user - Objeto usuario con username, email, etc (sin token)
 */
export const saveUser = (user) => {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (error) {
    console.error("Error al guardar usuario en localStorage:", error);
  }
};

/**
 * Guarda el token JWT en localStorage
 * @param {string} token - Token JWT
 */
export const saveToken = (token) => {
  try {
    localStorage.setItem("token", token);
  } catch (error) {
    console.error("Error al guardar token en localStorage:", error);
  }
};

/**
 * Limpia los datos del usuario y token del localStorage
 */
export const clearUser = () => {
  try {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  } catch (error) {
    console.error("Error al limpiar usuario del localStorage:", error);
  }
};

/**
 * Actualiza el username del usuario en localStorage
 * @param {string} newUsername - Nuevo username
 */
export const updateUsername = (newUsername) => {
  const user = getLoggedUser();
  if (user) {
    user.username = newUsername;
    saveUser(user);
  }
};
