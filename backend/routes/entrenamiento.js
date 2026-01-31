const express = require('express');
const router = express.Router();
const Entrenamiento = require('../models/Entrenamiento');
const User = require('../models/User');

// POST - Registrar un nuevo entrenamiento
router.post('/', async (req, res) => {
  try {
    const { username, fecha, ejercicios } = req.body;

    // Validaciones básicas
    if (!username || !ejercicios || !Array.isArray(ejercicios) || ejercicios.length === 0) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: username y ejercicios (array) son requeridos' 
      });
    }

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar cada ejercicio
    for (let i = 0; i < ejercicios.length; i++) {
      const ej = ejercicios[i];
      
      if (!ej.nombre || typeof ej.nombre !== 'string' || !ej.nombre.trim()) {
        return res.status(400).json({ message: `Ejercicio ${i + 1}: El nombre es obligatorio` });
      }
      
      if (typeof ej.series !== 'number' || ej.series < 1) {
        return res.status(400).json({ message: `Ejercicio ${i + 1}: Las series deben ser al menos 1` });
      }
      
      if (typeof ej.repeticiones !== 'number' || ej.repeticiones < 1) {
        return res.status(400).json({ message: `Ejercicio ${i + 1}: Las repeticiones deben ser al menos 1` });
      }
      
      if (typeof ej.peso !== 'number' || ej.peso < 0) {
        return res.status(400).json({ message: `Ejercicio ${i + 1}: El peso debe ser 0 o mayor` });
      }
      
      if (typeof ej.valoracion !== 'number' || ej.valoracion < 1 || ej.valoracion > 10) {
        return res.status(400).json({ message: `Ejercicio ${i + 1}: La valoración debe estar entre 1 y 10` });
      }
    }

    // Crear el entrenamiento
    const nuevoEntrenamiento = new Entrenamiento({
      userId: user._id,
      fecha: fecha ? new Date(fecha) : new Date(),
      ejercicios: ejercicios.map(ej => ({
        nombre: ej.nombre,
        series: ej.series,
        repeticiones: ej.repeticiones,
        peso: ej.peso,
        valoracion: ej.valoracion
      }))
    });

    await nuevoEntrenamiento.save();

    res.status(201).json({
      message: 'Entrenamiento registrado con éxito',
      entrenamiento: {
        id: nuevoEntrenamiento._id,
        fecha: nuevoEntrenamiento.fecha,
        volumenTotal: nuevoEntrenamiento.volumenTotal,
        ejercicios: nuevoEntrenamiento.ejercicios
      }
    });

  } catch (err) {
    console.error('Error al registrar entrenamiento:', err);
    console.error('Stack trace:', err.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: err.message 
    });
  }
});

// GET - Obtener todos los entrenamientos de un usuario
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const entrenamientos = await Entrenamiento.find({ userId: user._id })
      .sort({ fecha: -1 }); // Más recientes primero

    res.status(200).json({
      entrenamientos: entrenamientos.map(e => ({
        id: e._id,
        fecha: e.fecha,
        volumenTotal: e.volumenTotal,
        ejercicios: e.ejercicios,
        cantidadEjercicios: e.ejercicios.length
      }))
    });

  } catch (err) {
    console.error('Error al obtener entrenamientos:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// GET - Obtener un entrenamiento específico por ID
router.get('/detalle/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const entrenamiento = await Entrenamiento.findById(id);

    if (!entrenamiento) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    res.status(200).json({
      entrenamiento: {
        id: entrenamiento._id,
        fecha: entrenamiento.fecha,
        volumenTotal: entrenamiento.volumenTotal,
        ejercicios: entrenamiento.ejercicios
      }
    });

  } catch (err) {
    console.error('Error al obtener entrenamiento:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// DELETE - Eliminar un entrenamiento
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const entrenamiento = await Entrenamiento.findByIdAndDelete(id);

    if (!entrenamiento) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    res.status(200).json({ message: 'Entrenamiento eliminado con éxito' });

  } catch (err) {
    console.error('Error al eliminar entrenamiento:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// GET - Estadísticas de entrenamientos
router.get('/:username/stats', async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const entrenamientos = await Entrenamiento.find({ userId: user._id });

    const stats = {
      totalEntrenamientos: entrenamientos.length,
      volumenTotalAcumulado: entrenamientos.reduce((total, e) => total + e.volumenTotal, 0),
      promedioVolumenPorEntrenamiento: entrenamientos.length > 0 
        ? entrenamientos.reduce((total, e) => total + e.volumenTotal, 0) / entrenamientos.length 
        : 0
    };

    res.status(200).json({ stats });

  } catch (err) {
    console.error('Error al obtener estadísticas:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
