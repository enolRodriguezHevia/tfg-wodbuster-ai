import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLoggedUser } from "../utils/auth";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    const user = getLoggedUser();
    if (!user) {
      navigate("/", { replace: true });
      return;
    }
    if (user.profilePhoto) {
      setUserPhoto(user.profilePhoto);
    }
  }, [navigate]);

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="functionality-buttons">
          <button className="function-button" onClick={() => navigate("/profile")}>
            {userPhoto ? (
              <img 
                src={`http://localhost:3000/${userPhoto}`} 
                alt="Perfil" 
                className="button-profile-photo"
              />
            ) : (
              <span className="button-icon">👤</span>
            )}
            <span className="button-text">Mi Perfil</span>
          </button>
          <button className="function-button" onClick={() => navigate("/benchmarks")}>
            <span className="button-icon">💪</span>
            <span className="button-text">Benchmarks</span>
          </button>
          <button className="function-button" onClick={() => navigate("/entrenamientos")}>
            <span className="button-icon">🏋️</span>
            <span className="button-text">Entrenamientos</span>
          </button>
          <button className="function-button" onClick={() => navigate("/wods-crossfit")}>
            <span className="button-icon">⚡</span>
            <span className="button-text">WODs CrossFit</span>
          </button>
          <button className="function-button" onClick={() => navigate("/plan-entrenamiento")}>
            <span className="button-icon">📋</span>
            <span className="button-text">Plan de Entrenamiento</span>
          </button>
          <button className="function-button" onClick={() => navigate("/analisis-videos")}>
            <span className="button-icon">🎥</span>
            <span className="button-text">Análisis de Videos IA</span>
          </button>
          <button className="function-button" onClick={() => navigate("/configuracion-ia")}>
            <span className="button-icon">⚙️</span>
            <span className="button-text">Configuración IA</span>
          </button>
        </div>
      </div>
    </>
  );
}
