import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getLoggedUser } from '../utils/auth';
import { generarPlanEntrenamiento, obtenerPlanesAnteriores, eliminarPlan } from '../api/api';
import Navbar from '../components/Navbar';
import './PlanEntrenamiento.css';

const PlanEntrenamiento = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [planGenerado, setPlanGenerado] = useState(null);
  const [advertencia, setAdvertencia] = useState(null);
  const [error, setError] = useState(null);
  const [planesAnteriores, setPlanesAnteriores] = useState([]);
  const [planGeneradoMostrado, setPlanGeneradoMostrado] = useState(false);
  const [mostrarPlanGeneradoModal, setMostrarPlanGeneradoModal] = useState(false);
  const [planSeleccionado, setPlanSeleccionado] = useState(null);
  const [mostrarPlanAnterior, setMostrarPlanAnterior] = useState(false);
  const [nombrePlan, setNombrePlan] = useState('');

  useEffect(() => {
    const user = getLoggedUser();
    if (!user) {
      navigate('/', { replace: true });
      return;
    }
    cargarPlanesAnteriores();
  }, [navigate]);

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
    setPlanGenerado(null);
    setAdvertencia(null);

    try {
      const user = getLoggedUser();
      if (!user || !user.username) {
        setError('No hay usuario autenticado');
        setLoading(false);
        return;
      }

      const response = await generarPlanEntrenamiento(user.username, nombrePlan.trim() || undefined);

      if (response.success) {
        setPlanGenerado(response.plan);
        setAdvertencia(response.advertencia);
        setPlanGeneradoMostrado(true);
        setNombrePlan(''); // Limpiar el campo después de generar
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
    navigator.clipboard.writeText(planGenerado);
    alert('Plan copiado al portapapeles');
  };

  const descargarPlan = () => {
    const element = document.createElement('a');
    const file = new Blob([planGenerado], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `plan-entrenamiento-${new Date().toISOString().split('T')[0]}.txt`;
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
      navigator.clipboard.writeText(planSeleccionado.contenido);
      alert('Plan copiado al portapapeles');
    }
  };

  const descargarPlanAnterior = () => {
    if (planSeleccionado) {
      const element = document.createElement('a');
      const file = new Blob([planSeleccionado.contenido], { type: 'text/plain' });
      element.href = URL.createObjectURL(file);
      const fecha = new Date(planSeleccionado.fechaGeneracion).toISOString().split('T')[0];
      element.download = `plan-entrenamiento-${fecha}.txt`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    }
  };

  // Función para renderizar el plan con formato mejorado
  const renderizarPlan = (texto) => {
    if (!texto) return null;

    // Procesar el texto línea por línea
    const lineas = texto.split('\n');
    const elementos = [];
    let key = 0;

    lineas.forEach((linea, index) => {
      // Encabezados principales (### o ##)
      if (linea.startsWith('###')) {
        elementos.push(<h4 key={key++} className="plan-h4">{linea.replace(/^###\s*/, '')}</h4>);
      } else if (linea.startsWith('##')) {
        elementos.push(<h3 key={key++} className="plan-h3">{linea.replace(/^##\s*/, '')}</h3>);
      } else if (linea.startsWith('#')) {
        elementos.push(<h2 key={key++} className="plan-h2">{linea.replace(/^#\s*/, '')}</h2>);
      }
      // Listas con viñetas o guiones
      else if (linea.match(/^\s*[-*]\s/)) {
        const contenido = procesarNegritas(linea.replace(/^\s*[-*]\s/, ''));
        elementos.push(<li key={key++} className="plan-li">{contenido}</li>);
      }
      // Líneas separadoras
      else if (linea.match(/^[-=]{3,}$/)) {
        elementos.push(<hr key={key++} className="plan-separator" />);
      }
      // Líneas normales
      else if (linea.trim() !== '') {
        const contenido = procesarNegritas(linea);
        elementos.push(<p key={key++} className="plan-p">{contenido}</p>);
      }
      // Líneas vacías (espacio)
      else {
        elementos.push(<div key={key++} className="plan-space"></div>);
      }
    });

    return <div className="plan-rendered">{elementos}</div>;
  };

  // Función auxiliar para procesar negritas **texto**
  const procesarNegritas = (texto) => {
    const partes = texto.split(/\*\*(.*?)\*\*/g);
    return partes.map((parte, i) => 
      i % 2 === 1 ? <strong key={i}>{parte}</strong> : parte
    );
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
          <div className="nombre-plan-group">
            <label htmlFor="nombrePlan">Nombre del Plan (opcional):</label>
            <input
              type="text"
              id="nombrePlan"
              value={nombrePlan}
              onChange={(e) => setNombrePlan(e.target.value)}
              placeholder="Ej: Semana 1 - Fuerza, Plan Verano 2024..."
              maxLength={60}
              className="input-nombre-plan"
            />
            <span className="input-hint">
              {nombrePlan.length}/60 caracteres
            </span>
          </div>
          
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

        {planGeneradoMostrado && planGenerado && (
          <div className="plan-generado-card">
            <div className="card-header">
              <h3>✅ Plan de Entrenamiento Generado</h3>
              <p className="card-fecha">
                Generado el: {new Date().toLocaleDateString('es-ES', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            </div>
            <div className="card-actions">
              <button 
                onClick={() => setMostrarPlanGeneradoModal(true)} 
                className="btn-ver-plan"
              >
                👁️ Ver Plan Completo
              </button>
              <button onClick={copiarAlPortapapeles} className="btn-action">
                📋 Copiar
              </button>
              <button onClick={descargarPlan} className="btn-action">
                💾 Descargar
              </button>
              <button 
                onClick={() => {
                  setPlanGeneradoMostrado(false);
                  setPlanGenerado(null);
                  setAdvertencia(null);
                }} 
                className="btn-eliminar"
              >
                🗑️ Borrar
              </button>
            </div>
          </div>
        )}

        {/* Modal para ver plan generado */}
        {mostrarPlanGeneradoModal && planGenerado && (
          <div className="modal-overlay" onClick={() => setMostrarPlanGeneradoModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <div className="modal-plan-container">
                <div className="modal-header">
                  <h3>📋 Plan de Entrenamiento Personalizado</h3>
                  <button onClick={() => setMostrarPlanGeneradoModal(false)} className="btn-close-modal">
                    ✕
                  </button>
                </div>
                <p className="modal-fecha">
                  Generado el: {new Date().toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="modal-plan-content">
                  <div className="plan-text">{renderizarPlan(planGenerado)}</div>
                </div>
              </div>
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
              <div className="modal-plan-container">
                <div className="modal-header">
                  <h3>📋 {planSeleccionado.titulo}</h3>
                  <button onClick={cerrarPlanAnterior} className="btn-close-modal">
                    ✕
                  </button>
                </div>
                <p className="modal-fecha">
                  Generado el: {new Date(planSeleccionado.fechaGeneracion).toLocaleDateString('es-ES', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
                <div className="modal-actions">
                  <button onClick={copiarPlanAnterior} className="btn-modal-action">
                    📋 Copiar
                  </button>
                  <button onClick={descargarPlanAnterior} className="btn-modal-action">
                    💾 Descargar
                  </button>
                </div>
                <div className="modal-plan-content">
                  <div className="plan-text">{renderizarPlan(planSeleccionado.contenido)}</div>
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
