const API_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api"; // Usa variable de entorno para la URL del backend

// Función genérica para manejar fetch
async function request(endpoint, method = "GET", body) {
  try {
    const headers = {
      "Content-Type": "application/json"
    };

    // Agregar token JWT si existe (excepto para login y signup)
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    };

    const res = await fetch(`${API_URL}${endpoint}`, options);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || "Error en la petición");
    }

    return data;
  } catch (error) {
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
export const deleteUserAccount = (username, password) => request(`/user/${username}`, "DELETE", { password });

// Upload Profile Photo
export const uploadProfilePhoto = async (username, file) => {
  try {
    const formData = new FormData();
    formData.append('profilePhoto', file);

    const headers = {};
    
    // Agregar token JWT si existe
    const token = localStorage.getItem("token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}/user/${username}/photo`, {
      method: 'POST',
      headers,
      body: formData
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.message || data.error || "Error al subir la foto");
    }

    return data;
  } catch (error) {    
    // Si el error ya es un Error con mensaje, lanzarlo tal cual
    if (error instanceof Error) {
      throw error;
    }
    
    // Si no, crear un nuevo Error
    throw new Error("Error al subir la foto de perfil");
  }
};

// Users (ejemplo: obtener lista de usuarios)
export const getUsers = () => request("/users");

// WODs (ejemplo: obtener lista de WODs)
export const getWods = () => request("/wods");
export const createWod = (wodData) => request("/wods", "POST", wodData);

// 1RM (One Rep Max)
export const registerOneRM = (oneRMData) => request("/onerm", "POST", oneRMData);
export const getOneRMHistory = (username, ejercicio) => request(`/onerm/${username}/${ejercicio}`);
export const getOneRMExercises = (username) => request(`/onerm/${username}/ejercicios/lista`);
export const getAllOneRM = (username) => request(`/onerm/${username}`);
export const deleteOneRM = (id) => request(`/onerm/${id}`, "DELETE");

// Entrenamientos
export const registerEntrenamiento = (entrenamientoData) => request("/entrenamiento", "POST", entrenamientoData);
export const getEntrenamientos = (username) => request(`/entrenamiento/${username}`);
export const getEntrenamientoDetalle = (id) => request(`/entrenamiento/detalle/${id}`);
export const deleteEntrenamiento = (id) => request(`/entrenamiento/${id}`, "DELETE");
export const getEntrenamientoStats = (username) => request(`/entrenamiento/${username}/stats`);

// WODs CrossFit
export const registerWodCrossFit = (wodData) => request("/wod-crossfit", "POST", wodData);
export const getWodsCrossFit = (username) => request(`/wod-crossfit/${username}`);
export const deleteWodCrossFit = (id) => request(`/wod-crossfit/${id}`, "DELETE");

// Plan de Entrenamiento (con streaming SSE)
export const generarPlanEntrenamiento = async (username, nombre, onChunk, onDone, onError) => {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json"
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const body = nombre ? { nombre } : {};

    const response = await fetch(`${API_URL}/plan-entrenamiento/generar/${username}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error en la petición");
    }

    // Leer el stream SSE
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Procesar todas las líneas completas
      buffer = lines.pop() || ''; // Guardar la última línea incompleta
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6); // Remover 'data: '
          
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const event = JSON.parse(data);
            
            if (event.type === 'chunk' && onChunk) {
              onChunk(event.content);
            } else if (event.type === 'done' && onDone) {
              onDone({
                planId: event.planId,
                advertencia: event.advertencia,
                metadata: event.metadata
              });
            } else if (event.type === 'error' && onError) {
              onError(new Error(event.message || 'Error desconocido'));
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
  }
};
export const obtenerPlanesAnteriores = (username) => request(`/plan-entrenamiento/mis-planes/${username}`);
export const obtenerPlanPorId = (username, planId) => request(`/plan-entrenamiento/${username}/${planId}`);
export const eliminarPlan = (username, planId) => request(`/plan-entrenamiento/${username}/${planId}`, "DELETE");

// Configuración de LLM
export const obtenerConfiguracionLLM = (username) => request(`/user/${username}/llm/config`);
export const actualizarPreferenciaLLM = (username, llmPreference) => request(`/user/${username}/llm/preference`, "PUT", { llmPreference });

// Análisis de Video (con streaming SSE)
export const analizarVideoConStreaming = async (formData, onChunk, onDone, onError) => {
  try {
    const token = localStorage.getItem("token");
    const headers = {};
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_URL}/analisis-video/analizar`, {
      method: 'POST',
      headers,
      body: formData
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || "Error en la petición");
    }

    // Leer el stream SSE
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      
      // Procesar todas las líneas completas
      buffer = lines.pop() || '';
      
      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          
          if (data === '[DONE]') {
            continue;
          }
          
          try {
            const event = JSON.parse(data);
            
            if (event.type === 'chunk' && onChunk) {
              onChunk(event.content);
            } else if (event.type === 'done' && onDone) {
              onDone({
                analisisId: event.analisisId,
                ejercicio: event.ejercicio,
                esCorrecta: event.esCorrecta,
                angulos: event.angulos,
                rompioParalelo: event.rompioParalelo,
                fechaAnalisis: event.fechaAnalisis,
                usaIA: event.usaIA,
                tokensUsados: event.tokensUsados,
                metadata: event.metadata
              });
            } else if (event.type === 'error' && onError) {
              onError(new Error(event.message || 'Error desconocido'));
            }
          } catch (e) {
            console.error('Error parsing SSE data:', e);
          }
        }
      }
    }
  } catch (error) {
    if (onError) {
      onError(error);
    } else {
      throw error;
    }
  }
};

// Aquí puedes añadir más recursos según tu backend



