import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
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

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h2 className="navbar-title" onClick={goToDashboard} style={{ cursor: 'pointer' }}>
          WodBuster AI
        </h2>
        <div className="navbar-links">
          <button className="navbar-link-btn" onClick={goToBenchmarks}>
            Benchmarks
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
