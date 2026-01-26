const API_URL = "http://localhost:3000/api"; // Cambia el puerto si tu backend es otro

// Función genérica para manejar fetch
async function request(endpoint, method = "GET", body) {
  try {
    const options = {
      method,
      headers: {
        "Content-Type": "application/json"
      },
      body: body ? JSON.stringify(body) : undefined
    };

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error en la petición");
    }

    return data;
  } catch (error) {
    // Mensaje de depuración
    console.error(`DEBUG: Error en request a ${endpoint}:`, error);
    throw error;
  }
}

// --- Funciones específicas de cada recurso ---

// Auth
export const signUpUser = (userData) => request("/auth/signup", "POST", userData);
export const loginUser = (credentials) => request("/auth/login", "POST", credentials);

// User Profile
export const getUserProfile = (username) => request(`/user/${username}`);
export const updateUserProfile = (username, userData) => request(`/user/${username}`, "PUT", userData);

// Users (ejemplo: obtener lista de usuarios)
export const getUsers = () => request("/users");

// WODs (ejemplo: obtener lista de WODs)
export const getWods = () => request("/wods");
export const createWod = (wodData) => request("/wods", "POST", wodData);

// Aquí puedes añadir más recursos según tu backend


