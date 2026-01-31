import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  registerOneRM, 
  getOneRMHistory, 
  getOneRMExercises,
  deleteOneRM 
} from "../api/api";
import Navbar from "../components/Navbar";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import "./Benchmarks.css";

// Registrar componentes de Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

// Lista predefinida de ejercicios comunes
const EJERCICIOS_DISPONIBLES = [
  "Squat",
  "Bench Press",
  "Deadlift",
  "Overhead Press",
  "Pull-ups",
  "Barbell Row",
  "Front Squat",
  "Incline Press",
  "Hip Thrust",
  "Clean",
  "Snatch",
  "Thruster"
];

export default function Benchmarks() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  
  const [formData, setFormData] = useState({
    peso: "",
    fecha: new Date().toISOString().split('T')[0]
  });

  const [selectedExercise, setSelectedExercise] = useState(null); // null = vista lista
  const [historyData, setHistoryData] = useState([]);
  const [exercisesWithData, setExercisesWithData] = useState([]);
  const [username, setUsername] = useState("");

  useEffect(() => {
    // Verificar si el usuario está logueado
    const loggedUser = JSON.parse(localStorage.getItem("user"));
    
    if (!loggedUser || !loggedUser.username) {
      navigate("/login");
      return;
    }

    setUsername(loggedUser.username);
    loadExercisesWithData(loggedUser.username);
  }, [navigate]);

  const loadExercisesWithData = async (user) => {
    try {
      const response = await getOneRMExercises(user);
      setExercisesWithData(response.ejercicios || []);
    } catch (err) {
      console.error("Error al cargar ejercicios:", err);
    }
  };

  const loadHistory = async (ejercicio) => {
    try {
      setLoading(true);
      const response = await getOneRMHistory(username, ejercicio);
      setHistoryData(response.registros || []);
      setLoading(false);
    } catch (err) {
      setError("Error al cargar el historial");
      setLoading(false);
    }
  };

  const handleExerciseSelect = (ejercicio) => {
    setSelectedExercise(ejercicio);
    setError("");
    setSuccessMessage("");
    loadHistory(ejercicio);
  };

  const handleBackToList = () => {
    setSelectedExercise(null);
    setFormData({
      peso: "",
      fecha: new Date().toISOString().split('T')[0]
    });
    setError("");
    setSuccessMessage("");
    loadExercisesWithData(username);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    // Validaciones
    if (!formData.peso || parseFloat(formData.peso) <= 0) {
      setError("El peso debe ser mayor que 0");
      return;
    }

    try {
      await registerOneRM({
        username: username,
        nombreEjercicio: selectedExercise,
        peso: parseFloat(formData.peso),
        fecha: formData.fecha
      });

      setSuccessMessage("1RM registrado con éxito");
      
      // Limpiar formulario
      setFormData({
        peso: "",
        fecha: new Date().toISOString().split('T')[0]
      });

      // Recargar historial
      await loadHistory(selectedExercise);
      await loadExercisesWithData(username);

    } catch (err) {
      setError(err.message || "Error al registrar el 1RM");
    }
  };

  const handleDeleteRecord = async (id) => {
    if (!window.confirm("¿Estás seguro de eliminar este registro?")) {
      return;
    }

    try {
      await deleteOneRM(id);
      setSuccessMessage("Registro eliminado con éxito");
      
      // Recargar datos
      await loadHistory(selectedExercise);
      await loadExercisesWithData(username);
    } catch (err) {
      setError("Error al eliminar el registro");
    }
  };

  // Preparar datos para el gráfico
  const chartData = {
    labels: historyData.map(record => 
      new Date(record.fecha).toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      })
    ),
    datasets: [
      {
        label: `${selectedExercise} (kg)`,
        data: historyData.map(record => record.peso),
        borderColor: 'rgb(102, 126, 234)',
        backgroundColor: 'rgba(102, 126, 234, 0.1)',
        tension: 0.1,
        fill: true
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Evolución del 1RM - ${selectedExercise}`,
        font: {
          size: 18
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            return `Peso: ${context.parsed.y} kg`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        title: {
          display: true,
          text: 'Peso (kg)'
        }
      },
      x: {
        title: {
          display: true,
          text: 'Fecha'
        }
      }
    }
  };

  return (
    <>
      <Navbar />
      <div className="benchmarks-container">
        {/* Vista: Lista de ejercicios */}
        {!selectedExercise && (
          <>
            <div className="benchmarks-header">
              <h1>Benchmarks</h1>
              <p className="subtitle">Selecciona un ejercicio para ver y registrar tu progreso</p>
            </div>

            <div className="card">
              <h2>Ejercicios Disponibles</h2>
              <div className="exercises-grid">
                {EJERCICIOS_DISPONIBLES.map((ejercicio, index) => {
                  const hasData = exercisesWithData.includes(ejercicio);
                  return (
                    <button
                      key={index}
                      className={`exercise-card ${hasData ? 'has-data' : ''}`}
                      onClick={() => handleExerciseSelect(ejercicio)}
                    >
                      <span className="exercise-icon">💪</span>
                      <span className="exercise-name">{ejercicio}</span>
                      {hasData && <span className="badge">Con datos</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          </>
        )}

        {/* Vista: Detalle del ejercicio */}
        {selectedExercise && (
          <>
            <div className="benchmarks-header">
              <button className="back-btn" onClick={handleBackToList}>
                ← Volver a ejercicios
              </button>
              <h1>{selectedExercise}</h1>
              <p className="subtitle">Registra tu peso máximo y visualiza tu evolución</p>
            </div>

            {error && <div className="error-message">{error}</div>}
            {successMessage && <div className="success-message">{successMessage}</div>}

            {/* Formulario de registro */}
            <div className="card">
              <h2>Registrar Nuevo 1RM</h2>
              <form onSubmit={handleSubmit} className="onerm-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>Peso (kg): <span className="required">*</span></label>
                    <input
                      type="number"
                      name="peso"
                      value={formData.peso}
                      onChange={handleChange}
                      placeholder="Peso en kg"
                      step="0.5"
                      min="0"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Fecha: <span className="required">*</span></label>
                    <input
                      type="date"
                      name="fecha"
                      value={formData.fecha}
                      onChange={handleChange}
                      max={new Date().toISOString().split('T')[0]}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn-primary">
                  Registrar 1RM
                </button>
              </form>
            </div>

            {/* Gráfico de evolución */}
            {historyData.length > 0 && (
              <div className="card">
                <h2>Evolución del Rendimiento</h2>
                <div className="chart-container">
                  <Line data={chartData} options={chartOptions} />
                </div>
                
                {/* Tabla de registros */}
                <div className="records-table">
                  <h3>Historial de Registros</h3>
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th>Peso (kg)</th>
                        <th>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {historyData.map((record) => (
                        <tr key={record.id}>
                          <td>{new Date(record.fecha).toLocaleDateString('es-ES')}</td>
                          <td>{record.peso} kg</td>
                          <td>
                            <button 
                              className="btn-delete-small"
                              onClick={() => handleDeleteRecord(record.id)}
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Mensaje si no hay registros */}
            {historyData.length === 0 && !loading && (
              <div className="card">
                <p className="no-data">
                  Aún no hay registros para {selectedExercise}. ¡Registra tu primer 1RM!
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
