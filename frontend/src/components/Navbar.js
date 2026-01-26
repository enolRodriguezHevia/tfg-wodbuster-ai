import React from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <nav className="navbar">
      <div className="navbar-content">
        <h2 className="navbar-title">WodBuster AI</h2>
        <button className="navbar-logout-btn" onClick={handleLogout}>
          Cerrar Sesión
        </button>
      </div>
    </nav>
  );
}
