import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser, loginUser } from "../api/api";
import "./Signup.css";

export default function SignUp() {  const navigate = useNavigate();  const [formData, setFormData] = useState({
    email: "",
    username: "",
    password: "",
    sex: "N/D",
    age: "",
    weight: "",
    height: ""
  });

  const [message, setMessage] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Convertir age, weight y height a números
      const payload = {
        ...formData,
        age: formData.age ? Number(formData.age) : undefined,
        weight: formData.weight ? Number(formData.weight) : undefined,
        height: formData.height ? Number(formData.height) : undefined
      };

      // Registrar usuario
      await signUpUser(payload);
      setMessage("Usuario registrado correctamente ✅");
      
      // Auto-login después del registro
      const loginResponse = await loginUser({
        username: formData.username,
        password: formData.password
      });

      // Guardar token y usuario por separado en localStorage
      localStorage.setItem("token", loginResponse.token);
      localStorage.setItem("user", JSON.stringify(loginResponse.user));

      // Redirigir a /dashboard después de 1 segundo
      setTimeout(() => {
        navigate("/dashboard");
      }, 1000);

    } catch (error) {
      setMessage(`Error: ${error.message} ❌`);
    }
  };

  return (
    <div className="auth-page">
      {/* Panel izquierdo: branding */}
      <div className="auth-branding">
        <div className="auth-branding-content">
          <div className="auth-logo">
            <img src={process.env.PUBLIC_URL + '/logo-nobg.png'} alt="WodBuster AI" />
          </div>
          <h1 className="auth-brand-title">WodBuster AI</h1>
          <p className="auth-brand-subtitle">Empieza tu viaje hacia el máximo rendimiento</p>
          <div className="auth-brand-features">
            <div className="auth-feature">
              <span className="auth-feature-icon">🚀</span>
              <span>Crea tu perfil de atleta</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🤖</span>
              <span>IA personalizada a tus datos</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">📈</span>
              <span>Seguimiento de tu progreso</span>
            </div>
            <div className="auth-feature">
              <span className="auth-feature-icon">🎯</span>
              <span>Análisis de técnica con vídeo</span>
            </div>
          </div>
        </div>
        <div className="auth-branding-decoration">
          <div className="auth-circle auth-circle-1"></div>
          <div className="auth-circle auth-circle-2"></div>
          <div className="auth-circle auth-circle-3"></div>
        </div>
      </div>

      {/* Panel derecho: formulario */}
      <div className="auth-form-panel auth-form-panel--signup">
        <div className="auth-form-wrapper">
          <div className="auth-form-header">
            <h2>Crear cuenta</h2>
            <p>Rellena tus datos para comenzar</p>
          </div>

          {message && (
            <div className={`auth-message ${message.includes('✅') ? 'success' : 'error'}`}>
              {message}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            {/* Campos obligatorios */}
            <div className="auth-form-group">
              <label>Email</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">✉️</span>
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" required />
              </div>
            </div>
            <div className="auth-form-group">
              <label>Usuario</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">👤</span>
                <input type="text" name="username" value={formData.username} onChange={handleChange} placeholder="Nombre de usuario" required />
              </div>
            </div>
            <div className="auth-form-group">
              <label>Contraseña</label>
              <div className="auth-input-wrapper">
                <span className="auth-input-icon">🔒</span>
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Mínimo 6 caracteres" required />
              </div>
            </div>

            {/* Campos opcionales */}
            <div className="auth-optional-section">
              <span className="auth-optional-label">Datos opcionales</span>
            </div>
            <div className="auth-grid-2">
              <div className="auth-form-group">
                <label>Sexo</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">⚧</span>
                  <select name="sex" value={formData.sex} onChange={handleChange}>
                    <option value="masculino">Masculino</option>
                    <option value="femenino">Femenino</option>
                    <option value="N/D">N/D</option>
                  </select>
                </div>
              </div>
              <div className="auth-form-group">
                <label>Edad</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">📅</span>
                  <input type="number" name="age" value={formData.age} onChange={handleChange} placeholder="Años" min="0" />
                </div>
              </div>
              <div className="auth-form-group">
                <label>Peso (kg)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">⚖️</span>
                  <input type="number" name="weight" value={formData.weight} onChange={handleChange} placeholder="kg" min="0" />
                </div>
              </div>
              <div className="auth-form-group">
                <label>Altura (cm)</label>
                <div className="auth-input-wrapper">
                  <span className="auth-input-icon">📏</span>
                  <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="cm" min="0" />
                </div>
              </div>
            </div>

            <button type="submit" className="auth-submit-btn">
              Crear cuenta
              <span className="auth-btn-arrow">→</span>
            </button>
          </form>

          <p className="auth-switch-text">
            ¿Ya tienes cuenta?{" "}
            <span className="auth-switch-link" onClick={() => navigate("/login")}>
              Inicia sesión aquí
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}
