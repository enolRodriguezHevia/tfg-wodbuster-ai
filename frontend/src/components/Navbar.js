import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    closeMenu();
    navigate("/");
  };

  const goToProfile = () => {
    closeMenu();
    navigate("/profile");
  };

  const goToDashboard = () => {
    closeMenu();
    navigate("/dashboard");
  };

  const goToBenchmarks = () => {
    closeMenu();
    navigate("/benchmarks");
  };

  const goToWodsCrossFit = () => {
    closeMenu();
    navigate("/wods-crossfit");
  };

  const goToPlanEntrenamiento = () => {
    closeMenu();
    navigate("/plan-entrenamiento");
  };

  const goToAnalisisVideos = () => {
    closeMenu();
    navigate("/analisis-videos");
  };

  const goToEntrenamientos = () => {
    closeMenu();
    navigate("/entrenamientos");
  };

  const goToConfiguracionIA = () => {
    closeMenu();
    navigate("/configuracion-ia");
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <div className="navbar-brand" onClick={goToDashboard} style={{ cursor: 'pointer' }}>
          <img src={process.env.PUBLIC_URL + '/logo-nobg.png'} alt="WodBuster AI" className="navbar-logo" />
        </div>

        {/* Botón hamburguesa para móviles */}
        <button 
          className={`hamburger-btn ${isMenuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Menú de navegación"
          aria-expanded={isMenuOpen}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Menú desktop */}
        <div className="navbar-links desktop-menu">
          <button className="navbar-link-btn" onClick={goToProfile}>
            Perfil
          </button>
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
            Análisis de Videos IA
          </button>
          <button className="navbar-link-btn" onClick={goToConfiguracionIA}>
            Configuración IA
          </button>
          <button className="navbar-logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Overlay para cerrar el menú al hacer clic fuera */}
      {isMenuOpen && (
        <div className="menu-overlay" onClick={closeMenu}></div>
      )}

      {/* Menú lateral para móviles */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <img src={process.env.PUBLIC_URL + '/logo-nobg.png'} alt="WodBuster AI" className="mobile-menu-logo" />
          <button className="close-menu-btn" onClick={closeMenu} aria-label="Cerrar menú">
            ✕
          </button>
        </div>
        <div className="mobile-menu-links">
          <button className="mobile-link-btn" onClick={goToProfile}>
            Perfil
          </button>
          <button className="mobile-link-btn" onClick={goToBenchmarks}>
            Benchmarks
          </button>
          <button className="mobile-link-btn" onClick={goToEntrenamientos}>
            Entrenamientos
          </button>
          <button className="mobile-link-btn" onClick={goToWodsCrossFit}>
            WODs CrossFit
          </button>
          <button className="mobile-link-btn" onClick={goToPlanEntrenamiento}>
            Plan de Entrenamiento
          </button>
          <button className="mobile-link-btn" onClick={goToAnalisisVideos}>
            Análisis de Videos IA
          </button>
          <button className="mobile-link-btn" onClick={goToConfiguracionIA}>
            Configuración IA
          </button>
          <button className="mobile-logout-btn" onClick={handleLogout}>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </nav>
  );
}
