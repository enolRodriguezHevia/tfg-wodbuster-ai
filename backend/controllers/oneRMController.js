const OneRM = require('../models/OneRM');
const { validateOneRMData } = require('../validators/oneRMValidator');
const { buscarUsuario, manejarErrorServidor, validarDatos } = require('../utils/controllerHelpers');

/**
 * Registra un nuevo record de 1RM para un ejercicio
 * @param {Object} req - Objeto de petición con username, nombreEjercicio, peso y fecha opcional
 * @param {Object} res - Objeto de respuesta
 */
const registrarOneRM = async (req, res) => {
  try {
    const { username, nombreEjercicio, peso, fecha } = req.body;

    // Validaciones
    const validation = validateOneRMData({ username, nombreEjercicio, peso });
    if (!validarDatos(validation, res)) return;

    // Buscar el usuario
    const user = await buscarUsuario(username, res);
    if (!user) return;

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
    manejarErrorServidor(res, err, 'al registrar 1RM');
  }
};

/**
 * Obtiene el historial de 1RM de un usuario para un ejercicio específico
 * @param {Object} req - Objeto de petición con username y ejercicio en params
 * @param {Object} res - Objeto de respuesta
 */
const obtenerHistorialPorEjercicio = async (req, res) => {
  try {
    const { username, ejercicio } = req.params;

    // Buscar el usuario
    const user = await buscarUsuario(username, res);
    if (!user) return;

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
    manejarErrorServidor(res, err, 'al obtener historial de 1RM');
  }
};

/**
 * Obtiene la lista de ejercicios únicos con 1RM de un usuario
 * @param {Object} req - Objeto de petición con username en params
 * @param {Object} res - Objeto de respuesta
 */
const obtenerListaEjercicios = async (req, res) => {
  try {
    const { username } = req.params;

    // Buscar el usuario
    const user = await buscarUsuario(username, res);
    if (!user) return;

    // Obtener lista de ejercicios únicos
    const ejercicios = await OneRM.distinct('nombreEjercicio', { userId: user._id });

    res.status(200).json({
      ejercicios: ejercicios.sort()
    });

  } catch (err) {
    manejarErrorServidor(res, err, 'al obtener lista de ejercicios');
  }
};

/**
 * Obtiene todos los registros de 1RM de un usuario
 * @param {Object} req - Objeto de petición con username en params
 * @param {Object} res - Objeto de respuesta
 */
const obtenerTodosLosRegistros = async (req, res) => {
  try {
    const { username } = req.params;

    // Buscar el usuario
    const user = await buscarUsuario(username, res);
    if (!user) return;

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
    manejarErrorServidor(res, err, 'al obtener registros de 1RM');
  }
};

/**
 * Elimina un registro de 1RM
 * @param {Object} req - Objeto de petición con id en params
 * @param {Object} res - Objeto de respuesta
 */
const eliminarOneRM = async (req, res) => {
  try {
    const { id } = req.params;

    const oneRM = await OneRM.findByIdAndDelete(id);

    if (!oneRM) {
      return res.status(404).json({ message: 'Registro no encontrado' });
    }

    res.status(200).json({ message: 'Registro eliminado con éxito' });

  } catch (err) {
    manejarErrorServidor(res, err, 'al eliminar registro de 1RM');
  }
};

module.exports = {
  registrarOneRM,
  obtenerHistorialPorEjercicio,
  obtenerListaEjercicios,
  obtenerTodosLosRegistros,
  eliminarOneRM
};
