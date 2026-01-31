const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');

// Configurar multer para subir fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profiles/';
    // Crear directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB máximo
  fileFilter: function (req, file, cb) {
    const filetypes = /jpeg|jpg|png/;
    const mimetype = filetypes.test(file.mimetype);
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    
    if (mimetype && extname) {
      return cb(null, true);
    }
    cb(new Error('Solo se permiten imágenes en formato PNG o JPG'));
  }
});

// Funciones de validación
const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validateUsername = (username) => /^[a-zA-Z0-9_-]{4,20}$/.test(username);

// GET - Obtener información del perfil del usuario
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username }).select('-password');

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    res.status(200).json({
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
    console.error('Error al obtener perfil:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// PUT - Actualizar información del perfil del usuario
router.put('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { email, newUsername, sex, age, weight, height, currentPassword, newPassword } = req.body;

    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validaciones de campos obligatorios
    if (email !== undefined && (!email || email.trim() === '')) {
      return res.status(400).json({ message: 'El email no puede estar vacío' });
    }

    if (newUsername !== undefined && (!newUsername || newUsername.trim() === '')) {
      return res.status(400).json({ message: 'El nombre de usuario no puede estar vacío' });
    }

    // Validaciones de campos opcionales (solo si se proporcionan)
    if (email && !validateEmail(email)) {
      return res.status(400).json({ message: 'Email inválido' });
    }

    if (newUsername && !validateUsername(newUsername)) {
      return res.status(400).json({ message: 'Username inválido (4-20 caracteres, solo letras, números, guiones y guiones bajos)' });
    }

    if (sex && !['masculino', 'femenino', 'N/D'].includes(sex)) {
      return res.status(400).json({ message: 'Sexo inválido. Debe ser: masculino, femenino o N/D' });
    }

    if (age !== undefined && age !== null && age !== '' && (age < 0 || age > 150)) {
      return res.status(400).json({ message: 'Edad inválida' });
    }

    if (weight !== undefined && weight !== null && weight !== '' && (weight < 0 || weight > 500)) {
      return res.status(400).json({ message: 'Peso inválido' });
    }

    if (height !== undefined && height !== null && height !== '' && (height < 0 || height > 300)) {
      return res.status(400).json({ message: 'Altura inválida' });
    }

    // Verificar si el email o username ya existen (si se están cambiando)
    if (email && email !== user.email) {
      const emailExists = await User.findOne({ email });
      if (emailExists) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
      user.email = email;
    }

    if (newUsername && newUsername !== user.username) {
      const usernameExists = await User.findOne({ username: newUsername });
      if (usernameExists) {
        return res.status(400).json({ message: 'El username ya está en uso' });
      }
      user.username = newUsername;
    }

    // Cambio de contraseña (requiere contraseña actual)
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Debe proporcionar la contraseña actual para cambiarla' });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Contraseña actual incorrecta' });
      }

      if (!/^[\S]{8,64}$/.test(newPassword)) {
        return res.status(400).json({ message: 'La nueva contraseña debe tener entre 8 y 64 caracteres' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    // Actualizar otros campos (permitir valores vacíos para campos opcionales)
    if (sex !== undefined) user.sex = sex || 'N/D';
    
    // Para campos numéricos: si son null, undefined o '', eliminar el campo del documento
    // Usamos set con undefined para eliminar el campo en Mongoose
    if (age !== undefined) {
      if (age === null || age === '' || isNaN(age)) {
        user.set('age', undefined);
      } else {
        user.age = Number(age);
      }
    }
    
    if (weight !== undefined) {
      if (weight === null || weight === '' || isNaN(weight)) {
        user.set('weight', undefined);
      } else {
        user.weight = Number(weight);
      }
    }
    
    if (height !== undefined) {
      if (height === null || height === '' || isNaN(height)) {
        user.set('height', undefined);
      } else {
        user.height = Number(height);
      }
    }

    await user.save();

    res.status(200).json({
      message: 'Perfil actualizado con éxito',
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
    console.error('Error al actualizar perfil:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// POST - Subir foto de perfil
router.post('/:username/photo', (req, res, next) => {
  upload.single('profilePhoto')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      // Error de Multer
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'La imagen es demasiado grande. Tamaño máximo: 5MB' });
      }
      return res.status(400).json({ message: `Error al subir archivo: ${err.message}` });
    } else if (err) {
      // Error personalizado (tipo de archivo)
      return res.status(400).json({ message: err.message });
    }
    // Sin errores, continuar con el controlador
    next();
  });
}, async (req, res) => {
  try {
    const { username } = req.params;

    if (!req.file) {
      return res.status(400).json({ message: 'No se ha proporcionado ninguna imagen' });
    }

    const user = await User.findOne({ username });

    if (!user) {
      // Eliminar el archivo subido si el usuario no existe
      fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Eliminar la foto anterior si existe
    if (user.profilePhoto) {
      const oldPhotoPath = path.join(__dirname, '..', user.profilePhoto);
      if (fs.existsSync(oldPhotoPath)) {
        fs.unlinkSync(oldPhotoPath);
      }
    }

    // Guardar la ruta relativa de la nueva foto
    user.profilePhoto = req.file.path.replace(/\\/g, '/');
    await user.save();

    res.status(200).json({
      message: 'Foto de perfil actualizada con éxito',
      profilePhoto: user.profilePhoto
    });

  } catch (err) {
    console.error('Error al subir foto de perfil:', err);
    // Eliminar el archivo si hubo un error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// DELETE - Eliminar cuenta de usuario
router.delete('/:username', async (req, res) => {
  try {
    const { username } = req.params;
    const { password } = req.body;

    // Validar que se proporciona la contraseña
    if (!password || password.trim() === '') {
      return res.status(400).json({ message: 'Debe proporcionar su contraseña para eliminar la cuenta' });
    }

    // Buscar el usuario
    const user = await User.findOne({ username });

    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar la contraseña
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Contraseña incorrecta' });
    }

    // Eliminar la foto de perfil si existe
    if (user.profilePhoto) {
      const photoPath = path.join(__dirname, '..', user.profilePhoto);
      if (fs.existsSync(photoPath)) {
        try {
          fs.unlinkSync(photoPath);
        } catch (err) {
          console.error('Error al eliminar foto de perfil:', err);
          // Continuar con la eliminación aunque falle borrar la foto
        }
      }
    }

    // Eliminar el usuario de la base de datos
    await User.deleteOne({ username });

    res.status(200).json({ 
      message: 'Cuenta eliminada permanentemente',
      success: true 
    });

  } catch (err) {
    console.error('Error al eliminar cuenta:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
