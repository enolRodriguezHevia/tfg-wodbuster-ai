import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, updateUserProfile } from "../api/api";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    sex: "N/D",
    age: "",
    weight: "",
    height: ""
  });

  const [editData, setEditData] = useState({
    email: "",
    newUsername: "",
    sex: "N/D",
    age: "",
    weight: "",
    height: "",
    currentPassword: "",
    newPassword: ""
  });

  useEffect(() => {
    // Obtener el username del usuario logueado (desde localStorage)
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!loggedUser || !loggedUser.username) {
      navigate("/login");
      return;
    }

    // Cargar los datos del perfil
    loadUserProfile(loggedUser.username);
  }, [navigate]);

  const loadUserProfile = async (username) => {
    try {
      setLoading(true);
      const response = await getUserProfile(username);
      
      // Actualizar userData con los datos reales del servidor
      const updatedUserData = {
        username: response.user.username,
        email: response.user.email,
        sex: response.user.sex || "N/D",
        age: response.user.age,
        weight: response.user.weight,
        height: response.user.height
      };
      
      setUserData(updatedUserData);
      
      // Actualizar editData con los valores actuales (convertir a string para los inputs)
      setEditData({
        email: response.user.email,
        newUsername: response.user.username,
        sex: response.user.sex || "N/D",
        age: response.user.age ? String(response.user.age) : "",
        weight: response.user.weight ? String(response.user.weight) : "",
        height: response.user.height ? String(response.user.height) : "",
        currentPassword: "",
        newPassword: ""
      });
      
      setLoading(false);
    } catch (err) {
      setError(err.message || "Error al cargar el perfil");
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  const handleClearField = (fieldName) => {
    if (fieldName === 'sex') {
      // Para el campo sex, establecer como N/D
      setEditData({
        ...editData,
        [fieldName]: "N/D"
      });
    } else {
      // Para otros campos, dejar vacío
      setEditData({
        ...editData,
        [fieldName]: ""
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validaciones de campos obligatorios
    if (!editData.newUsername || editData.newUsername.trim() === "") {
      setError("El nombre de usuario no puede estar vacío");
      return;
    }

    if (!editData.email || editData.email.trim() === "") {
      setError("El correo electrónico no puede estar vacío");
      return;
    }

    // Si se está intentando cambiar contraseña, validar
    if (editData.newPassword && editData.newPassword.trim() !== "") {
      if (!editData.currentPassword || editData.currentPassword.trim() === "") {
        setError("Debes proporcionar la contraseña actual para cambiarla");
        return;
      }
    }

    // Si se proporciona contraseña actual pero no nueva contraseña
    if (editData.currentPassword && editData.currentPassword.trim() !== "" && 
        (!editData.newPassword || editData.newPassword.trim() === "")) {
      setError("Debes proporcionar una nueva contraseña");
      return;
    }

    try {
      // Preparar datos para enviar (convertir strings vacíos a null para eliminar campos numéricos)
      const dataToSend = {
        email: editData.email,
        newUsername: editData.newUsername,
        sex: editData.sex || "N/D",
        age: editData.age && editData.age !== "" ? Number(editData.age) : null,
        weight: editData.weight && editData.weight !== "" ? Number(editData.weight) : null,
        height: editData.height && editData.height !== "" ? Number(editData.height) : null,
      };

      // Solo añadir contraseñas si se están cambiando
      if (editData.newPassword && editData.newPassword.trim() !== "") {
        dataToSend.currentPassword = editData.currentPassword;
        dataToSend.newPassword = editData.newPassword;
      }

      const response = await updateUserProfile(userData.username, dataToSend);
      
      // Actualizar localStorage si cambió el username
      if (editData.newUsername !== userData.username) {
        const loggedUser = JSON.parse(localStorage.getItem("user"));
        loggedUser.username = editData.newUsername;
        localStorage.setItem("user", JSON.stringify(loggedUser));
      }
      
      // Recargar los datos del perfil desde el servidor
      await loadUserProfile(editData.newUsername);
      
      // Salir del modo edición
      setIsEditing(false);
      
      // Mostrar mensaje de éxito después de recargar
      setSuccessMessage(response.message || "Perfil actualizado con éxito");
      
    } catch (err) {
      setError(err.message || "Error al actualizar el perfil");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  if (loading) {
    return <div className="profile-container"><p>Cargando perfil...</p></div>;
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <h1>Mi Perfil</h1>
        <button className="logout-btn" onClick={handleLogout}>Cerrar Sesión</button>
      </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {!isEditing ? (
        // Modo visualización
        <div className="profile-view">
          <div className="profile-info">
            <div className="info-row">
              <span className="info-label">Usuario:</span>
              <span className="info-value">{userData.username}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Email:</span>
              <span className="info-value">{userData.email}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Sexo:</span>
              <span className="info-value">{userData.sex}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Edad:</span>
              <span className="info-value">{userData.age || "No especificado"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Peso (kg):</span>
              <span className="info-value">{userData.weight || "No especificado"}</span>
            </div>
            <div className="info-row">
              <span className="info-label">Altura (cm):</span>
              <span className="info-value">{userData.height || "No especificado"}</span>
            </div>
          </div>
          <button className="edit-btn" onClick={() => setIsEditing(true)}>
            Modificar datos
          </button>
        </div>
      ) : (
        // Modo edición
        <form className="profile-edit" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Usuario: <span className="required">*</span></label>
            <input
              type="text"
              name="newUsername"
              value={editData.newUsername}
              onChange={handleChange}
              placeholder="Nuevo username"
              required
            />
          </div>

          <div className="form-group">
            <label>Email: <span className="required">*</span></label>
            <input
              type="email"
              name="email"
              value={editData.email}
              onChange={handleChange}
              placeholder="Nuevo email"
              required
            />
          </div>

          <div className="form-group">
            <label>Sexo: <span className="optional">(Opcional)</span></label>
            <div className="input-with-clear">
              <select name="sex" value={editData.sex} onChange={handleChange}>
                <option value="N/D">N/D</option>
                <option value="masculino">Masculino</option>
                <option value="femenino">Femenino</option>
              </select>
              <button 
                type="button" 
                className="clear-btn" 
                onClick={() => handleClearField('sex')}
                title="Establecer como N/D"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Edad: <span className="optional">(Opcional)</span></label>
            <div className="input-with-clear">
              <input
                type="number"
                name="age"
                value={editData.age}
                onChange={handleChange}
                placeholder="Tu edad (deja vacío para 'No especificado')"
                min="0"
                max="150"
              />
              <button 
                type="button" 
                className="clear-btn" 
                onClick={() => handleClearField('age')}
                title="Eliminar edad"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Peso (kg): <span className="optional">(Opcional)</span></label>
            <div className="input-with-clear">
              <input
                type="number"
                name="weight"
                value={editData.weight}
                onChange={handleChange}
                placeholder="Tu peso (deja vacío para 'No especificado')"
                min="0"
                max="500"
                step="0.1"
              />
              <button 
                type="button" 
                className="clear-btn" 
                onClick={() => handleClearField('weight')}
                title="Eliminar peso"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="form-group">
            <label>Altura (cm): <span className="optional">(Opcional)</span></label>
            <div className="input-with-clear">
              <input
                type="number"
                name="height"
                value={editData.height}
                onChange={handleChange}
                placeholder="Tu altura (deja vacío para 'No especificado')"
                min="0"
                max="300"
                step="0.1"
              />
              <button 
                type="button" 
                className="clear-btn" 
                onClick={() => handleClearField('height')}
                title="Eliminar altura"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="password-section">
            <h3>Cambiar Contraseña (Opcional)</h3>
            <div className="form-group">
              <label>Contraseña Actual:</label>
              <input
                type="password"
                name="currentPassword"
                value={editData.currentPassword}
                onChange={handleChange}
                placeholder="Contraseña actual"
              />
            </div>

            <div className="form-group">
              <label>Nueva Contraseña:</label>
              <input
                type="password"
                name="newPassword"
                value={editData.newPassword}
                onChange={handleChange}
                placeholder="Nueva contraseña (mínimo 8 caracteres)"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="save-btn">Guardar Cambios</button>
            <button 
              type="button" 
              className="cancel-btn" 
              onClick={() => {
                setIsEditing(false);
                setError("");
                setSuccessMessage("");
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
