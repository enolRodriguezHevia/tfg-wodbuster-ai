const WodCrossFit = require('../models/WodCrossFit');
const { validateWodData } = require('../validators/wodCrossFitValidator');
const { buscarUsuario, manejarErrorServidor, validarDatos } = require('../utils/controllerHelpers');

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
    if (!validarDatos(validation, res)) return;

    // Buscar el usuario
    const user = await buscarUsuario(username, res);
    if (!user) return;

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
    manejarErrorServidor(res, err, 'al registrar WOD', true);
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
    const user = await buscarUsuario(username, res);
    if (!user) return;

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
    manejarErrorServidor(res, err, 'al obtener WODs');
  }
};

/**
 * Elimina un WOD CrossFit
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
    manejarErrorServidor(res, err, 'al eliminar WOD');
  }
};

module.exports = {
  registrarWod,
  obtenerWods,
  eliminarWod
};