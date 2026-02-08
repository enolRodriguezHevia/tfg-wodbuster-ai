const AnalisisVideo = require("../models/AnalisisVideo");
const mongoose = require("mongoose");
const fs = require("fs").promises;
const path = require("path");

/**
 * Analizar un video de ejercicio
 */
exports.analizarVideo = async (req, res) => {
  try {
    const { ejercicio, analisisResultado } = req.body;
    const videoFile = req.file;
    const userId = req.user.id;

    // Validar que se subió un archivo
    if (!videoFile) {
      return res.status(400).json({ message: "No se ha subido ningún video" });
    }

    // Validar ejercicio
    const ejerciciosValidos = ["sentadilla", "press-hombros", "peso-muerto", "flexiones", "dominadas"];
    if (!ejercicio || !ejerciciosValidos.includes(ejercicio)) {
      // Eliminar archivo subido si la validación falla
      await fs.unlink(videoFile.path);
      return res.status(400).json({ message: "Ejercicio no válido" });
    }

    console.log(`Recibiendo análisis del ejercicio: ${ejercicio}`);

    // Parsear resultado del análisis desde el frontend
    let resultadoAnalisis;
    if (analisisResultado) {
      resultadoAnalisis = JSON.parse(analisisResultado);
    } else {
      return res.status(400).json({ message: "No se recibió el resultado del análisis" });
    }

    // Guardar análisis en la base de datos
    const analisis = new AnalisisVideo({
      usuario: userId,
      ejercicio: ejercicio,
      videoUrl: videoFile.path,
      esCorrecta: resultadoAnalisis.esCorrecta,
      angulos: resultadoAnalisis.angulos,
      rompioParalelo: resultadoAnalisis.rompioParalelo,
      feedback: resultadoAnalisis.feedback,
      coordenadas: resultadoAnalisis.coordenadas || {},
      duracion: resultadoAnalisis.duracion,
      repeticionesDetectadas: resultadoAnalisis.repeticionesDetectadas,
    });

    await analisis.save();

    // Responder con el resultado (sin las coordenadas completas para reducir tamaño)
    res.status(200).json({
      id: analisis._id,
      ejercicio: analisis.ejercicio,
      esCorrecta: analisis.esCorrecta,
      angulos: analisis.angulos,
      rompioParalelo: analisis.rompioParalelo,
      feedback: analisis.feedback,
      duracion: analisis.duracion,
      repeticionesDetectadas: analisis.repeticionesDetectadas,
      fechaAnalisis: analisis.fechaAnalisis,
    });

  } catch (err) {
    console.error("Error al analizar video:", err);
    
    // Eliminar archivo si existe
    if (req.file) {
      try {
        await fs.unlink(req.file.path);
      } catch (unlinkErr) {
        console.error("Error al eliminar archivo:", unlinkErr);
      }
    }

    res.status(500).json({ 
      message: "Error al procesar el video",
      error: err.message 
    });
  }
};

/**
 * Obtener historial de análisis del usuario
 */
exports.obtenerHistorial = async (req, res) => {
  try {
    const userId = req.user.id;
    const { ejercicio, limite = 10, pagina = 1 } = req.query;

    const filtro = { usuario: userId };
    if (ejercicio) {
      filtro.ejercicio = ejercicio;
    }

    const skip = (pagina - 1) * limite;

    const analisis = await AnalisisVideo.find(filtro)
      .sort({ fechaAnalisis: -1 })
      .limit(parseInt(limite))
      .skip(skip)
      .select("-coordenadas -videoUrl"); // No enviar datos pesados

    const total = await AnalisisVideo.countDocuments(filtro);

    res.status(200).json({
      analisis,
      total,
      pagina: parseInt(pagina),
      totalPaginas: Math.ceil(total / limite),
    });

  } catch (err) {
    console.error("Error al obtener historial:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};

/**
 * Obtener detalles de un análisis específico
 */
exports.obtenerAnalisisDetalle = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analisis = await AnalisisVideo.findOne({
      _id: id,
      usuario: userId,
    });

    if (!analisis) {
      return res.status(404).json({ message: "Análisis no encontrado" });
    }

    res.status(200).json(analisis);

  } catch (err) {
    console.error("Error al obtener detalle:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};

/**
 * Eliminar un análisis
 */
exports.eliminarAnalisis = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const analisis = await AnalisisVideo.findOne({
      _id: id,
      usuario: userId,
    });

    if (!analisis) {
      return res.status(404).json({ message: "Análisis no encontrado" });
    }

    // Eliminar archivo de video
    try {
      await fs.unlink(analisis.videoUrl);
    } catch (err) {
      console.error("Error al eliminar archivo de video:", err);
    }

    await AnalisisVideo.deleteOne({ _id: id });

    res.status(200).json({ message: "Análisis eliminado correctamente" });

  } catch (err) {
    console.error("Error al eliminar análisis:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};

/**
 * Obtener estadísticas de análisis del usuario
 */
exports.obtenerEstadisticas = async (req, res) => {
  try {
    const userId = req.user.id;

    const estadisticas = await AnalisisVideo.aggregate([
      { $match: { usuario: new mongoose.Types.ObjectId(userId) } },
      {
        $group: {
          _id: "$ejercicio",
          totalAnalisis: { $sum: 1 },
          correctos: {
            $sum: { $cond: ["$esCorrecta", 1, 0] }
          },
          incorrectos: {
            $sum: { $cond: ["$esCorrecta", 0, 1] }
          },
        }
      },
      {
        $project: {
          ejercicio: "$_id",
          totalAnalisis: 1,
          correctos: 1,
          incorrectos: 1,
          porcentajeCorrectos: {
            $multiply: [
              { $divide: ["$correctos", "$totalAnalisis"] },
              100
            ]
          }
        }
      }
    ]);

    const totalGeneral = await AnalisisVideo.countDocuments({ usuario: userId });
    const totalCorrectos = await AnalisisVideo.countDocuments({ 
      usuario: userId, 
      esCorrecta: true 
    });

    res.status(200).json({
      porEjercicio: estadisticas,
      general: {
        total: totalGeneral,
        correctos: totalCorrectos,
        incorrectos: totalGeneral - totalCorrectos,
        porcentajeCorrectos: totalGeneral > 0 
          ? (totalCorrectos / totalGeneral * 100).toFixed(2)
          : 0
      }
    });

  } catch (err) {
    console.error("Error al obtener estadísticas:", err);
    res.status(500).json({ message: "Error del servidor" });
  }
};
