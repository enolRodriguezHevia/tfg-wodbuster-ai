import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signUpUser, loginUser } from "../api/api"; // módulo externo para llamadas al backend

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

      // Guardar usuario en localStorage
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
    <div style={{ maxWidth: "400px", margin: "0 auto", padding: "1rem", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h2>Registro de Usuario</h2>
      {message && <p>{message}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Email:</label>
          <input type="email" name="email" value={formData.email} onChange={handleChange} required />
        </div>
        <div>
          <label>Username:</label>
          <input type="text" name="username" value={formData.username} onChange={handleChange} required />
        </div>
        <div>
          <label>Contraseña:</label>
          <input type="password" name="password" value={formData.password} onChange={handleChange} required />
        </div>
        <div>
          <label>Sexo:</label>
          <select name="sex" value={formData.sex} onChange={handleChange}>
            <option value="masculino">Masculino</option>
            <option value="femenino">Femenino</option>
            <option value="N/D">N/D</option>
          </select>
        </div>
        <div>
          <label>Edad:</label>
          <input type="number" name="age" value={formData.age} onChange={handleChange} min="0" />
        </div>
        <div>
          <label>Peso (kg):</label>
          <input type="number" name="weight" value={formData.weight} onChange={handleChange} min="0" />
        </div>
        <div>
          <label>Altura (cm):</label>
          <input type="number" name="height" value={formData.height} onChange={handleChange} min="0" />
        </div>
        <button type="submit" style={{ marginTop: "1rem" }}>Registrarse</button>
      </form>
    </div>
  );
}
