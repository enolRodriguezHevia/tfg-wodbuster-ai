import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    navigate("/");
  };

  const goToProfile = () => {
    navigate("/profile");
  };

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const goToBenchmarks = () => {
    navigate("/benchmarks");
  };

  const goToWodsCrossFit = () => {
    navigate("/wods-crossfit");
  };

  const goToPlanEntrenamiento = () => {
    navigate("/plan-entrenamiento");
  };

  const goToAnalisisVideos = () => {
    navigate("/analisis-videos");
  };

  const goToEntrenamientos = () => {
    navigate("/entrenamientos");
  };

  const goToConfiguracionIA = () => {
    navigate("/configuracion-ia");
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand" onClick={goToDashboard} style={{ cursor: 'pointer' }}>
          <img src={process.env.PUBLIC_URL + '/logo-nobg.png'} alt="WodBuster AI" className="navbar-logo" />
        </div>
        <div className="navbar-links">
          <button className="navbar-link-btn" onClick={goToBenchmarks}>
            Benchmarks
          </button>
          <button className="navbar-link-btn" onClick={goToEntrenamientos}>
            Entrenamientos
          </button>
          <button className="navbar-link-btn" onClick={goToWodsCrossFit}>
            WODs CrossFit
          </button>
          <button className="navbar-link-btn" onClick={goToPlanEntrenamiento}>
            Plan de Entrenamiento
          </button>
          <button className="navbar-link-btn" onClick={goToAnalisisVideos}>
            Análisis de Videos
          </button>
          <button className="navbar-link-btn" onClick={goToConfiguracionIA}>
            Configuración IA
          </button>
          <button className="navbar-link-btn" onClick={goToProfile}>
            Perfil
          </button>
          <button className="navbar-logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
