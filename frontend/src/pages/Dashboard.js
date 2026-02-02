import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const [userPhoto, setUserPhoto] = useState(null);

  useEffect(() => {
    // Obtener la foto del usuario del localStorage
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.profilePhoto) {
      setUserPhoto(user.profilePhoto);
    }
  }, []);

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
          {/* Aquí se añadirán más botones de funcionalidades */}
        </div>
      </div>
    </>
  );
}
