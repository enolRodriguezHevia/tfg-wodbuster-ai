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

  // Rutas de las imágenes de fondo
  const backgroundImages = {
    benchmarks: `${process.env.PUBLIC_URL}/images/dashboard/benchmarks.png`,
    entrenamientos: `${process.env.PUBLIC_URL}/images/dashboard/entrenamientos.png`,
    wods: `${process.env.PUBLIC_URL}/images/dashboard/wods.png`,
    plan: `${process.env.PUBLIC_URL}/images/dashboard/plan.png`,
    analisis: `${process.env.PUBLIC_URL}/images/dashboard/analisis.png`,
    configuracion: `${process.env.PUBLIC_URL}/images/dashboard/configuracion.png`
  };

  return (
    <>
      <Navbar />
      <div className="dashboard-container">
        <div className="dashboard-welcome">
          <h1 className="welcome-title">¿Qué quieres entrenar hoy?</h1>
          <p className="welcome-subtitle">Elige tu objetivo y comienza a mejorar</p>
        </div>
        <div className="functionality-buttons">
          <button 
            className="function-button profile-button" 
            onClick={() => navigate("/profile")}
            style={userPhoto ? {
              backgroundImage: `url(${userPhoto.startsWith('http') ? userPhoto : userPhoto})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            } : {}}
          >
            <span className="button-text">Mi Perfil</span>
          </button>
          <button 
            className="function-button" 
            onClick={() => navigate("/benchmarks")}
            style={{ backgroundImage: `url(${backgroundImages.benchmarks})` }}
          >
            <span className="button-text">Benchmarks</span>
          </button>
          <button 
            className="function-button" 
            onClick={() => navigate("/entrenamientos")}
            style={{ backgroundImage: `url(${backgroundImages.entrenamientos})` }}
          >
            <span className="button-text">Entrenamientos</span>
          </button>
          <button 
            className="function-button" 
            onClick={() => navigate("/wods-crossfit")}
            style={{ backgroundImage: `url(${backgroundImages.wods})` }}
          >
            <span className="button-text">WODs CrossFit</span>
          </button>
          <button 
            className="function-button" 
            onClick={() => navigate("/plan-entrenamiento")}
            style={{ backgroundImage: `url(${backgroundImages.plan})` }}
          >
            <span className="button-text">Plan de Entrenamiento</span>
          </button>
          <button 
            className="function-button" 
            onClick={() => navigate("/analisis-videos")}
            style={{ 
              backgroundImage: `url(${backgroundImages.analisis})`,
              backgroundPosition: 'center 20%'
            }}
          >
            <span className="button-text">Análisis de Videos IA</span>
          </button>
          <button 
            className="function-button" 
            onClick={() => navigate("/configuracion-ia")}
            style={{ backgroundImage: `url(${backgroundImages.configuracion})` }}
          >
            <span className="button-text">Configuración IA</span>
          </button>
        </div>
      </div>
    </>
  );
}
