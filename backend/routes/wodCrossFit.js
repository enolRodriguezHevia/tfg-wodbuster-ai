const express = require('express');
const router = express.Router();
const WodCrossFit = require('../models/WodCrossFit');
const User = require('../models/User');

// POST - Registrar un nuevo WOD CrossFit
router.post('/', async (req, res) => {
  try {
    const { username, nombreWod, nivel, tiempo, fecha, notas } = req.body;

    // Validaciones básicas
    if (!username || !nombreWod || !nivel || tiempo === undefined) {
      return res.status(400).json({ 
        message: 'Faltan campos obligatorios: username, nombreWod, nivel y tiempo son requeridos' 
      });
    }

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Validar nivel
    if (!['rx', 'intermedio', 'escalado'].includes(nivel)) {
      return res.status(400).json({ message: 'Nivel inválido. Debe ser: rx, intermedio o escalado' });
    }

    // Validar tiempo
    if (typeof tiempo !== 'number' || tiempo <= 0) {
      return res.status(400).json({ message: 'El tiempo debe ser un número positivo (en segundos)' });
    }

    // Crear el WOD
    const nuevoWod = new WodCrossFit({
      userId: user._id,
      nombreWod,
      nivel,
      tiempo,
      fecha: fecha ? new Date(fecha) : new Date(),
      notas: notas || ''
    });

    await nuevoWod.save();

    res.status(201).json({
      message: 'WOD registrado con éxito',
      wod: {
        id: nuevoWod._id,
        nombreWod: nuevoWod.nombreWod,
        nivel: nuevoWod.nivel,
        tiempo: nuevoWod.tiempo,
        fecha: nuevoWod.fecha,
        notas: nuevoWod.notas
      }
    });

  } catch (err) {
    console.error('Error al registrar WOD:', err);
    console.error('Stack trace:', err.stack);
    console.error('Request body:', req.body);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: err.message 
    });
  }
});

// GET - Obtener todos los WODs de un usuario
router.get('/:username', async (req, res) => {
  try {
    const { username } = req.params;

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Obtener todos los WODs del usuario, ordenados por fecha descendente
    const wods = await WodCrossFit.find({ userId: user._id })
      .sort({ fecha: -1 });

    const wodsFormateados = wods.map(wod => ({
      id: wod._id,
      nombreWod: wod.nombreWod,
      nivel: wod.nivel,
      tiempo: wod.tiempo,
      fecha: wod.fecha,
      notas: wod.notas,
      createdAt: wod.createdAt
    }));

    res.json({ 
      wods: wodsFormateados,
      total: wodsFormateados.length
    });

  } catch (err) {
    console.error('Error al obtener WODs:', err);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: err.message 
    });
  }
});

// DELETE - Eliminar un WOD por ID
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const wodEliminado = await WodCrossFit.findByIdAndDelete(id);

    if (!wodEliminado) {
      return res.status(404).json({ message: 'WOD no encontrado' });
    }

    res.json({ 
      message: 'WOD eliminado con éxito',
      wod: wodEliminado
    });

  } catch (err) {
    console.error('Error al eliminar WOD:', err);
    res.status(500).json({ 
      message: 'Error del servidor',
      error: err.message 
    });
  }
});

module.exports = router;
