const express = require('express');
const router = express.Router();
const OneRM = require('../models/OneRM');
const User = require('../models/User');

// POST - Registrar un nuevo 1RM
router.post('/', async (req, res) => {
  try {
    const { username, nombreEjercicio, peso, fecha } = req.body;

    // Validaciones
    if (!username || !nombreEjercicio || !peso) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: username, nombreEjercicio y peso son requeridos' 
      });
    }

    if (typeof peso !== 'number' || peso <= 0) {
      return res.status(400).json({ message: 'El peso debe ser un número mayor que 0' });
    }

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Crear el registro de 1RM
    const newOneRM = new OneRM({
      userId: user._id,
      nombreEjercicio: nombreEjercicio.trim(),
      peso: peso,
      fecha: fecha ? new Date(fecha) : new Date()
    });

    await newOneRM.save();

    res.status(201).json({
      message: '1RM registrado con éxito',
      oneRM: {
        id: newOneRM._id,
        nombreEjercicio: newOneRM.nombreEjercicio,
        peso: newOneRM.peso,
        fecha: newOneRM.fecha
      }
    });

  } catch (err) {
    console.error('Error al registrar 1RM:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// GET - Obtener historial de 1RM de un usuario para un ejercicio específico
router.get('/:username/:ejercicio', async (req, res) => {
  try {
    const { username, ejercicio } = req.params;

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar todos los registros de 1RM para ese ejercicio ordenados por fecha
    const registros = await OneRM.find({
      userId: user._id,
      nombreEjercicio: ejercicio
    }).sort({ fecha: 1 }); // Orden ascendente por fecha

    res.status(200).json({
      ejercicio: ejercicio,
      registros: registros.map(r => ({
        id: r._id,
        peso: r.peso,
        fecha: r.fecha
      }))
    });

  } catch (err) {
    console.error('Error al obtener historial de 1RM:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// GET - Obtener todos los ejercicios únicos con 1RM de un usuario
router.get('/:username/ejercicios/lista', async (req, res) => {
  try {
    const { username } = req.params;

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener lista única de ejercicios
    const ejercicios = await OneRM.distinct('nombreEjercicio', { userId: user._id });

    res.status(200).json({
      ejercicios: ejercicios.sort()
    });

  } catch (err) {
    console.error('Error al obtener lista de ejercicios:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// GET - Obtener todos los registros de 1RM de un usuario
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Buscar todos los registros de 1RM del usuario
    const registros = await OneRM.find({ userId: user._id }).sort({ fecha: -1 });

    res.status(200).json({
      registros: registros.map(r => ({
        id: r._id,
        nombreEjercicio: r.nombreEjercicio,
        peso: r.peso,
        fecha: r.fecha
      }))
    });

  } catch (err) {
    console.error('Error al obtener registros de 1RM:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

// DELETE - Eliminar un registro de 1RM
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const oneRM = await OneRM.findByIdAndDelete(id);

    if (!oneRM) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    res.status(200).json({ message: 'Registro eliminado con éxito' });

  } catch (err) {
    console.error('Error al eliminar registro de 1RM:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
});

module.exports = router;
