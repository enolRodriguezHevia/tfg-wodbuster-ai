const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const User = require('../models/User');

// Funciones de validación
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username) => /^[a-zA-Z0-9_-]{4,20}$/.test(username);
const validatePassword = (password) => /^[\S]{8,64}$/.test(password);

router.post('/signup', async (req, res) => {
  try {
    const { email, username, password, sex, age, weight, height } = req.body;

    // Validaciones
    if (!validateEmail(email)) return res.status(400).json({ message: 'Email inválido' });
    if (!validateUsername(username)) return res.status(400).json({ message: 'Username inválido' });
    if (!validatePassword(password)) return res.status(400).json({ message: 'Contraseña inválida' });

    if (await User.findOne({ email })) return res.status(400).json({ message: 'Email ya registrado' });
    if (await User.findOne({ username })) return res.status(400).json({ message: 'Username ya registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      username,
      password: hashedPassword,
      sex: sex || 'N/D',
      age,
      weight,
      height
    });

    await newUser.save();
    res.status(201).json({ message: 'Usuario creado con éxito' });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      console.log("DEBUG: Datos incompletos enviados", req.body);
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    const user = await User.findOne({ username });

    if (!user) {
      console.log(`DEBUG: Usuario no encontrado: ${username}`);
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      console.log(`DEBUG: Contraseña incorrecta para usuario: ${username}`);
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    console.log(`DEBUG: Login exitoso para usuario: ${username}`);

    res.status(200).json({
      message: "Login exitoso ✅",
      user: {
        username: user.username,
        email: user.email,
        sex: user.sex,
        age: user.age,
        weight: user.weight,
        height: user.height
      }
    });

  } catch (err) {
    console.error("DEBUG: Error en login:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
});

module.exports = router;
