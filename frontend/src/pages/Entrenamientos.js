import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerEntrenamiento, getEntrenamientos, deleteEntrenamiento } from "../api/api";
import Navbar from "../components/Navbar";
import "./Entrenamientos.css";
import ModalConfirmacion from "../components/ModalConfirmacion";


// Lista predefinida de ejercicios (misma que en Benchmarks)
const EJERCICIOS_DISPONIBLES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Barbell Row",
  "Front Squat",
  "Incline Press",
  "Hip Thrust",
  "Clean",
  "Snatch",
  "Thruster",
  "Lunges",
  "Leg Press",
  "Shoulder Press",
  "Romanian Deadlift",
  "Sumo Deadlift",
  "Cable Row",
  "Lat Pulldown",
  "Leg Curl",
  "Leg Extension"
];

export default function Entrenamientos() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [entrenamientos, setEntrenamientos] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [selectedEntrenamiento, setSelectedEntrenamiento] = useState(null);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0]
  });

  const [ejercicios, setEjercicios] = useState([{
    nombre: "",
    series: "",
    repeticiones: "",
    peso: "",
    valoracion: ""
  }]);

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!loggedUser || !loggedUser.username) {
      navigate("/login");
      return;
    }

    setUsername(loggedUser.username);
    loadEntrenamientos(loggedUser.username);
  }, [navigate]);

  const loadEntrenamientos = async (user) => {
    try {
      const response = await getEntrenamientos(user);
      setEntrenamientos(response.entrenamientos || []);
    } catch (err) {
      setError(err.message || "Error al cargar entrenamientos");
    }
  };

  const handleAddEjercicio = () => {
    setEjercicios([...ejercicios, {
      nombre: "",
      series: "",
      repeticiones: "",
      peso: "",
      valoracion: ""
    }]);
  };

  const handleRemoveEjercicio = (index) => {
    if (ejercicios.length > 1) {
      const newEjercicios = ejercicios.filter((_, i) => i !== index);
      setEjercicios(newEjercicios);
    }
  };

  const handleEjercicioChange = (index, field, value) => {
    const newEjercicios = [...ejercicios];
    newEjercicios[index][field] = value;
    setEjercicios(newEjercicios);
  };

  const resetFormulario = () => {
    setFormData({ fecha: new Date().toISOString().split('T')[0] });
    setEjercicios([{
      nombre: "",
      series: "",
      repeticiones: "",
      peso: "",
      valoracion: ""
    }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validar que todos los ejercicios estén completos
    for (let i = 0; i < ejercicios.length; i++) {
      const ej = ejercicios[i];
      
      if (!ej.nombre || ej.nombre.trim() === "") {
        setError(`Ejercicio ${i + 1}: El nombre es obligatorio`);
        return;
      }
      
      if (!ej.series || parseInt(ej.series) < 1) {
        setError(`Ejercicio ${i + 1}: Las series deben ser al menos 1`);
        return;
      }
      
      if (!ej.repeticiones || parseInt(ej.repeticiones) < 1) {
        setError(`Ejercicio ${i + 1}: Las repeticiones deben ser al menos 1`);
        return;
      }
      
      if (ej.peso === "" || parseFloat(ej.peso) < 0) {
        setError(`Ejercicio ${i + 1}: El peso debe ser 0 o mayor`);
        return;
      }
      
      if (!ej.valoracion || parseInt(ej.valoracion) < 1 || parseInt(ej.valoracion) > 10) {
        setError(`Ejercicio ${i + 1}: La valoración debe estar entre 1 y 10`);
        return;
      }
    }

    try {
      const ejerciciosValidados = ejercicios.map(ej => ({
        nombre: ej.nombre,
        series: parseInt(ej.series),
        repeticiones: parseInt(ej.repeticiones),
        peso: parseFloat(ej.peso),
        valoracion: parseInt(ej.valoracion)
      }));

      await registerEntrenamiento({
        username: username,
        fecha: formData.fecha,
        ejercicios: ejerciciosValidados
      });

      setSuccessMessage("Entrenamiento registrado con éxito");
      
      // Resetear formulario
      resetFormulario();
      
      setShowForm(false);
      
      // Recargar entrenamientos
      await loadEntrenamientos(username);

    } catch (err) {
      setError(err.message || "Error al registrar el entrenamiento");
    }
  };

  // Abrir modal
  const handleDeleteClick = (id) => {
    setRecordToDelete(id);
    setShowDeleteModal(true);
  };
  
  // Confirmar eliminación
    const confirmDeleteRecord = async () => {
      try {
        await deleteEntrenamiento(recordToDelete);
  
        setSuccessMessage("Registro eliminado con éxito");
  
        setShowDeleteModal(false);
        setRecordToDelete(null);
  
        await loadEntrenamientos(username);
  
      } catch (err) {
        setError("Error al eliminar el registro");
        setShowDeleteModal(false);
      }
    };

  const calcularVolumenTotal = () => {
    return ejercicios.reduce((total, ej) => {
      if (ej.series && ej.repeticiones && ej.peso) {
        return total + (parseFloat(ej.peso) * parseInt(ej.repeticiones) * parseInt(ej.series));
      }
      return total;
    }, 0);
  };

  const handleViewEntrenamiento = (entrenamiento) => {
    setSelectedEntrenamiento(entrenamiento);
  };

  const handleCloseModal = () => {
    setSelectedEntrenamiento(null);
  };

  const calcularVolumenEjercicio = (ejercicio) => {
    return ejercicio.series * ejercicio.repeticiones * ejercicio.peso;
  };

  return (
    <>
      <Navbar />
      <div className="entrenamientos-container">
        <div className="entrenamientos-header">
          <h1>Mis Entrenamientos</h1>
          <p className="subtitle">Registra y consulta tus entrenamientos</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {!showForm && (
          <button className="btn-nuevo-entrenamiento" onClick={() => setShowForm(true)}>
            + Nuevo Entrenamiento
          </button>
        )}

        {showForm && (
          <div className="card">
            <div className="form-header">
              <h2>Registrar Nuevo Entrenamiento</h2>
              <button className="btn-cancel-form" onClick={() => {
                setShowForm(false);
                setError("");
                resetFormulario();
              }}>
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="entrenamiento-form">
              <div className="form-group">
                <label>Fecha del entrenamiento: <span className="required">*</span></label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              <div className="ejercicios-section">
                <h3>Ejercicios</h3>
                
                {ejercicios.map((ejercicio, index) => (
                  <div key={index} className="ejercicio-card">
                    <div className="ejercicio-header">
                      <h4>Ejercicio {index + 1}</h4>
                      {ejercicios.length > 1 && (
                        <button
                          type="button"
                          className="btn-remove-ejercicio"
                          onClick={() => handleRemoveEjercicio(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>

                    <div className="ejercicio-fields">
                      <div className="form-group">
                        <label>Nombre: <span className="required">*</span></label>
                        <select
                          value={ejercicio.nombre}
                          onChange={(e) => handleEjercicioChange(index, 'nombre', e.target.value)}
                          required
                        >
                          <option value="">Selecciona un ejercicio...</option>
                          {EJERCICIOS_DISPONIBLES.map((nombre, idx) => (
                            <option key={idx} value={nombre}>{nombre}</option>
                          ))}
                        </select>
                      </div>

                      <div className="form-row-3">
                        <div className="form-group">
                          <label>Series: <span className="required">*</span></label>
                          <input
                            type="number"
                            value={ejercicio.series}
                            onChange={(e) => handleEjercicioChange(index, 'series', e.target.value)}
                            min="1"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Reps: <span className="required">*</span></label>
                          <input
                            type="number"
                            value={ejercicio.repeticiones}
                            onChange={(e) => handleEjercicioChange(index, 'repeticiones', e.target.value)}
                            min="1"
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Peso (kg): <span className="required">*</span></label>
                          <input
                            type="number"
                            value={ejercicio.peso}
                            onChange={(e) => handleEjercicioChange(index, 'peso', e.target.value)}
                            min="0"
                            step="0.5"
                            required
                          />
                        </div>
                      </div>

                      <div className="form-group">
                        <label>Valoración (1-10): <span className="required">*</span></label>
                        <input
                          type="number"
                          value={ejercicio.valoracion}
                          onChange={(e) => handleEjercicioChange(index, 'valoracion', e.target.value)}
                          min="1"
                          max="10"
                          required
                        />
                      </div>
                    </div>
                  </div>
                ))}

                <button type="button" className="btn-add-ejercicio" onClick={handleAddEjercicio}>
                  + Añadir Ejercicio
                </button>
              </div>

              <div className="volumen-total-preview">
                <strong>Volumen Total Estimado:</strong> {calcularVolumenTotal().toFixed(2)} kg
              </div>

              <button type="submit" className="btn-submit">
                Guardar Entrenamiento
              </button>
            </form>
          </div>
        )}

        {/* Lista de entrenamientos */}
        {!showForm && (
          <div className="entrenamientos-list">
            <h2>Historial de Entrenamientos</h2>
            
            {entrenamientos.length === 0 ? (
              <p className="no-data">Aún no has registrado ningún entrenamiento</p>
            ) : (
              <div className="entrenamientos-grid">
              {entrenamientos.map((entrenamiento) => (
                <div 
                  key={entrenamiento.id} 
                  className="entrenamiento-card"
                  onClick={() => handleViewEntrenamiento(entrenamiento)}
                >
                  <button
                    className="btn-delete-card"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteClick(entrenamiento.id);
                    }}
                    title="Eliminar entrenamiento"
                  >
                    🗑️
                  </button>
                  
                  <h3 className="card-titulo">
                    {new Date(entrenamiento.fecha).toLocaleDateString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </h3>
                  
                  <div className="card-stats">
                    <div className="stat-item">
                      <span className="stat-icon">💪</span>
                      <span className="stat-text">{entrenamiento.cantidadEjercicios} ejercicios</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-icon">⚡</span>
                      <span className="stat-text">{entrenamiento.volumenTotal.toFixed(0)} kg</span>
                    </div>
                  </div>
                  
                  <div className="card-ejercicios">
                    {entrenamiento.ejercicios.slice(0, 3).map((ej, idx) => (
                      <span key={idx} className="ejercicio-tag">
                        {ej.nombre}
                      </span>
                    ))}
                    {entrenamiento.ejercicios.length > 3 && (
                      <span className="ejercicio-tag mas">+{entrenamiento.ejercicios.length - 3}</span>
                    )}
                  </div>
                  
                  <div className="card-footer">
                    <span className="ver-detalles">👁️ Ver detalles</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        )}

        {/* Modal de detalle del entrenamiento */}
        {selectedEntrenamiento && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Resumen del Entrenamiento</h2>
                <button className="btn-close-modal" onClick={handleCloseModal}>
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-fecha">
                  <strong>Fecha:</strong> {new Date(selectedEntrenamiento.fecha).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>

                <div className="modal-stats-summary">
                  <div className="stat-box">
                    <div className="stat-label">Ejercicios</div>
                    <div className="stat-value">{selectedEntrenamiento.cantidadEjercicios}</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Volumen Total</div>
                    <div className="stat-value">{selectedEntrenamiento.volumenTotal.toFixed(0)} kg</div>
                  </div>
                  <div className="stat-box">
                    <div className="stat-label">Valoración Media</div>
                    <div className="stat-value">
                      {(selectedEntrenamiento.ejercicios.reduce((sum, ej) => sum + ej.valoracion, 0) / selectedEntrenamiento.cantidadEjercicios).toFixed(1)}/10
                    </div>
                  </div>
                </div>

                <div className="modal-ejercicios">
                  <h3>Ejercicios Realizados</h3>
                  {selectedEntrenamiento.ejercicios.map((ejercicio, idx) => (
                    <div key={idx} className="modal-ejercicio-card">
                      <div className="modal-ejercicio-header">
                        <h4>{ejercicio.nombre}</h4>
                        <span className="valoracion-badge">
                          ⭐ {ejercicio.valoracion}/10
                        </span>
                      </div>
                      <div className="modal-ejercicio-datos">
                        <div className="dato-item">
                          <span className="dato-label">Series:</span>
                          <span className="dato-valor">{ejercicio.series}</span>
                        </div>
                        <div className="dato-item">
                          <span className="dato-label">Repeticiones:</span>
                          <span className="dato-valor">{ejercicio.repeticiones}</span>
                        </div>
                        <div className="dato-item">
                          <span className="dato-label">Peso:</span>
                          <span className="dato-valor">{ejercicio.peso} kg</span>
                        </div>
                        <div className="dato-item">
                          <span className="dato-label">Volumen:</span>
                          <span className="dato-valor destacado">
                            {calcularVolumenEjercicio(ejercicio).toFixed(0)} kg
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ModalConfirmacion
              open={showDeleteModal}
              onClose={() => {
                setShowDeleteModal(false);
                setRecordToDelete(null);
              }}
              onConfirm={confirmDeleteRecord}
              titulo="Eliminar registro"
              mensaje="¿Seguro que quieres eliminar este registro? Esta acción no se puede deshacer."
              textoBotonEliminar="Eliminar"
              textoBotonCancelar="Cancelar"
      />
    </>
  );
}
