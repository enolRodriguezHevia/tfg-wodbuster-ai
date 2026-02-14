import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { analizarSentadillaVideo, analizarPesoMuertoVideo } from "../utils/videoAnalysis";
import "./AnalisisVideos.css";

export default function AnalisisVideos() {
  const navigate = useNavigate();
  const [tabActiva, setTabActiva] = useState("analizar"); // analizar, historial, estadisticas
  const [ejercicios, setEjercicios] = useState([]);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [estadisticas, setEstadisticas] = useState(null);
  const [loadingHistorial, setLoadingHistorial] = useState(false);
  const [loadingEstadisticas, setLoadingEstadisticas] = useState(false);

  useEffect(() => {
    // Verificar autenticación
    const user = localStorage.getItem("user");
    if (!user) {
      navigate("/login");
      return;
    }

    // Cargar ejercicios disponibles para análisis
    cargarEjercicios();
  }, [navigate]);

  useEffect(() => {
    if (tabActiva === "historial") {
      cargarHistorial();
    } else if (tabActiva === "estadisticas") {
      cargarEstadisticas();
    }
  }, [tabActiva]);

  const cargarEjercicios = async () => {
    try {
      const ejerciciosDisponibles = [
        { id: "sentadilla", nombre: "Sentadilla (Squat)" },
        { id: "press-hombros", nombre: "Press de Hombros" },
        { id: "peso-muerto", nombre: "Peso Muerto (Deadlift)" },
        { id: "flexiones", nombre: "Flexiones (Push-ups)" },
        { id: "dominadas", nombre: "Dominadas (Pull-ups)" }
      ];
      setEjercicios(ejerciciosDisponibles);
    } catch (err) {
      console.error("Error al cargar ejercicios:", err);
      setError("Error al cargar la lista de ejercicios");
    }
  };

  const cargarHistorial = async () => {
    setLoadingHistorial(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch("http://localhost:3000/api/analisis-video/historial?limite=20", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) throw new Error("Error al cargar historial");

      const data = await response.json();
      setHistorial(data.analisis);
    } catch (err) {
      console.error("Error al cargar historial:", err);
      setError("Error al cargar el historial");
    } finally {
      setLoadingHistorial(false);
    }
  };

  const cargarEstadisticas = async () => {
    setLoadingEstadisticas(true);
    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch("http://localhost:3000/api/analisis-video/estadisticas", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) throw new Error("Error al cargar estadísticas");

      const data = await response.json();
      setEstadisticas(data);
    } catch (err) {
      console.error("Error al cargar estadísticas:", err);
      setError("Error al cargar estadísticas");
    } finally {
      setLoadingEstadisticas(false);
    }
  };

  const eliminarAnalisis = async (id) => {
    if (!window.confirm("¿Estás seguro de que quieres eliminar este análisis?")) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem("user"));
      const response = await fetch(`http://localhost:3000/api/analisis-video/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!response.ok) throw new Error("Error al eliminar análisis");

      // Recargar historial
      cargarHistorial();
      setError("");
    } catch (err) {
      console.error("Error al eliminar:", err);
      setError("Error al eliminar el análisis");
    }
  };

  const handleEjercicioChange = (e) => {
    setEjercicioSeleccionado(e.target.value);
    setError("");
    setResultado(null);
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      // Validar formato de video
      const validFormats = ["video/mp4", "video/webm"];
      if (!validFormats.includes(file.type)) {
        setError("Formato de video no compatible. Por favor, sube un archivo MP4 o WebM.");
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }

      // Validar tamaño (máximo 100MB)
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        setError("El video es demasiado grande. Tamaño máximo: 100MB");
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }

      setVideoFile(file);
      setVideoPreview(URL.createObjectURL(file));
      setError("");
      setResultado(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setResultado(null);

    // Validaciones
    if (!ejercicioSeleccionado) {
      setError("Por favor, selecciona un ejercicio");
      return;
    }

    if (!videoFile) {
      setError("Por favor, sube un video");
      return;
    }

    setIsAnalyzing(true);

    try {
      // Analizar video con MediaPipe en el frontend
      let resultadoAnalisis;
      
      if (ejercicioSeleccionado === "sentadilla") {
        setError("Analizando video con IA... Esto puede tardar 30-60 segundos.");
        resultadoAnalisis = await analizarSentadillaVideo(videoFile);
      } else if (ejercicioSeleccionado === "peso-muerto") {
        setError("Analizando video de peso muerto con IA... Esto puede tardar 30-60 segundos.");
        resultadoAnalisis = await analizarPesoMuertoVideo(videoFile);
      } else {
        setError("Por ahora solo están disponibles los análisis de sentadilla y peso muerto");
        setIsAnalyzing(false);
        return;
      }

      // Enviar resultado al backend para guardar
      const formData = new FormData();
      formData.append("ejercicio", ejercicioSeleccionado);
      formData.append("video", videoFile);
      formData.append("analisisResultado", JSON.stringify(resultadoAnalisis));

      const user = JSON.parse(localStorage.getItem("user"));
      const token = user.token;

      const response = await fetch("http://localhost:3000/api/analisis-video/analizar", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Error al guardar el análisis");
      }

      setResultado(resultadoAnalisis);
      setError("");
      
    } catch (err) {
      console.error("Error al analizar video:", err);
      setError(err.message || "Error al procesar el video. Por favor, inténtalo de nuevo.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleReset = () => {
    setEjercicioSeleccionado("");
    setVideoFile(null);
    setVideoPreview(null);
    setError("");
    setResultado(null);
  };

  return (
    <>
      <Navbar />
      <div className="analisis-videos-container">
        <h1 className="page-title">Análisis de Técnica con IA</h1>
        <p className="page-subtitle">
          Sube un video de tu ejercicio y recibe feedback personalizado sobre tu técnica
        </p>

        {/* Pestañas */}
        <div className="tabs-container">
          <button
            className={`tab ${tabActiva === "analizar" ? "active" : ""}`}
            onClick={() => setTabActiva("analizar")}
          >
            📹 Analizar Video
          </button>
          <button
            className={`tab ${tabActiva === "historial" ? "active" : ""}`}
            onClick={() => setTabActiva("historial")}
          >
            📊 Historial
          </button>
          <button
            className={`tab ${tabActiva === "estadisticas" ? "active" : ""}`}
            onClick={() => setTabActiva("estadisticas")}
          >
            📈 Estadísticas
          </button>
        </div>

        <div className="analisis-content">
          {/* Tab: Analizar Video */}
          {tabActiva === "analizar" && (
            <>
              <form onSubmit={handleSubmit} className="analisis-form">
                {/* Selección de ejercicio */}
                <div className="form-section">
                  <h2 className="section-title">1. Selecciona el ejercicio</h2>
                  <select
                    value={ejercicioSeleccionado}
                    onChange={handleEjercicioChange}
                    className="ejercicio-select"
                    disabled={isAnalyzing}
                  >
                    <option value="">-- Selecciona un ejercicio --</option>
                    {ejercicios.map((ejercicio) => (
                      <option key={ejercicio.id} value={ejercicio.id}>
                        {ejercicio.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Subida de video */}
                <div className="form-section">
                  <h2 className="section-title">2. Sube tu video</h2>
                  <p className="section-info">
                    Formatos aceptados: MP4, WebM | Tamaño máximo: 100MB
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm"
                    onChange={handleVideoChange}
                    className="video-input"
                    disabled={isAnalyzing}
                  />
                  
                  {videoPreview && (
                    <div className="video-preview">
                      <video controls width="100%">
                        <source src={videoPreview} type={videoFile.type} />
                        Tu navegador no soporta la reproducción de videos.
                      </video>
                    </div>
                  )}
                </div>

                {/* Mensajes de error */}
                {error && (
                  <div className="error-message">
                    ⚠️ {error}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-analizar"
                    disabled={isAnalyzing || !ejercicioSeleccionado || !videoFile}
                  >
                    {isAnalyzing ? "Analizando..." : "Analizar Video"}
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleReset}
                    className="btn-reset"
                    disabled={isAnalyzing}
                  >
                    Limpiar
                  </button>
                </div>
              </form>

              {/* Resultados del análisis */}
              {resultado && (
                <div className="resultado-container">
                  <h2 className="resultado-title">Resultados del Análisis</h2>
                  
                  <div className={`calificacion ${resultado.esCorrecta ? 'correcta' : 'incorrecta'}`}>
                    <span className="calificacion-icon">
                      {resultado.esCorrecta ? "✓" : "✗"}
                    </span>
                    <span className="calificacion-texto">
                      Técnica {resultado.esCorrecta ? "Correcta" : "Incorrecta"}
                    </span>
                  </div>

                  {resultado.feedback && (
                    <div className="feedback-section">
                      <h3>Recomendaciones</h3>
                      <ul className="feedback-list">
                        {resultado.feedback.map((item, index) => (
                          <li key={index}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {resultado.angulos && (
                    <div className="angulos-section">
                      <h3>Análisis de Ángulos</h3>
                      <div className="angulos-grid">
                        {resultado.angulos.rodilla && (
                          <div className="angulo-item">
                            <span className="angulo-nombre">Ángulo rodilla:</span>
                            <span className="angulo-valor">{resultado.angulos.rodilla.toFixed(1)}°</span>
                          </div>
                        )}
                        {resultado.angulos.torso && (
                          <div className="angulo-item">
                            <span className="angulo-nombre">Inclinación torso:</span>
                            <span className="angulo-valor">{resultado.angulos.torso.toFixed(1)}°</span>
                          </div>
                        )}
                        {resultado.rompioParalelo !== undefined && (
                          <div className="angulo-item">
                            <span className="angulo-nombre">Profundidad:</span>
                            <span className="angulo-valor">
                              {resultado.rompioParalelo ? '✓ Paralelo roto' : '✗ No rompió paralelo'}
                            </span>
                          </div>
                        )}
                        {/* Compatibilidad con análisis antiguos */}
                        {resultado.angulos.cadera && !resultado.angulos.torso && (
                          <div className="angulo-item">
                            <span className="angulo-nombre">Cadera:</span>
                            <span className="angulo-valor">{resultado.angulos.cadera.toFixed(1)}°</span>
                          </div>
                        )}
                        {resultado.angulos.espalda && !resultado.angulos.torso && (
                          <div className="angulo-item">
                            <span className="angulo-nombre">Espalda:</span>
                            <span className="angulo-valor">{resultado.angulos.espalda.toFixed(1)}°</span>
                          </div>
                        )}
                        {resultado.angulos.alineacion && !resultado.angulos.torso && (
                          <div className="angulo-item">
                            <span className="angulo-nombre">Alineación:</span>
                            <span className="angulo-valor">{resultado.angulos.alineacion.toFixed(1)}°</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visualización de Pose detectada - Sentadilla */}
                  {resultado.imagenVisualizada && (
                    <div className="visualizacion-section">
                      <h3>Detección de Pose (Punto más bajo)</h3>
                      <div className="videos-comparison">
                        {videoPreview && (
                          <div className="video-column">
                            <h4>Video Original</h4>
                            <video controls width="100%">
                              <source src={videoPreview} type={videoFile.type} />
                            </video>
                          </div>
                        )}
                        <div className="video-column">
                          <h4>Detección de Puntos</h4>
                          <img 
                            src={resultado.imagenVisualizada} 
                            alt="Pose detectada" 
                            style={{width: '100%', borderRadius: '8px'}}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Visualización de Pose detectada - Peso Muerto */}
                  {resultado.imagenInicio && resultado.imagenLockout && (
                    <div className="visualizacion-section">
                      <h3>Detección de Pose - Frames Clave</h3>
                      <div className="videos-comparison">
                        <div className="video-column">
                          <h4>Inicio (Cadera más baja)</h4>
                          <img 
                            src={resultado.imagenInicio} 
                            alt="Frame de inicio" 
                            style={{width: '100%', borderRadius: '8px'}}
                          />
                          {resultado.detallesPrimeraRep && (
                            <div className="frame-info">
                              <p>⏱️ Tiempo: {resultado.detallesPrimeraRep.inicio.tiempo}s</p>
                              <p>📐 Rodilla: {resultado.detallesPrimeraRep.inicio.anguloRodilla}°</p>
                              <p>📏 Torso: {resultado.detallesPrimeraRep.inicio.anguloTorso}°</p>
                            </div>
                          )}
                        </div>
                        <div className="video-column">
                          <h4>Lockout (Cadera más alta)</h4>
                          <img 
                            src={resultado.imagenLockout} 
                            alt="Frame de lockout" 
                            style={{width: '100%', borderRadius: '8px'}}
                          />
                          {resultado.detallesPrimeraRep && (
                            <div className="frame-info">
                              <p>⏱️ Tiempo: {resultado.detallesPrimeraRep.lockout.tiempo}s</p>
                              <p>📐 Rodilla: {resultado.detallesPrimeraRep.lockout.anguloRodilla}°</p>
                              <p>📏 Torso: {resultado.detallesPrimeraRep.lockout.anguloTorso}°</p>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Información de todas las repeticiones */}
                      {resultado.repeticiones && resultado.repeticiones.length > 1 && (
                        <div className="repeticiones-info">
                          <h4>📊 Todas las repeticiones detectadas ({resultado.repeticiones.length})</h4>
                          <div className="repeticiones-grid">
                            {resultado.repeticiones.map((rep, index) => (
                              <div key={index} className="repeticion-item">
                                <strong>Rep {rep.numero}</strong>
                                <p>⏱️ {rep.tiempoInicio}s → {rep.tiempoLockout}s ({rep.duracion}s)</p>
                                <p>📐 Rodilla: {rep.anguloRodillaInicio}° → {rep.anguloRodillaLockout}°</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Indicador de carga */}
              {isAnalyzing && (
                <div className="loading-overlay">
                  <div className="loading-spinner"></div>
                  <p>Analizando tu técnica...</p>
                  <p className="loading-subtitle">Esto puede tardar unos segundos</p>
                </div>
              )}
            </>
          )}

          {/* Tab: Historial */}
          {tabActiva === "historial" && (
            <div className="historial-container">
              {loadingHistorial ? (
                <div className="loading-message">Cargando historial...</div>
              ) : historial.length === 0 ? (
                <div className="empty-message">
                  <p>No tienes análisis previos</p>
                  <button onClick={() => setTabActiva("analizar")} className="btn-volver">
                    Analizar mi primer video
                  </button>
                </div>
              ) : (
                <div className="historial-lista">
                  {historial.map((item) => (
                    <div key={item._id} className="historial-item">
                      <div className="historial-header">
                        <div>
                          <h3>{ejercicios.find(e => e.id === item.ejercicio)?.nombre || item.ejercicio}</h3>
                        </div>
                        <div className="historial-badges">
                          <span className={`badge ${item.esCorrecta ? "correcta" : "incorrecta"}`}>
                            {item.esCorrecta ? "✓ Correcta" : "✗ Incorrecta"}
                          </span>
                          <button 
                            className="btn-eliminar-historial"
                            onClick={() => eliminarAnalisis(item._id)}
                            title="Eliminar análisis"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>
                      <div className="historial-info">
                        <p>📅 {new Date(item.fechaAnalisis).toLocaleDateString("es-ES")}</p>
                        {item.repeticionesDetectadas && (
                          <p>🔁 {item.repeticionesDetectadas} repeticiones</p>
                        )}
                      </div>
                      {item.feedback && item.feedback.length > 0 && (
                        <div className="historial-feedback">
                          <strong>Recomendaciones:</strong>
                          <ul>
                            {item.feedback.slice(0, 2).map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab: Estadísticas */}
          {tabActiva === "estadisticas" && (
            <div className="estadisticas-container">
              {loadingEstadisticas ? (
                <div className="loading-message">Cargando estadísticas...</div>
              ) : !estadisticas || estadisticas.general.total === 0 ? (
                <div className="empty-message">
                  <p>No hay estadísticas disponibles</p>
                  <button onClick={() => setTabActiva("analizar")} className="btn-volver">
                    Analizar mi primer video
                  </button>
                </div>
              ) : (
                <>
                  <div className="estadisticas-general">
                    <h2>Estadísticas Generales</h2>
                    <div className="stats-grid">
                      <div className="stat-card">
                        <div className="stat-value">{estadisticas.general.total}</div>
                        <div className="stat-label">Videos Analizados</div>
                      </div>
                      <div className="stat-card correcta">
                        <div className="stat-value">{estadisticas.general.correctos}</div>
                        <div className="stat-label">Técnica Correcta</div>
                      </div>
                      <div className="stat-card incorrecta">
                        <div className="stat-value">{estadisticas.general.incorrectos}</div>
                        <div className="stat-label">Técnica Incorrecta</div>
                      </div>
                      <div className="stat-card">
                        <div className="stat-value">{estadisticas.general.porcentajeCorrectos}%</div>
                        <div className="stat-label">Tasa de Éxito</div>
                      </div>
                    </div>
                  </div>

                  <div className="estadisticas-ejercicios">
                    <h2>Por Ejercicio</h2>
                    <div className="ejercicios-stats-grid">
                      {estadisticas.porEjercicio.map((item) => (
                        <div key={item.ejercicio} className="ejercicio-stat-card">
                          <h3>{ejercicios.find(e => e.id === item.ejercicio)?.nombre || item.ejercicio}</h3>
                          <div className="ejercicio-stats">
                            <div className="stat-row">
                              <span>Total:</span>
                              <strong>{item.totalAnalisis}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Correctos:</span>
                              <strong className="text-success">{item.correctos}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Incorrectos:</span>
                              <strong className="text-danger">{item.incorrectos}</strong>
                            </div>
                            <div className="stat-row">
                              <span>Éxito:</span>
                              <strong>{item.porcentajeCorrectos.toFixed(1)}%</strong>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
