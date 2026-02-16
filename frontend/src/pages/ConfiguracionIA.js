import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { obtenerConfiguracionLLM, actualizarPreferenciaLLM } from "../api/api";
import Navbar from "../components/Navbar";
import "./ConfiguracionIA.css";

export default function ConfiguracionIA() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [llmActual, setLlmActual] = useState("claude");
  const [modelosInfo, setModelosInfo] = useState({});
  const [saving, setSaving] = useState(false);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Obtener el username del usuario logueado
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!loggedUser || !loggedUser.username) {
      navigate("/login");
      return;
    }

    setUsername(loggedUser.username);
    cargarConfiguracion(loggedUser.username);
  }, [navigate]);

  const cargarConfiguracion = async (user) => {
    try {
      setLoading(true);
      const response = await obtenerConfiguracionLLM(user);
      setLlmActual(response.llmActual);
      setModelosInfo(response.modelosDisponibles);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar configuración de IA");
      setLoading(false);
    }
  };

  const handleCambiarModelo = async (nuevoModelo) => {
    if (nuevoModelo === llmActual) return;

    try {
      setSaving(true);
      setError("");
      setSuccessMessage("");

      const response = await actualizarPreferenciaLLM(username, nuevoModelo);
      
      setLlmActual(nuevoModelo);
      setSuccessMessage(response.message);
      setSaving(false);

      // Limpiar mensaje de éxito después de 3 segundos
      setTimeout(() => setSuccessMessage(""), 3000);
    } catch (err) {
      setError(err.message || "Error al actualizar preferencia");
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="config-ia-container">
          <div className="llm-config-loading">Cargando configuración de IA...</div>
        </div>
      </>
    );
  }

  const modeloClaude = modelosInfo.claude || {};
  const modeloOpenAI = modelosInfo.openai || {};

  return (
    <>
      <Navbar />
      <div className="config-ia-container">
        <div className="config-ia-header">
          <h1>⚙️ Configuración de Inteligencia Artificial</h1>
          <p className="config-ia-description">
            Elige el modelo de IA que analizará tus ejercicios. Si el modelo seleccionado
            no está disponible, se usará el otro automáticamente como respaldo.
          </p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {successMessage && <div className="success-message">{successMessage}</div>}

        <div className="llm-models-grid">
          {/* Claude */}
          <div 
            className={`llm-model-card ${llmActual === 'claude' ? 'selected' : ''} ${saving ? 'disabled' : ''}`}
            onClick={() => !saving && handleCambiarModelo('claude')}
          >
            <div className="llm-model-header">
              <h3>🔵 {modeloClaude.nombre}</h3>
              <span className="llm-provider">{modeloClaude.proveedor}</span>
            </div>

            {llmActual === 'claude' && (
              <div className="llm-selected-badge">✓ Seleccionado</div>
            )}

            <div className="llm-model-specs">
              <div className="spec-row">
                <span className="spec-label">Velocidad:</span>
                <span className="spec-value">{modeloClaude.velocidad}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Precisión:</span>
                <span className="spec-value">{modeloClaude.precision}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Nivel de Detalle:</span>
                <span className="spec-value">{modeloClaude.detalle}</span>
              </div>
            </div>

            <div className="llm-specialty">
              <strong>Especialidad:</strong>
              <p>{modeloClaude.especialidad}</p>
            </div>

            <div className="llm-pros-cons">
              <div className="llm-pros">
                <strong>✅ Ventajas:</strong>
                <ul>
                  {modeloClaude.ventajas?.map((ventaja, idx) => (
                    <li key={idx}>{ventaja}</li>
                  ))}
                </ul>
              </div>
              <div className="llm-cons">
                <strong>⚠️ Limitaciones:</strong>
                <ul>
                  {modeloClaude.desventajas?.map((desventaja, idx) => (
                    <li key={idx}>{desventaja}</li>
                  ))}
                </ul>
              </div>
            </div>

            {llmActual !== 'claude' && !saving && (
              <button className="select-model-btn">Seleccionar Claude</button>
            )}
          </div>

          {/* OpenAI */}
          <div 
            className={`llm-model-card ${llmActual === 'openai' ? 'selected' : ''} ${saving ? 'disabled' : ''}`}
            onClick={() => !saving && handleCambiarModelo('openai')}
          >
            <div className="llm-model-header">
              <h3>🟢 {modeloOpenAI.nombre}</h3>
              <span className="llm-provider">{modeloOpenAI.proveedor}</span>
            </div>

            {llmActual === 'openai' && (
              <div className="llm-selected-badge">✓ Seleccionado</div>
            )}

            <div className="llm-model-specs">
              <div className="spec-row">
                <span className="spec-label">Velocidad:</span>
                <span className="spec-value">{modeloOpenAI.velocidad}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Precisión:</span>
                <span className="spec-value">{modeloOpenAI.precision}</span>
              </div>
              <div className="spec-row">
                <span className="spec-label">Nivel de Detalle:</span>
                <span className="spec-value">{modeloOpenAI.detalle}</span>
              </div>
            </div>

            <div className="llm-specialty">
              <strong>Especialidad:</strong>
              <p>{modeloOpenAI.especialidad}</p>
            </div>

            <div className="llm-pros-cons">
              <div className="llm-pros">
                <strong>✅ Ventajas:</strong>
                <ul>
                  {modeloOpenAI.ventajas?.map((ventaja, idx) => (
                    <li key={idx}>{ventaja}</li>
                  ))}
                </ul>
              </div>
              <div className="llm-cons">
                <strong>⚠️ Limitaciones:</strong>
                <ul>
                  {modeloOpenAI.desventajas?.map((desventaja, idx) => (
                    <li key={idx}>{desventaja}</li>
                  ))}
                </ul>
              </div>
            </div>

            {llmActual !== 'openai' && !saving && (
              <button className="select-model-btn">Seleccionar GPT-4o</button>
            )}
          </div>
        </div>

        <div className="llm-info-footer">
          <p>
            <strong>💡 Nota:</strong> Ambos modelos proporcionan análisis de alta calidad.
            La elección depende de tus preferencias personales entre velocidad y detalle.
          </p>
          <p className="llm-info-footer-detail">
            <strong>🔄 Sistema de Respaldo:</strong> Si tu modelo preferido no está disponible temporalmente,
            el otro modelo tomará el control automáticamente para asegurar que siempre recibas feedback de calidad.
          </p>
        </div>
      </div>
    </>
  );
}
