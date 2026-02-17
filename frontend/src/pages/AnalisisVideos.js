import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { analizarSentadillaVideo, analizarPesoMuertoVideo, analizarPressHombroVideo, analizarRemoBarraVideo } from "../utils/videoAnalysis";
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
  const [loadingHistorial, setLoadingHistorial] = useState(false);

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
    }
  }, [tabActiva]);

  const cargarEjercicios = async () => {
    try {
      const ejerciciosDisponibles = [
        { id: "sentadilla", nombre: "Sentadilla (Squat)" },
        { id: "press-hombros", nombre: "Press de Hombros" },
        { id: "peso-muerto", nombre: "Peso Muerto (Deadlift)" },
        { id: "remo-barra", nombre: "Remo con Barra Inclinado" },
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
      } else if (ejercicioSeleccionado === "press-hombros") {
        setError("Analizando video de press de hombros con IA... Esto puede tardar 30-60 segundos.");
        resultadoAnalisis = await analizarPressHombroVideo(videoFile);
      } else if (ejercicioSeleccionado === "remo-barra") {
        setError("Analizando video de remo con barra con IA... Esto puede tardar 30-60 segundos.");
        resultadoAnalisis = await analizarRemoBarraVideo(videoFile);
      } else {
        setError("Por ahora solo están disponibles los análisis de sentadilla, peso muerto, press de hombros y remo con barra");
        setIsAnalyzing(false);
        return;
      }

      // Enviar resultado al backend para guardar y generar feedback con IA
      const formData = new FormData();
      formData.append("ejercicio", ejercicioSeleccionado);
      formData.append("video", videoFile);
      formData.append("analisisResultado", JSON.stringify(resultadoAnalisis));
      
      // Agregar datos para el LLM (si están disponibles)
      if (resultadoAnalisis.framesCompletos) {
        formData.append("frames", JSON.stringify(resultadoAnalisis.framesCompletos));
      }
      if (resultadoAnalisis.framesClave) {
        formData.append("framesClave", JSON.stringify(resultadoAnalisis.framesClave));
      }
      if (resultadoAnalisis.metricas) {
        formData.append("metricas", JSON.stringify(resultadoAnalisis.metricas));
      }

      const user = JSON.parse(localStorage.getItem("user"));
      const token = user.token;

      setError("Generando feedback con IA...");

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

      // Si el backend devolvió feedback de IA, usarlo
      if (data.usaIA && data.feedback) {
        console.log(`✅ Feedback generado con IA (${data.tokensUsados} tokens)`);
        resultadoAnalisis.feedback = data.feedback;
        resultadoAnalisis.esCorrecta = data.esCorrecta;
        resultadoAnalisis.usaIA = true;
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
                      {resultado.usaIA && (
                        <div style={{fontSize: '0.85em', color: '#666', marginBottom: '10px'}}>
                          🤖 Análisis generado con IA
                        </div>
                      )}
                      <h3>Análisis de Técnica</h3>
                      
                      {/* Feedback narrativo de fisioterapeuta */}
                      {typeof resultado.feedback === 'string' ? (
                        <div className="feedback-narrative" style={{
                          whiteSpace: 'pre-wrap',
                          lineHeight: '1.8',
                          padding: '20px',
                          background: '#f8f9fa',
                          borderRadius: '8px',
                          fontSize: '1em'
                        }}>
                          {resultado.feedback}
                        </div>
                      ) : typeof resultado.feedback === 'object' && !Array.isArray(resultado.feedback) ? (
                        /* Feedback estructurado JSON (legacy) */
                        <>
                          {resultado.feedback.resumen && (
                            <div className="feedback-resumen" style={{marginBottom: '20px', padding: '15px', background: '#f0f8ff', borderRadius: '8px'}}>
                              <strong>Resumen:</strong> {resultado.feedback.resumen}
                            </div>
                          )}
                          
                          {resultado.feedback.aspectosPositivos && resultado.feedback.aspectosPositivos.length > 0 && (
                            <div className="feedback-subsection" style={{marginBottom: '15px'}}>
                              <h4 style={{color: '#28a745'}}>✅ Aspectos Positivos</h4>
                              <ul className="feedback-list">
                                {resultado.feedback.aspectosPositivos.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {resultado.feedback.areasDeRiesgo && resultado.feedback.areasDeRiesgo.length > 0 && (
                            <div className="feedback-subsection" style={{marginBottom: '15px'}}>
                              <h4 style={{color: '#dc3545'}}>⚠️ Áreas de Riesgo</h4>
                              <ul className="feedback-list">
                                {resultado.feedback.areasDeRiesgo.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {resultado.feedback.correcciones && resultado.feedback.correcciones.length > 0 && (
                            <div className="feedback-subsection" style={{marginBottom: '15px'}}>
                              <h4 style={{color: '#ffc107'}}>🔧 Correcciones</h4>
                              <ul className="feedback-list">
                                {resultado.feedback.correcciones.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                          
                          {resultado.feedback.recomendaciones && resultado.feedback.recomendaciones.length > 0 && (
                            <div className="feedback-subsection">
                              <h4 style={{color: '#17a2b8'}}>💡 Recomendaciones</h4>
                              <ul className="feedback-list">
                                {resultado.feedback.recomendaciones.map((item, index) => (
                                  <li key={index}>{item}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </>
                      ) : (
                        /* Feedback tradicional (array de strings) */
                        <>
                          <h3>Recomendaciones</h3>
                          <ul className="feedback-list">
                            {Array.isArray(resultado.feedback) && resultado.feedback.map((item, index) => (
                              <li key={index}>{item}</li>
                            ))}
                          </ul>
                        </>
                      )}
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
                      
                    </div>
                  )}

                  {/* Visualización de Pose detectada - Press de Hombros (solo lockout) */}
                  {resultado.imagenLockout && !resultado.imagenInicio && !resultado.imagenPeak && (
                    <div className="visualizacion-section">
                      <h3>Detección de Pose - Lockout</h3>
                      <div className="video-column" style={{maxWidth: '600px', margin: '0 auto'}}>
                        <h4>Lockout (Brazos Extendidos)</h4>
                        <img 
                          src={resultado.imagenLockout} 
                          alt="Frame de lockout" 
                          style={{width: '100%', borderRadius: '8px'}}
                        />
                        {resultado.detallesPrimeraRep && (
                          <div className="frame-info">
                            <p>⏱️ Tiempo: {resultado.detallesPrimeraRep.lockout.tiempo}s</p>
                            <p>💪 Codo: {resultado.detallesPrimeraRep.lockout.anguloCodo}°</p>
                            <p>📏 Torso: {resultado.detallesPrimeraRep.lockout.anguloTorso}°</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Visualización de Pose detectada - Remo con Barra */}
                  {resultado.imagenInicio && resultado.imagenPeak && (
                    <div className="visualizacion-section">
                      <h3>Detección de Pose - Frames Clave</h3>
                      <div className="videos-comparison">
                        <div className="video-column">
                          <h4>Inicio (Brazos Extendidos)</h4>
                          <img 
                            src={resultado.imagenInicio} 
                            alt="Frame de inicio" 
                            style={{width: '100%', borderRadius: '8px'}}
                          />
                          {resultado.detallesPrimeraRep && (
                            <div className="frame-info">
                              <p>⏱️ Tiempo: {resultado.detallesPrimeraRep.inicio.tiempo}s</p>
                              <p>💪 Codo: {resultado.detallesPrimeraRep.inicio.anguloCodo}°</p>
                              <p>📏 Torso: {resultado.detallesPrimeraRep.inicio.anguloTorso}°</p>
                            </div>
                          )}
                        </div>
                        <div className="video-column">
                          <h4>Peak (Tirón Completo)</h4>
                          <img 
                            src={resultado.imagenPeak} 
                            alt="Frame de peak" 
                            style={{width: '100%', borderRadius: '8px'}}
                          />
                          {resultado.detallesPrimeraRep && resultado.detallesPrimeraRep.peak && (
                            <div className="frame-info">
                              <p>⏱️ Tiempo: {resultado.detallesPrimeraRep.peak.tiempo}s</p>
                              <p>💪 Codo: {resultado.detallesPrimeraRep.peak.anguloCodo}°</p>
                              <p>📏 Torso: {resultado.detallesPrimeraRep.peak.anguloTorso}°</p>
                            </div>
                          )}
                        </div>
                      </div>
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


        </div>
      </div>
    </>
  );
}
