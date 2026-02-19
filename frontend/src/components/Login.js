import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: "",
    password: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const data = await loginUser(formData);

      console.log("DEBUG: Login data recibida:", data); // Mensaje de depuración
      setMessage("¡Login exitoso! ✅");

      // Guardar token y usuario por separado en localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir a /dashboard
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

      setFormData({ username: "", password: "" });
    } catch (error) {
      // Mensaje genérico para el usuario
      setMessage("Usuario o contraseña incorrectos ❌");

      // Mensaje de depuración visible solo en la consola
      console.error("DEBUG: Error en login:", error);
    }
  };

  return (
    <div className="auth-page">
      {/* Panel izquierdo de branding */}
      <div className="auth-branding">
        <div className="auth-branding-content">
          <div className="auth-logo">
            <img src={process.env.PUBLIC_URL + '/logo-nobg.png'} alt="WodBuster AI" />
          </div>
          <h1 className="auth-brand-title">WodBuster AI</h1>
          <p className="auth-brand-subtitle">Tu compañero de entrenamiento inteligente</p>
          <div className="auth-brand-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">🏋️</span>
              <span>Registra tus entrenamientos</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🤖</span>
              <span>Planes personalizados con IA</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📊</span>
              <span>Analiza tu progreso</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🎯</span>
              <span>Análisis de vídeo en tiempo real</span>
            </div>
          </div>
        </div>
        <div className="auth-branding-decoration">
          <div className="auth-circle auth-circle-1"></div>
          <div className="auth-circle auth-circle-2"></div>
          <div className="auth-circle auth-circle-3"></div>
        </div>
      </div>

      {/* Panel derecho del formulario */}
      <div className="auth-form-panel">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Bienvenido de nuevo</h2>
            <p>Introduce tus credenciales para acceder</p>
          </div>

          {message && (
            <div className={`auth-message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-form-group">
              <label htmlFor="username">Usuario</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input
                  id="username"
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="Tu nombre de usuario"
                  required
                />
              </div>
            </div>
            <div className="auth-form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input
                  id="password"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Tu contraseña"
                  required
                />
              </div>
            </div>
            <button type="submit" className="auth-submit-btn">
              Iniciar sesión
              <span className="auth-btn-arrow">→</span>
            </button>
          </form>

          <p className="auth-switch-text">
            ¿No tienes cuenta?{" "}
            <span className="auth-switch-link" onClick={() => navigate("/signup")}>
              Regístrate aquí
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
