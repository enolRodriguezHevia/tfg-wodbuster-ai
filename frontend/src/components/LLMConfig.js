import React, { useState, useEffect } from "react";
import { obtenerConfiguracionLLM, actualizarPreferenciaLLM } from "../api/api";
import "./LLMConfig.css";

export default function LLMConfig({ username }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [llmActual, setLlmActual] = useState("claude");
  const [modelosInfo, setModelosInfo] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    cargarConfiguracion();
  }, [username]);

  const cargarConfiguracion = async () => {
    try {
      setLoading(true);
      const response = await obtenerConfiguracionLLM(username);
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
    return <div className="llm-config-loading">Cargando configuración de IA...</div>;
  }

  const modeloClaude = modelosInfo.claude || {};
  const modeloOpenAI = modelosInfo.openai || {};

  return (
    <div className="llm-config-container">
      <h2>⚙️ Configuración de Inteligencia Artificial</h2>
      <p className="llm-config-description">
        Elige el modelo de IA para generar feedback de tus ejercicios. Si el modelo seleccionado
        no está disponible, se usará el otro automáticamente como respaldo.
      </p>

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
      </div>
    </div>
  );
}
