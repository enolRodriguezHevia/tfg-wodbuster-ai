import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { getLoggedUser, getAuthToken } from "../utils/auth";
import {
  analizarSentadillaVideo,
  analizarPesoMuertoVideo,
  analizarPressHombroVideo,
  analizarRemoBarraVideo
} from "../utils/videoAnalysis/index";
import "./AnalisisVideos.css";

export default function AnalisisVideos() {
  const navigate = useNavigate();
  const [ejercicios, setEjercicios] = useState([]);
  const [ejercicioSeleccionado, setEjercicioSeleccionado] = useState("");
  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [resultado, setResultado] = useState(null);
  const [mostrarModalResultado, setMostrarModalResultado] = useState(false);

  const renderizarFeedback = (texto) => {
    if (!texto) return null;
    const lineas = texto.split('\n');
    const elementos = [];
    let key = 0;

    lineas.forEach((linea) => {
      if (linea.startsWith('###')) {
        elementos.push(<h4 key={key++} className="feedback-h4">{linea.replace(/^###\s*/, '')}</h4>);
      } else if (linea.startsWith('##')) {
        elementos.push(<h3 key={key++} className="feedback-h3">{linea.replace(/^##\s*/, '')}</h3>);
      } else if (linea.startsWith('#')) {
        elementos.push(<h2 key={key++} className="feedback-h2">{linea.replace(/^#\s*/, '')}</h2>);
      } else if (linea.match(/^\s*[-*]\s/)) {
        const contenido = procesarNegritas(linea.replace(/^\s*[-*]\s/, ''));
        elementos.push(<li key={key++} className="feedback-li">{contenido}</li>);
      } else if (linea.match(/^[-=]{3,}$/)) {
        elementos.push(<hr key={key++} className="feedback-separator" />);
      } else if (linea.trim() !== '') {
        const contenido = procesarNegritas(linea);
        elementos.push(<p key={key++} className="feedback-p">{contenido}</p>);
      } else {
        elementos.push(<div key={key++} className="feedback-space"></div>);
      }
    });

    return <div className="feedback-rendered">{elementos}</div>;
  };

  const procesarNegritas = (texto) => {
    const partes = texto.split(/\*\*(.*?)\*\*/g);
    return partes.map((parte, i) => i % 2 === 1 ? <strong key={i}>{parte}</strong> : parte);
  };

  useEffect(() => {
    const user = getLoggedUser();
    if (!user) {
      navigate("/login");
      return;
    }
    cargarEjercicios();
  }, [navigate]);

  const cargarEjercicios = async () => {
    try {
      const ejerciciosDisponibles = [
        {
          id: "sentadilla",
          nombre: "Sentadilla (Squat)",
          icono: "🦵",
          descripcion: "Ejercicio fundamental de fuerza para piernas y glúteos. La IA detectará el punto más bajo de la sentadilla y analizará la alineación de rodillas, caderas y columna.",
          consejos: ["Mantén la espalda recta", "Rodillas alineadas con los pies", "Desciende hasta paralelo o más"],
          disponible: true
        },
        {
          id: "press-hombros",
          nombre: "Press de Hombros",
          icono: "💪",
          descripcion: "Ejercicio de empuje vertical para deltoides y tríceps. Se analizará el lockout (extensión completa) para evaluar la alineación del torso y los codos.",
          consejos: ["Core activado durante el movimiento", "Extiende completamente los brazos", "Evita hiperextender la espalda baja"],
          disponible: true
        },
        {
          id: "peso-muerto",
          nombre: "Peso Muerto (Deadlift)",
          icono: "🏋️",
          descripcion: "Ejercicio de cadena posterior que trabaja espalda, glúteos e isquiotibiales. Se compararán el frame inicial y el lockout para evaluar la trayectoria de la cadera.",
          consejos: ["Barra pegada al cuerpo", "Espalda neutra en todo momento", "Empuja el suelo con los pies"],
          disponible: true
        },
        {
          id: "remo-barra",
          nombre: "Remo con Barra Inclinado",
          icono: "🚣",
          descripcion: "Ejercicio de tirón horizontal para dorsales y romboides. Se analizarán el inicio con brazos extendidos y el peak de contracción para evaluar el ángulo del torso.",
          consejos: ["Torso inclinado entre 45° y 60°", "Lleva la barra hacia el ombligo", "Mantén los codos cerca del cuerpo"],
          disponible: true
        }
      ];
      setEjercicios(ejerciciosDisponibles);
    } catch (err) {
      setError("Error al cargar la lista de ejercicios");
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
      const validFormats = ["video/mp4", "video/webm"];
      if (!validFormats.includes(file.type)) {
        setError("Formato de video no compatible. Por favor, sube un archivo MP4 o WebM.");
        setVideoFile(null);
        setVideoPreview(null);
        return;
      }

      const maxSize = 100 * 1024 * 1024;
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
    setStatusMessage("");

    if (!ejercicioSeleccionado) {
      setError("Por favor, selecciona un ejercicio");
      return;
    }

    if (!videoFile) {
      setError("Por favor, sube un video");
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage("Analizando video con IA... Esto puede tardar 30-60 segundos.");

    try {
      let resultadoAnalisis;

      if (ejercicioSeleccionado === "sentadilla") {
        resultadoAnalisis = await analizarSentadillaVideo(videoFile);
      } else if (ejercicioSeleccionado === "peso-muerto") {
        setStatusMessage("Analizando video de peso muerto con IA... Esto puede tardar 30-60 segundos.");
        resultadoAnalisis = await analizarPesoMuertoVideo(videoFile);
      } else if (ejercicioSeleccionado === "press-hombros") {
        setStatusMessage("Analizando video de press de hombros con IA... Esto puede tardar 30-60 segundos.");
        resultadoAnalisis = await analizarPressHombroVideo(videoFile);
      } else if (ejercicioSeleccionado === "remo-barra") {
        setStatusMessage("Analizando video de remo con barra con IA... Esto puede tardar 30-60 segundos.");
        resultadoAnalisis = await analizarRemoBarraVideo(videoFile);
      } else {
        setError("Por ahora solo están disponibles los análisis de sentadilla, peso muerto, press de hombros y remo con barra");
        setIsAnalyzing(false);
        return;
      }

      setStatusMessage("Generando feedback con IA... Esto puede tardar unos segundos.");

      const formData = new FormData();
      formData.append("ejercicio", ejercicioSeleccionado);
      formData.append("video", videoFile);
      formData.append("analisisResultado", JSON.stringify(resultadoAnalisis));
      if (resultadoAnalisis.framesCompletos) formData.append("frames", JSON.stringify(resultadoAnalisis.framesCompletos));
      if (resultadoAnalisis.framesClave) formData.append("framesClave", JSON.stringify(resultadoAnalisis.framesClave));
      if (resultadoAnalisis.metricas) formData.append("metricas", JSON.stringify(resultadoAnalisis.metricas));

      const token = getAuthToken();
      const response = await fetch("http://localhost:3000/api/analisis-video/analizar", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al guardar el análisis");

      if (data.usaIA && data.feedback) {
        resultadoAnalisis.feedback = data.feedback;
        resultadoAnalisis.esCorrecta = data.esCorrecta;
        resultadoAnalisis.usaIA = true;
      }

      setResultado(resultadoAnalisis);
      setStatusMessage("");
    } catch (err) {
      setError(err.message || "Error al procesar el video. Por favor, inténtalo de nuevo.");
      setStatusMessage("");
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
    setStatusMessage("");
  };

  // Mostrar el modal automáticamente cuando hay resultado
  React.useEffect(() => {
    if (resultado) setMostrarModalResultado(true);
    else setMostrarModalResultado(false);
  }, [resultado]);

  return (
    <>
      <Navbar />
      <div className="analisis-videos-container">
        <h1 className="page-title">Análisis de Técnica con IA</h1>
        <p className="page-subtitle">Sube un video de tu ejercicio y recibe feedback personalizado sobre tu técnica</p>

        <div className="analisis-content">
          <form onSubmit={handleSubmit} className="analisis-form" role="form">
            <div className="form-columns">
              {/* Selección de ejercicio */}
              <div className="form-section">
                <h2 className="section-title">1. Selecciona el ejercicio</h2>
                <select
                  aria-label="Ejercicio"
                  value={ejercicioSeleccionado}
                  onChange={handleEjercicioChange}
                  className="ejercicio-select"
                  disabled={isAnalyzing}
                >
                  <option value="">-- Selecciona un ejercicio --</option>
                  {ejercicios.map((e) => (
                    <option key={e.id} value={e.id}>{e.nombre}</option>
                  ))}
                </select>

                {ejercicioSeleccionado && (() => {
                  const info = ejercicios.find(e => e.id === ejercicioSeleccionado);
                  if (!info) return null;
                  return (
                    <div className="ejercicio-info">
                      <div className="ejercicio-info-header">
                        <span className="ejercicio-icono">{info.icono}</span>
                        <span className="ejercicio-info-nombre">{info.nombre}</span>
                      </div>
                      <p className="ejercicio-descripcion">{info.descripcion}</p>
                      {info.consejos?.length > 0 && (
                        <ul className="ejercicio-consejos">
                          {info.consejos.map((c,i) => <li key={i}>✓ {c}</li>)}
                        </ul>
                      )}
                      {!info.disponible && <span className="ejercicio-badge-proximamente">Próximamente</span>}
                    </div>
                  );
                })()}

                {error && <div className="error-message">⚠️ {error}</div>}

                <div className="form-actions">
                  <button type="submit" className="btn-analizar" disabled={isAnalyzing || !ejercicioSeleccionado || !videoFile}>
                    {isAnalyzing ? "Procesando..." : "Analizar Video"}
                  </button>
                  <button type="button" onClick={handleReset} className="btn-reset" disabled={isAnalyzing}>Limpiar</button>
                </div>
              </div>

              {/* Subida de video */}
              <div className="form-section">
                <h2 className="section-title">2. Sube tu video</h2>
                <p className="section-info">Formatos aceptados: MP4, WebM | Tamaño máximo: 100MB</p>
                <input
                  type="file"
                  aria-label="Sube un video"
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
            </div>
          </form>

          {/* Modal para mostrar el feedback y las imágenes */}
          {mostrarModalResultado && resultado && (
            <div className="modal-overlay" onClick={() => setMostrarModalResultado(false)}>
              <div className="modal-content" onClick={e => e.stopPropagation()}>
                <div className="modal-plan-container">
                  <div className="modal-header">
                    <h3>📋 Feedback de Análisis de Video</h3>
                    <button onClick={() => setMostrarModalResultado(false)} className="btn-close-modal">✕</button>
                  </div>
                  <div className="modal-fecha">
                    {new Date().toLocaleDateString('es-ES', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                  <div className="modal-plan-content">
                    {/* Feedback IA */}
                    {resultado.feedback && (
                      <div className="feedback-section">
                        {resultado.usaIA && <div style={{ fontSize:'0.85em', color:'#666', marginBottom:'10px'}}>🤖 Análisis generado con IA</div>}
                        <h3>Análisis de Técnica</h3>
                        <div className="feedback-narrative feedback-content">
                          {typeof resultado.feedback === 'string' ? renderizarFeedback(resultado.feedback) : <pre>{JSON.stringify(resultado.feedback, null, 2)}</pre>}
                        </div>
                      </div>
                    )}
                    {/* Visualizaciones de imágenes */}
                    {resultado.imagenVisualizada && (
                      <div className="visualizacion-section">
                        <h3>Detección de Pose (Punto más bajo)</h3>
                        <div className="video-column-single">
                          <img
                            src={resultado.imagenVisualizada}
                            alt="Pose detectada"
                            className="pose-image-small"
                          />
                        </div>
                      </div>
                    )}
                    {resultado.imagenInicio && resultado.imagenLockout && (
                      <div className="visualizacion-section">
                        <h3>Detección de Pose - Frames Clave</h3>
                        <div className="videos-comparison">
                          <div className="video-column">
                            <h4>Inicio (Cadera más baja)</h4>
                            <img
                              src={resultado.imagenInicio}
                              alt="Frame inicio"
                              className="pose-image-small"
                            />
                          </div>
                          <div className="video-column">
                            <h4>Lockout (Cadera más alta)</h4>
                            <img
                              src={resultado.imagenLockout}
                              alt="Frame lockout"
                              className="pose-image-small"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                    {resultado.imagenLockout && !resultado.imagenInicio && !resultado.imagenPeak && (
                      <div className="visualizacion-section">
                        <h3>Detección de Pose - Lockout</h3>
                        <div className="video-column" style={{ maxWidth: "500px", margin: "0 auto" }}>
                          <h4>Brazos extendidos</h4>
                          <img
                            src={resultado.imagenLockout}
                            alt="Lockout"
                            className="pose-image-small"
                          />
                        </div>
                      </div>
                    )}
                    {resultado.imagenInicio && resultado.imagenPeak && (
                      <div className="visualizacion-section">
                        <h3>Detección de Pose - Frames Clave</h3>
                        <div className="videos-comparison">
                          <div className="video-column">
                            <h4>Inicio</h4>
                            <img
                              src={resultado.imagenInicio}
                              alt="Frame inicio"
                              className="pose-image-small"
                            />
                          </div>
                          <div className="video-column">
                            <h4>Peak (contracción máxima)</h4>
                            <img
                              src={resultado.imagenPeak}
                              alt="Frame peak"
                              className="pose-image-small"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Overlay bloqueante */}
          {isAnalyzing && (
            <div style={{
              position:'fixed',
              top:0,
              left:0,
              width:'100vw',
              height:'100vh',
              background:'rgba(255,255,255,0.85)',
              zIndex:3000,
              display:'flex',
              flexDirection:'column',
              alignItems:'center',
              justifyContent:'center',
              pointerEvents:'all'
            }}>
              <div className="loading-spinner" style={{marginBottom: 18}}></div>
              <h2 style={{color:'#e85d04', fontWeight:700, fontSize:'1.2rem', marginBottom:8}}>🔎 Procesando tu video</h2>
              <p style={{color:'#333', fontSize:'1rem', textAlign:'center'}}>{statusMessage}</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
