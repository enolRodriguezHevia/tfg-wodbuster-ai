import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css"; // Importamos el CSS externo

export default function Home() {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    // Verificar si hay un usuario logueado
    const user = localStorage.getItem("user");
    setIsLoggedIn(!!user);
  }, []);

  // Si está logueado, mostrar solo el botón de Perfil
  if (isLoggedIn) {
    return (
      <div className="home-logged-container">
        <button className="profile-main-button" onClick={() => navigate("/profile")}>
          Perfil
        </button>
      </div>
    );
  }

  // Si no está logueado, mostrar Login y Sign Up
  return (
    <div className="home-container">
      {/* Lado Login */}
      <div className="home-half login-side">
        <h2>Login</h2>
        <p>Accede a tu cuenta existente</p>
        <button onClick={() => navigate("/login")}>Ir a Login</button>
      </div>

      {/* Lado Sign Up */}
      <div className="home-half signup-side">
        <h2>Sign Up</h2>
        <p>Crea una cuenta nueva</p>
        <button onClick={() => navigate("/signup")}>Ir a Sign Up</button>
      </div>
    </div>
  );
}
