import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getUserProfile, updateUserProfile, uploadProfilePhoto, deleteUserAccount } from "../api/api";
import { getLoggedUser, updateUsername as updateUsernameAuth } from "../utils/auth";
import Navbar from "../components/Navbar";
import ImageCropper from "../components/ImageCropper";
import "./Profile.css";

export default function Profile() {
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState(null);
  
  // Estados para eliminación de cuenta
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [accountDeleted, setAccountDeleted] = useState(false);
  
  const [userData, setUserData] = useState({
    username: "",
    email: "",
    sex: "N/D",
    age: "",
    weight: "",
    height: "",
    profilePhoto: null
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
    const loggedUser = getLoggedUser();
    
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
        height: response.user.height,
        profilePhoto: response.user.profilePhoto || null
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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validar tamaño (5MB máximo)
      const maxSize = 5 * 1024 * 1024; // 5MB en bytes
      if (file.size > maxSize) {
        setError("La imagen es demasiado grande. Tamaño máximo: 5MB");
        e.target.value = null; // Limpiar el input
        return;
      }

      // Validar tipo de archivo
      const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
      if (!validTypes.includes(file.type)) {
        setError("Solo se permiten imágenes en formato PNG o JPG");
        e.target.value = null; // Limpiar el input
        return;
      }

      setError(""); // Limpiar errores previos
      
      // Crear preview de la imagen para el cropper
      const reader = new FileReader();
      reader.onloadend = () => {
        setImageToCrop(reader.result);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image();
      image.addEventListener('load', () => resolve(image));
      image.addEventListener('error', (error) => reject(error));
      image.setAttribute('crossOrigin', 'anonymous');
      image.src = url;
    });

  const getCroppedImg = async (imageSrc, pixelCrop) => {
    const image = await createImage(imageSrc);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    canvas.width = pixelCrop.width;
    canvas.height = pixelCrop.height;

    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob);
      }, 'image/jpeg', 0.95);
    });
  };

  const handleCropComplete = async (croppedAreaPixels) => {
    try {
      const croppedBlob = await getCroppedImg(imageToCrop, croppedAreaPixels);
      
      // Crear un archivo desde el blob
      const croppedFile = new File([croppedBlob], "profile.jpg", { type: "image/jpeg" });
      
      setSelectedFile(croppedFile);
      
      // Crear preview de la imagen recortada
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(croppedBlob);
      
      setShowCropper(false);
      setImageToCrop(null);
    } catch (error) {
      setError("Error al procesar la imagen");
    }
  };

  const handleCancelCrop = () => {
    setShowCropper(false);
    setImageToCrop(null);
    // Limpiar el input de archivo
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = null;
  };

  const handleUploadPhoto = async () => {
    if (!selectedFile) {
      setError("Por favor selecciona una imagen");
      return;
    }

    try {
      setError("");
      const response = await uploadProfilePhoto(userData.username, selectedFile);
      setSuccessMessage("Foto de perfil actualizada con éxito");
      
      // Recargar los datos del perfil
      await loadUserProfile(userData.username);
      
      // Limpiar el archivo seleccionado y preview
      setSelectedFile(null);
      setPreviewImage(null);
      
      // Limpiar el input de archivo
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = null;
      
      // Actualizar localStorage
      const loggedUser = JSON.parse(localStorage.getItem("user"));
      loggedUser.profilePhoto = response.profilePhoto;
      localStorage.setItem("user", JSON.stringify(loggedUser));
      
    } catch (err) {
      setError(err.message || "Error al subir la foto");
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
        updateUsernameAuth(editData.newUsername);
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

  const handleDeleteAccount = () => {
    // Mostrar el modal de confirmación
    setShowDeleteModal(true);
    setDeleteError("");
    setDeletePassword("");
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setDeletePassword("");
    setDeleteError("");
  };

  const handleConfirmDelete = async (e) => {
    e.preventDefault();
    setDeleteError("");

    // Validar que se proporcionó la contraseña
    if (!deletePassword || deletePassword.trim() === "") {
      setDeleteError("Debe introducir su contraseña para confirmar");
      return;
    }

    try {
      // Llamar a la API para eliminar la cuenta
      await deleteUserAccount(userData.username, deletePassword);
      
      // Limpiar localStorage
      localStorage.removeItem("user");
      
      // Mostrar pantalla de confirmación de eliminación
      setAccountDeleted(true);
      setShowDeleteModal(false);
      
    } catch (err) {
      setDeleteError(err.message || "Error al eliminar la cuenta");
    }
  };

  const handleReturnToLogin = () => {
    navigate("/");
  };

  if (loading) {
    return <div className="profile-container"><p>Cargando perfil...</p></div>;
  }

  return (
    <>
      <Navbar />
      <div className="profile-container">
        <div className="profile-header">
          <h1>Mi Perfil</h1>
          <p className="subtitle">Gestiona tu información personal y configuración de cuenta</p>
        </div>

      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}

      {!isEditing ? (
        // Modo visualización
        <div className="profile-view">
          {/* Tarjeta principal con foto y datos básicos */}
          <div className="profile-main-card">
            <div className="profile-photo-wrapper">
              {userData.profilePhoto ? (
                <img 
                  src={
                    userData.profilePhoto && userData.profilePhoto.startsWith('http')
                      ? userData.profilePhoto
                      : userData.profilePhoto
                  }
                  alt="Foto de perfil" 
                  className="profile-photo"
                />
              ) : (
                <div className="profile-photo-placeholder">
                  <span className="placeholder-icon">👤</span>
                </div>
              )}
              <div className="profile-badge">Atleta</div>
            </div>
            
            <div className="profile-main-info">
              <h2 className="profile-name">{userData.username}</h2>
              <p className="profile-email">
                <span className="email-icon">✉️</span>
                {userData.email}
              </p>
            </div>
          </div>

          {/* Grid de estadísticas mejorado o mensaje de sin datos */}
          <div className="stats-section">
            <h3 className="section-title">📋 Datos Personales</h3>
            
            {/* Verificar si el usuario tiene datos registrados */}
            {(!userData.age && !userData.weight && !userData.height && userData.sex === "N/D") ? (
              <div className="no-data-message">
                <div className="no-data-icon">📝</div>
                <h4>No hay datos personales registrados</h4>
                <p>Completa tu perfil para llevar un mejor seguimiento de tu progreso</p>
              </div>
            ) : (
              <div className="profile-stats-grid">
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">⚧️</div>
                    <span className="stat-label">Sexo</span>
                  </div>
                  <span className="stat-value">{userData.sex}</span>
                </div>
                
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">🎂</div>
                    <span className="stat-label">Edad</span>
                  </div>
                  <span className="stat-value">{userData.age ? `${userData.age} años` : "N/D"}</span>
                </div>
                
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">⚖️</div>
                    <span className="stat-label">Peso</span>
                  </div>
                  <span className="stat-value">{userData.weight ? `${userData.weight} kg` : "N/D"}</span>
                </div>
                
                <div className="stat-card">
                  <div className="stat-header">
                    <div className="stat-icon">📏</div>
                    <span className="stat-label">Altura</span>
                  </div>
                  <span className="stat-value">{userData.height ? `${userData.height} cm` : "N/D"}</span>
                </div>
              </div>
            )}
          </div>

          {/* Botones de acción */}
          <div className="profile-actions">
            <button className="edit-btn" onClick={() => setIsEditing(true)}>
              <span className="btn-icon">✏️</span>
              Modificar Perfil
            </button>
            <button className="delete-account-btn" onClick={handleDeleteAccount}>
              <span className="btn-icon">🗑️</span>
              Eliminar Cuenta
            </button>
          </div>
        </div>
      ) : (
        // Modo edición
        <form className="profile-edit" onSubmit={handleSubmit}>
          {/* Sección de foto de perfil */}
          <div className="photo-upload-section">
            <h3>Foto de Perfil</h3>
            <div className="photo-upload-container">
              <div className="current-photo">
                {previewImage ? (
                  <img src={previewImage} alt="Preview" className="profile-photo-preview" />
                ) : userData.profilePhoto ? (
                  <img 
                    src={
                      userData.profilePhoto && userData.profilePhoto.startsWith('http')
                        ? userData.profilePhoto
                        : `${process.env.REACT_APP_API_URL?.replace(/\/api$/, '')}/${userData.profilePhoto}`
                    }
                    alt="Foto actual" 
                    className="profile-photo-preview"
                  />
                ) : (
                  <div className="no-photo">Sin foto</div>
                )}
              </div>
              <div className="photo-upload-controls">
                <input
                  type="file"
                  id="profilePhotoInput"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <label htmlFor="profilePhotoInput" className="select-photo-btn">
                  Seleccionar Foto
                </label>
                {selectedFile && (
                  <button 
                    type="button" 
                    className="upload-photo-btn"
                    onClick={handleUploadPhoto}
                  >
                    Subir Foto
                  </button>
                )}
              </div>
            </div>
          </div>

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

      {/* Modal de recorte de imagen */}
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          onComplete={handleCropComplete}
          onCancel={handleCancelCrop}
        />
      )}

      {/* Modal de confirmación de eliminación de cuenta */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-container delete-modal">
            <h2>⚠️ Eliminar Cuenta</h2>
            <div className="modal-content">
              <p className="warning-title">Esta acción es irreversible</p>
              <ul className="warning-list">
                <li>Se eliminarán todos tus datos personales de forma permanente</li>
                <li>Perderás el acceso a todas las funcionalidades de la aplicación</li>
                <li>No podrás recuperar tu cuenta una vez eliminada</li>
              </ul>
              
              <form onSubmit={handleConfirmDelete} className="delete-form">
                <div className="form-group">
                  <label>Para confirmar, introduce tu contraseña:</label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="Contraseña"
                    autoFocus
                  />
                </div>
                
                {deleteError && <div className="error-message">{deleteError}</div>}
                
                <div className="modal-actions">
                  <button type="submit" className="btn-danger">
                    Eliminar mi cuenta
                  </button>
                  <button type="button" className="btn-cancel" onClick={handleCancelDelete}>
                    Cancelar
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Pantalla de cuenta eliminada */}
      {accountDeleted && (
        <div className="modal-overlay">
          <div className="modal-container account-deleted-modal">
            <h2>✅ Cuenta Eliminada</h2>
            <div className="modal-content">
              <p className="success-text">
                Tu cuenta ha sido eliminada permanentemente.
              </p>
              <p className="info-text">
                Todos tus datos personales han sido eliminados de nuestros sistemas.
              </p>
              <button className="btn-primary" onClick={handleReturnToLogin}>
                Aceptar
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </>
  );
}
