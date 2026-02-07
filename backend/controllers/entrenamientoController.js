const Entrenamiento = require('../models/Entrenamiento');
const Ejercicio = require('../models/Ejercicio');
const User = require('../models/User');
const { validateEjercicios, calcularVolumenTotal, validateUsername } = require('../validators/entrenamientoValidator');

/**
 * Registra un nuevo entrenamiento con sus ejercicios
 * @param {Object} req - Objeto de petición con username, fecha y ejercicios
 * @param {Object} res - Objeto de respuesta
 */
const registrarEntrenamiento = async (req, res) => {
  try {
    const { username, fecha, ejercicios } = req.body;

    // Validar username
    if (!validateUsername(username)) {
      return res.status(400).json({ 
        message: 'Username es requerido' 
      });
    }

    // Validar ejercicios
    const ejerciciosValidation = validateEjercicios(ejercicios);
    if (!ejerciciosValidation.valid) {
      return res.status(400).json({ message: ejerciciosValidation.error });
    }

    // Buscar el usuario
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Calcular volumen total
    const volumenTotal = calcularVolumenTotal(ejercicios);

    // Crear el entrenamiento
    const nuevoEntrenamiento = new Entrenamiento({
      userId: user._id,
      fecha: fecha ? new Date(fecha) : new Date(),
      volumenTotal: volumenTotal
    });

    await nuevoEntrenamiento.save();

    // Crear los ejercicios en la tabla separada
    const ejerciciosCreados = await Ejercicio.insertMany(
      ejercicios.map(ej => ({
        userId: user._id,
        entrenamientoId: nuevoEntrenamiento._id,
        nombre: ej.nombre,
        series: ej.series,
        repeticiones: ej.repeticiones,
        peso: ej.peso,
        valoracion: ej.valoracion
      }))
    );

    res.status(201).json({
      message: 'Entrenamiento registrado con éxito',
      entrenamiento: {
        id: nuevoEntrenamiento._id,
        fecha: nuevoEntrenamiento.fecha,
        volumenTotal: nuevoEntrenamiento.volumenTotal,
        ejercicios: ejerciciosCreados.map(ej => ({
          id: ej._id,
          nombre: ej.nombre,
          series: ej.series,
          repeticiones: ej.repeticiones,
          peso: ej.peso,
          valoracion: ej.valoracion
        }))
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
};

/**
 * Obtiene todos los entrenamientos de un usuario
 * @param {Object} req - Objeto de petición con username en params
 * @param {Object} res - Objeto de respuesta
 */
const obtenerEntrenamientos = async (req, res) => {
  try {
    const { username } = req.params;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const entrenamientos = await Entrenamiento.find({ userId: user._id })
      .sort({ fecha: -1 }); // Más recientes primero

    // Obtener ejercicios para cada entrenamiento
    const entrenamientosConEjercicios = await Promise.all(
      entrenamientos.map(async (entrenamiento) => {
        const ejercicios = await Ejercicio.find({ entrenamientoId: entrenamiento._id });
        
        return {
          id: entrenamiento._id,
          fecha: entrenamiento.fecha,
          volumenTotal: entrenamiento.volumenTotal,
          ejercicios: ejercicios.map(ej => ({
            id: ej._id,
            nombre: ej.nombre,
            series: ej.series,
            repeticiones: ej.repeticiones,
            peso: ej.peso,
            valoracion: ej.valoracion
          })),
          cantidadEjercicios: ejercicios.length
        };
      })
    );

    res.status(200).json({
      entrenamientos: entrenamientosConEjercicios
    });

  } catch (err) {
    console.error('Error al obtener entrenamientos:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Obtiene un entrenamiento específico por ID
 * @param {Object} req - Objeto de petición con id en params
 * @param {Object} res - Objeto de respuesta
 */
const obtenerEntrenamientoPorId = async (req, res) => {
  try {
    const { id } = req.params;

    const entrenamiento = await Entrenamiento.findById(id);

    if (!entrenamiento) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    // Obtener los ejercicios de la tabla separada
    const ejercicios = await Ejercicio.find({ entrenamientoId: id });

    res.status(200).json({
      entrenamiento: {
        id: entrenamiento._id,
        fecha: entrenamiento.fecha,
        volumenTotal: entrenamiento.volumenTotal,
        ejercicios: ejercicios.map(ej => ({
          id: ej._id,
          nombre: ej.nombre,
          series: ej.series,
          repeticiones: ej.repeticiones,
          peso: ej.peso,
          valoracion: ej.valoracion
        }))
      }
    });

  } catch (err) {
    console.error('Error al obtener entrenamiento:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Elimina un entrenamiento y sus ejercicios asociados
 * @param {Object} req - Objeto de petición con id en params
 * @param {Object} res - Objeto de respuesta
 */
const eliminarEntrenamiento = async (req, res) => {
  try {
    const { id } = req.params;

    // Eliminar el entrenamiento
    const entrenamiento = await Entrenamiento.findByIdAndDelete(id);

    if (!entrenamiento) {
      return res.status(404).json({ message: 'Entrenamiento no encontrado' });
    }

    // Eliminar también todos los ejercicios asociados
    await Ejercicio.deleteMany({ entrenamientoId: id });

    res.status(200).json({ message: 'Entrenamiento y ejercicios eliminados con éxito' });

  } catch (err) {
    console.error('Error al eliminar entrenamiento:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

/**
 * Obtiene estadísticas de entrenamientos de un usuario
 * @param {Object} req - Objeto de petición con username en params
 * @param {Object} res - Objeto de respuesta
 */
const obtenerEstadisticas = async (req, res) => {
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
};

module.exports = {
  registrarEntrenamiento,
  obtenerEntrenamientos,
  obtenerEntrenamientoPorId,
  eliminarEntrenamiento,
  obtenerEstadisticas
};
