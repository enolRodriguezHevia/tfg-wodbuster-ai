import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/api"; // Módulo externo para las consultas

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

      // Guardar datos del usuario en localStorage
      localStorage.setItem("user", JSON.stringify(data.user));

      // Redirigir al perfil
      setTimeout(() => {
        navigate("/profile");
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
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Login</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Usuario:</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <button type="submit" style={{ marginTop: "1rem" }}>Entrar</button>
      </form>
    </div>
  );
}
