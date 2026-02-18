import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerWodCrossFit, getWodsCrossFit, deleteWodCrossFit } from "../api/api";
import Navbar from "../components/Navbar";
import "./WodsCrossFit.css";

// Definición de WODs con sus niveles
const WODS_CROSSFIT = {
  "Fran": {
    nombre: "Fran",
    descripcion: "21-15-9 Thrusters + Pull-ups (For Time)",
    niveles: {
      rx: { thruster: 43, descripcion: "RX: 43kg Thrusters" },
      intermedio: { thruster: 30, descripcion: "Intermedio: 30kg Thrusters" },
      escalado: { thruster: 20, descripcion: "Escalado: 20kg Thrusters" }
    }
  },
  "Isabel": {
    nombre: "Isabel",
    descripcion: "30 Snatches For Time",
    niveles: {
      rx: { snatch: 61, descripcion: "RX: 61kg Snatches" },
      intermedio: { snatch: 43, descripcion: "Intermedio: 43kg Snatches" },
      escalado: { snatch: 30, descripcion: "Escalado: 30kg Snatches" }
    }
  },
  "Grace": {
    nombre: "Grace",
    descripcion: "30 Clean and Jerks For Time",
    niveles: {
      rx: { clean: 61, descripcion: "RX: 61kg Clean and Jerks" },
      intermedio: { clean: 43, descripcion: "Intermedio: 43kg Clean and Jerks" },
      escalado: { clean: 30, descripcion: "Escalado: 30kg Clean and Jerks" }
    }
  },
  "Randy": {
    nombre: "Randy",
    descripcion: "75 Snatches For Time",
    niveles: {
      rx: { snatch: 34, descripcion: "RX: 34kg Snatches" },
      intermedio: { snatch: 25, descripcion: "Intermedio: 25kg Snatches" },
      escalado: { snatch: 15, descripcion: "Escalado: 15kg Snatches" }
    }
  },
  "Diane": {
    nombre: "Diane",
    descripcion: "21-15-9 Deadlifts (102kg/70kg/50kg) + HSPU (For Time)",
    niveles: {
      rx: { deadlift: 102, descripcion: "RX: 102kg Deadlifts" },
      intermedio: { deadlift: 70, descripcion: "Intermedio: 70kg Deadlifts" },
      escalado: { deadlift: 50, descripcion: "Escalado: 50kg Deadlifts" }
    }
  },
  "Elizabeth": {
    nombre: "Elizabeth",
    descripcion: "21-15-9 Cleans + Ring Dips (For Time)",
    niveles: {
      rx: { clean: 61, descripcion: "RX: 61kg Cleans" },
      intermedio: { clean: 43, descripcion: "Intermedio: 43kg Cleans" },
      escalado: { clean: 30, descripcion: "Escalado: 30kg Cleans" }
    }
  },
  "Linda": {
    nombre: "Linda",
    descripcion: "10-9-8-7-6-5-4-3-2-1 Deadlift + Bench Press + Clean (For Time)",
    niveles: {
      rx: { deadlift: 68, bench: 45, clean: 68, descripcion: "RX: 68kg DL / 45kg BP / 68kg Clean" },
      intermedio: { deadlift: 50, bench: 35, clean: 50, descripcion: "Intermedio: 50kg DL / 35kg BP / 50kg Clean" },
      escalado: { deadlift: 40, bench: 25, clean: 40, descripcion: "Escalado: 40kg DL / 25kg BP / 40kg Clean" }
    }
  },
  "King Kong": {
    nombre: "King Kong",
    descripcion: "3 rounds: 1 Deadlift + 2 Muscle-ups + 3 Squat Cleans + 4 HSPU",
    niveles: {
      rx: { deadlift: 205, clean: 111, descripcion: "RX: 205kg DL / 111kg Squat Cleans" },
      intermedio: { deadlift: 150, clean: 80, descripcion: "Intermedio: 150kg DL / 80kg Squat Cleans" },
      escalado: { deadlift: 100, clean: 60, descripcion: "Escalado: 100kg DL / 60kg Squat Cleans" }
    }
  },
  "DT": {
    nombre: "DT",
    descripcion: "5 rounds: 12 Deadlifts + 9 Hang Power Cleans + 6 Push Jerks",
    niveles: {
      rx: { peso: 70, descripcion: "RX: 70kg en todos los movimientos" },
      intermedio: { peso: 52, descripcion: "Intermedio: 52kg en todos los movimientos" },
      escalado: { peso: 43, descripcion: "Escalado: 43kg en todos los movimientos" }
    }
  },
  "Bear Complex": {
    nombre: "Bear Complex",
    descripcion: "7 sets: 1 Power Clean + 1 Front Squat + 1 Push Press + 1 Back Squat + 1 Push Press",
    niveles: {
      rx: { peso: 61, descripcion: "RX: 61kg sin soltar la barra" },
      intermedio: { peso: 43, descripcion: "Intermedio: 43kg sin soltar la barra" },
      escalado: { peso: 30, descripcion: "Escalado: 30kg sin soltar la barra" }
    }
  }
};

export default function WodsCrossFit() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [wods, setWods] = useState([]);
  const [showForm, setShowForm] = useState(false);
  
  const [wodSeleccionado, setWodSeleccionado] = useState("");
  const [nivelSeleccionado, setNivelSeleccionado] = useState("");
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    minutos: "",
    segundos: "",
    notas: ""
  });

  useEffect(() => {
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!loggedUser || !loggedUser.username) {
      navigate("/login");
      return;
    }

    setUsername(loggedUser.username);
    loadWods(loggedUser.username);
  }, [navigate]);

  const loadWods = async (user) => {
    try {
      const response = await getWodsCrossFit(user);
      setWods(response.wods || []);
    } catch (err) {
      console.error("Error al cargar WODs:", err);
    }
  };

  const resetFormulario = () => {
    setFormData({ 
      fecha: new Date().toISOString().split('T')[0],
      minutos: "",
      segundos: "",
      notas: ""
    });
    setWodSeleccionado("");
    setNivelSeleccionado("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validaciones
    if (!wodSeleccionado) {
      setError("Debes seleccionar un WOD");
      return;
    }

    if (!nivelSeleccionado) {
      setError("Debes seleccionar un nivel (RX, Intermedio o Escalado)");
      return;
    }

    const minutos = parseInt(formData.minutos) || 0;
    const segundos = parseInt(formData.segundos) || 0;

    if (minutos === 0 && segundos === 0) {
      setError("Debes indicar el tiempo que tardaste");
      return;
    }

    const tiempoTotal = (minutos * 60) + segundos;

    try {
      await registerWodCrossFit({
        username: username,
        nombreWod: wodSeleccionado,
        nivel: nivelSeleccionado,
        tiempo: tiempoTotal,
        fecha: formData.fecha,
        notas: formData.notas
      });

      setSuccessMessage("WOD registrado con éxito");
      resetFormulario();
      setShowForm(false);
      await loadWods(username);

    } catch (err) {
      setError(err.message || "Error al registrar el WOD");
    }
  };

  const handleDeleteWod = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este WOD?")) {
      return;
    }

    try {
      await deleteWodCrossFit(id);
      setSuccessMessage("WOD eliminado con éxito");
      await loadWods(username);
    } catch (err) {
      setError("Error al eliminar el WOD");
    }
  };

  const formatearTiempo = (segundosTotales) => {
    const minutos = Math.floor(segundosTotales / 60);
    const segundos = segundosTotales % 60;
    return `${minutos}:${segundos.toString().padStart(2, '0')}`;
  };

  const getNivelBadgeClass = (nivel) => {
    switch(nivel) {
      case 'rx': return 'nivel-rx';
      case 'intermedio': return 'nivel-intermedio';
      case 'escalado': return 'nivel-escalado';
      default: return '';
    }
  };

  const getNivelLabel = (nivel) => {
    switch(nivel) {
      case 'rx': return 'RX';
      case 'intermedio': return 'Intermedio';
      case 'escalado': return 'Escalado';
      default: return nivel;
    }
  };

  return (
    <>
      <Navbar />
      <div className="wods-container">
        <div className="wods-header">
          <h1>WODs de CrossFit</h1>
          <p className="subtitle">Registra tus tiempos en los WODs clásicos de CrossFit</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        {!showForm && (
          <button className="btn-nuevo-wod" onClick={() => setShowForm(true)}>
            + Registrar WOD
          </button>
        )}

        {showForm && (
          <div className="card">
            <div className="form-header">
              <h2>Registrar WOD de CrossFit</h2>
              <button className="btn-cancel-form" onClick={() => {
                setShowForm(false);
                setError("");
                resetFormulario();
              }}>
                Cancelar
              </button>
            </div>

            <form onSubmit={handleSubmit} className="wod-form">
              {/* Selector de WOD */}
              <div className="form-group">
                <label>Selecciona el WOD: <span className="required">*</span></label>
                <select
                  value={wodSeleccionado}
                  onChange={(e) => {
                    setWodSeleccionado(e.target.value);
                    setNivelSeleccionado("");
                  }}
                  required
                >
                  <option value="">Selecciona un WOD...</option>
                  {Object.keys(WODS_CROSSFIT).map((wodKey) => (
                    <option key={wodKey} value={wodKey}>
                      {WODS_CROSSFIT[wodKey].nombre}
                    </option>
                  ))}
                </select>
                {wodSeleccionado && WODS_CROSSFIT[wodSeleccionado] && (
                  <p className="wod-descripcion">
                    {WODS_CROSSFIT[wodSeleccionado].descripcion}
                  </p>
                )}
              </div>

              {/* Selector de Nivel */}
              {wodSeleccionado && (
                <div className="form-group">
                  <label>Selecciona el nivel: <span className="required">*</span></label>
                  <div className="niveles-grid">
                    {['rx', 'intermedio', 'escalado'].map((nivel) => (
                      <label 
                        key={nivel} 
                        className={`nivel-card ${nivelSeleccionado === nivel ? 'selected' : ''} ${getNivelBadgeClass(nivel)}`}
                      >
                        <input
                          type="radio"
                          name="nivel"
                          value={nivel}
                          checked={nivelSeleccionado === nivel}
                          onChange={(e) => setNivelSeleccionado(e.target.value)}
                          required
                        />
                        <div className="nivel-content">
                          <h3>{getNivelLabel(nivel)}</h3>
                          <p>{WODS_CROSSFIT[wodSeleccionado].niveles[nivel].descripcion}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Fecha: <span className="required">*</span></label>
                <input
                  type="date"
                  value={formData.fecha}
                  onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                  max={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Tiempo */}
              <div className="form-group">
                <label>Tiempo: <span className="required">*</span></label>
                <div className="tiempo-inputs">
                  <div className="tiempo-field">
                    <input
                      type="number"
                      value={formData.minutos}
                      onChange={(e) => setFormData({ ...formData, minutos: e.target.value })}
                      min="0"
                      placeholder="0"
                    />
                    <span>minutos</span>
                  </div>
                  <div className="tiempo-field">
                    <input
                      type="number"
                      value={formData.segundos}
                      onChange={(e) => setFormData({ ...formData, segundos: e.target.value })}
                      min="0"
                      max="59"
                      placeholder="0"
                    />
                    <span>segundos</span>
                  </div>
                </div>
              </div>

              {/* Notas opcionales */}
              <div className="form-group">
                <label>Notas (opcional):</label>
                <textarea
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  placeholder="Cómo te sentiste, modificaciones realizadas, etc."
                  rows="3"
                  maxLength="500"
                />
              </div>

              <button type="submit" className="btn-submit">
                Guardar WOD
              </button>
            </form>
          </div>
        )}

        {/* Historial de WODs */}
        {!showForm && (
        <div className="wods-list">
          <h2>Historial de WODs</h2>
          
          {wods.length === 0 ? (
            <p className="no-data">Aún no has registrado ningún WOD</p>
          ) : (
            <div className="wods-grid">
              {wods.map((wod) => (
                <div key={wod.id} className="wod-item">
                  <div className="wod-header-item">
                    <h3>{wod.nombreWod}</h3>
                    <span className={`nivel-badge ${getNivelBadgeClass(wod.nivel)}`}>
                      {getNivelLabel(wod.nivel)}
                    </span>
                  </div>
                  <div className="wod-info">
                    <div className="wod-tiempo">
                      <span className="tiempo-label">Tiempo:</span>
                      <span className="tiempo-valor">{formatearTiempo(wod.tiempo)}</span>
                    </div>
                    <div className="wod-fecha">
                      {new Date(wod.fecha).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </div>
                    {wod.notas && (
                      <div className="wod-notas">
                        <strong>Notas:</strong> {wod.notas}
                      </div>
                    )}
                  </div>
                  <button
                    className="btn-delete"
                    onClick={() => handleDeleteWod(wod.id)}
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        )}
      </div>
    </>
  );
}
