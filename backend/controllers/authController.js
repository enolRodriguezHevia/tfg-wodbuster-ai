const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { validateEmail, validateUsername, validatePassword } = require('../validators/authValidator');

/**
 * Registra un nuevo usuario en el sistema
 * @param {Object} req - Objeto de petición con email, username, password y datos opcionales
 * @param {Object} res - Objeto de respuesta
 */
const signup = async (req, res) => {
  try {
    const { email, username, password, sex, age, weight, height } = req.body;

    // Validaciones
    if (!validateEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }
    
    if (!validateUsername(username)) {
      return res.status(400).json({ message: 'Username inválido' });
    }
    
    if (!validatePassword(password)) {
      return res.status(400).json({ message: 'Contraseña inválida' });
    }

    // Verificar si el email o username ya existen
    const emailExists = await User.findOne({ email });
    if (emailExists) {
      return res.status(400).json({ message: 'Email ya registrado' });
    }

    const usernameExists = await User.findOne({ username });
    if (usernameExists) {
      return res.status(400).json({ message: 'Username ya registrado' });
    }

    // Hash de la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Crear nuevo usuario
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
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Autentica un usuario existente
 * @param {Object} req - Objeto de petición con username y password
 * @param {Object} res - Objeto de respuesta
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Validar datos de entrada
    if (!username || !password) {
      // ...log de depuración eliminado...
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    // Buscar usuario
    const user = await User.findOne({ username });
    if (!user) {
      // ...log de depuración eliminado...
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    // Verificar contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      // ...log de depuración eliminado...
      return res.status(400).json({ message: "Usuario o contraseña incorrectos" });
    }

    // ...log de depuración eliminado...

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id, username: user.username, email: user.email },
      process.env.JWT_SECRET || "secretkey",
      { expiresIn: "7d" }
    );

    // Responder con datos del usuario (sin contraseña) y token
    res.status(200).json({
      message: "Login exitoso ✅",
      token: token,
      user: {
        username: user.username,
        email: user.email,
        sex: user.sex,
        age: user.age,
        weight: user.weight,
        height: user.height,
        profilePhoto: user.profilePhoto
      }
    });

  } catch (err) {
    res.status(500).json({ message: "Error del servidor" });
  }
};

module.exports = {
  signup,
  login
};
