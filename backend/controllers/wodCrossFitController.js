const WodCrossFit = require('../models/WodCrossFit');
const User = require('../models/User');
const { validateWodData } = require('../validators/wodCrossFitValidator');

/**
 * Registra un nuevo WOD CrossFit
 * @param {Object} req - Objeto de petición con username, nombreWod, nivel, tiempo, fecha opcional y notas
 * @param {Object} res - Objeto de respuesta
 */
const registrarWod = async (req, res) => {
  try {
    const { username, nombreWod, nivel, tiempo, fecha, notas } = req.body;

    // Validaciones
    const validation = validateWodData({ username, nombreWod, nivel, tiempo });
    if (!validation.valid) {
      return res.status(400).json({ message: validation.error });
    }

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
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
};

/**
 * Obtiene todos los WODs CrossFit de un usuario
 * @param {Object} req - Objeto de petición con username en params
 * @param {Object} res - Objeto de respuesta
 */
const obtenerWods = async (req, res) => {
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
};

/**
 * Elimina un WOD CrossFit por ID
 * @param {Object} req - Objeto de petición con id en params
 * @param {Object} res - Objeto de respuesta
 */
const eliminarWod = async (req, res) => {
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
};

module.exports = {
  registrarWod,
  obtenerWods,
  eliminarWod
};
