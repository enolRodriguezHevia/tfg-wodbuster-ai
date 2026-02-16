import React, { useState, useEffect } from 'react';
import { getLoggedUser } from '../utils/auth';
import { generarPlanEntrenamiento, obtenerPlanesAnteriores, eliminarPlan } from '../api/api';
import Navbar from '../components/Navbar';
import './PlanEntrenamiento.css';

const PlanEntrenamiento = () => {
  const [loading, setLoading] = useState(false);
  const [promptGenerado, setPromptGenerado] = useState(null);
  const [advertencia, setAdvertencia] = useState(null);
  const [error, setError] = useState(null);
  const [planesAnteriores, setPlanesAnteriores] = useState([]);
  const [mostrarPrompt, setMostrarPrompt] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [mostrarPlanAnterior, setMostrarPlanAnterior] = useState(false);

  useEffect(() => {
    cargarPlanesAnteriores();
  }, []);

  const cargarPlanesAnteriores = async () => {
    try {
      const user = getLoggedUser();
      if (!user || !user.username) return;

      const response = await obtenerPlanesAnteriores(user.username);
      if (response.success) {
        setPlanesAnteriores(response.planes);
      }
    } catch (err) {
      console.error('Error al cargar planes anteriores:', err);
    }
  };

  const handleGenerarPlan = async () => {
    setLoading(true);
    setError(null);
    setPromptGenerado(null);
    setAdvertencia(null);

    try {
      const user = getLoggedUser();
      if (!user || !user.username) {
        setError('No hay usuario autenticado');
        setLoading(false);
        return;
      }

      const response = await generarPlanEntrenamiento(user.username);

      if (response.success) {
        setPromptGenerado(response.prompt);
        setAdvertencia(response.advertencia);
        setMostrarPrompt(true);
        cargarPlanesAnteriores();
      } else {
        setError(response.message);
        if (response.camposFaltantes) {
          setError(
            `${response.message}\n\nCampos faltantes: ${response.camposFaltantes.join(', ')}`
          );
        }
      }
    } catch (err) {
      console.error('Error al generar plan:', err);
      setError(err.message || 'Error al generar el plan de entrenamiento');
    } finally {
      setLoading(false);
    }
  };

  const copiarAlPortapapeles = () => {
    navigator.clipboard.writeText(promptGenerado);
    alert('Prompt copiado al portapapeles');
  };

  const descargarPrompt = () => {
    const element = document.createElement('a');
    const file = new Blob([promptGenerado], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `prompt-plan-entrenamiento-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const verPlanAnterior = (plan) => {
    setPlanSeleccionado(plan);
    setMostrarPlanAnterior(true);
  };

  const cerrarPlanAnterior = () => {
    setPlanSeleccionado(null);
    setMostrarPlanAnterior(false);
  };

  const handleEliminarPlan = async (e, planId) => {
    e.stopPropagation(); // Evitar que se abra el modal al hacer clic en eliminar
    
    if (!window.confirm('¿Estás seguro de que quieres eliminar este plan?')) {
      return;
    }

    try {
      const user = JSON.parse(localStorage.getItem('user'));
      if (!user || !user.username) return;

      const response = await eliminarPlan(user.username, planId);
      if (response.success) {
        // Recargar la lista de planes
        cargarPlanesAnteriores();
        // Si el plan eliminado es el que está abierto en el modal, cerrarlo
        if (planSeleccionado && planSeleccionado._id === planId) {
          cerrarPlanAnterior();
        }
      }
    } catch (err) {
      console.error('Error al eliminar plan:', err);
      alert('Error al eliminar el plan');
    }
  };

  const copiarPlanAnterior = () => {
    if (planSeleccionado) {
      navigator.clipboard.writeText(planSeleccionado.promptGenerado);
      alert('Prompt copiado al portapapeles');
    }
  };

  const descargarPlanAnterior = () => {
    if (planSeleccionado) {
      const element = document.createElement('a');
      const file = new Blob([planSeleccionado.promptGenerado], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      const fecha = new Date(planSeleccionado.fechaGeneracion).toISOString().split('T')[0];
      element.download = `plan-entrenamiento-${fecha}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  return (
    <>
      <Navbar />
      <div className="plan-entrenamiento-container">
        <h1>Plan de Entrenamiento Personalizado</h1>
      
        <div className="info-section">
          <p>
            Genera un plan de entrenamiento personalizado basado en tu información 
            de perfil, historial de entrenamientos y registros de 1RM.
          </p>
          <p className="warning-text">
            ⚠️ Este plan es orientativo y debe ser revisado por un profesional.
          </p>
        </div>

        <div className="generar-section">
          <button 
            onClick={handleGenerarPlan} 
            disabled={loading}
            className="btn-generar"
          >
            {loading ? 'Generando...' : 'Generar Plan de Entrenamiento'}
          </button>
        </div>

        {error && (
          <div className="error-message">
            <h3>❌ Error</h3>
            <pre>{error}</pre>
          </div>
        )}

        {advertencia && (
          <div className="advertencia-message">
            <h3>⚠️ Advertencia</h3>
            <p>{advertencia}</p>
          </div>
        )}

        {mostrarPrompt && promptGenerado && (
          <div className="prompt-generado">
            <div className="prompt-header">
              <h3>✅ Prompt generado correctamente</h3>
              <div className="prompt-actions">
                <button onClick={copiarAlPortapapeles} className="btn-secondary">
                  📋 Copiar
                </button>
                <button onClick={descargarPrompt} className="btn-secondary">
                  💾 Descargar
                </button>
                <button 
                  onClick={() => setMostrarPrompt(false)} 
                  className="btn-secondary"
                >
                  ✕ Cerrar
                </button>
              </div>
            </div>
            <div className="prompt-content">
              <pre>{promptGenerado}</pre>
            </div>
            <div className="prompt-footer">
              <p>
                <strong>Nota:</strong> Este es el prompt que se enviará al modelo de lenguaje (LLM) 
                para generar tu plan de entrenamiento personalizado. En futuras versiones, 
                esto se procesará automáticamente mediante una API.
              </p>
            </div>
          </div>
        )}

        {planesAnteriores.length > 0 && (
          <div className="planes-anteriores">
            <h2>📚 Planes Anteriores</h2>
            <div className="planes-lista">
              {planesAnteriores.map((plan) => (
                <div key={plan._id} className="plan-card" onClick={() => verPlanAnterior(plan)}>
                  <h3>{plan.titulo}</h3>
                  <p className="plan-fecha">
                    Generado el: {new Date(plan.fechaGeneracion).toLocaleDateString('es-ES')}
                  </p>
                  <button 
                    className="btn-eliminar-plan"
                    onClick={(e) => handleEliminarPlan(e, plan._id)}
                    title="Eliminar plan"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {mostrarPlanAnterior && planSeleccionado && (
          <div className="modal-overlay" onClick={cerrarPlanAnterior}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="prompt-generado">
                <div className="prompt-header">
                  <h3>📋 {planSeleccionado.titulo}</h3>
                  <div className="prompt-actions">
                    <button onClick={copiarPlanAnterior} className="btn-secondary">
                      📋 Copiar
                    </button>
                    <button onClick={descargarPlanAnterior} className="btn-secondary">
                      💾 Descargar
                    </button>
                    <button onClick={cerrarPlanAnterior} className="btn-secondary">
                      ✕ Cerrar
                    </button>
                  </div>
                </div>
                <p className="plan-fecha">
                  Generado el: {new Date(planSeleccionado.fechaGeneracion).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="prompt-content">
                  <pre>{planSeleccionado.promptGenerado}</pre>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default PlanEntrenamiento;
