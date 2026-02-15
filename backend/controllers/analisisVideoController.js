const AnalisisVideo = require("../models/AnalisisVideo");
const mongoose = require("mongoose");
const { generarFeedbackEjercicio } = require("../services/llmService");

/**
 * Analizar un video de ejercicio con IA (LLM)
 */
exports.analizarVideo = async (req, res) => {
  try {
    const { ejercicio, analisisResultado, frames, framesClave, metricas } = req.body;
    const videoFile = req.file;
    const userId = req.user.id;

    // Validar que se subió un archivo
    if (!videoFile) {
      return res.status(400).json({ message: "No se ha subido ningún video" });
    }

    // Validar ejercicio
    const ejerciciosValidos = ["sentadilla", "press-hombros", "peso-muerto", "remo-barra", "flexiones", "dominadas"];
    if (!ejercicio || !ejerciciosValidos.includes(ejercicio)) {
      return res.status(400).json({ message: "Ejercicio no válido" });
    }

    console.log(`🎬 Recibiendo análisis del ejercicio: ${ejercicio}`);

    // Parsear datos del análisis
    let resultadoAnalisis, framesData, framesClaveParsed, metricasParsed;
    
    try {
      if (analisisResultado) resultadoAnalisis = JSON.parse(analisisResultado);
      if (frames) framesData = JSON.parse(frames);
      if (framesClave) framesClaveParsed = JSON.parse(framesClave);
      if (metricas) metricasParsed = JSON.parse(metricas);
    } catch (parseErr) {
      return res.status(400).json({ message: "Error al parsear datos del análisis" });
    }

    if (!resultadoAnalisis) {
      return res.status(400).json({ message: "No se recibió el resultado del análisis" });
    }

    // NUEVA FUNCIONALIDAD: Generar feedback con LLM si hay datos disponibles
    let feedbackLLM = null;
    let tokensUsados = 0;
    let usaIA = false;
    
    if (framesData && framesClaveParsed && process.env.OPENAI_API_KEY) {
      console.log(`🤖 Generando feedback con IA para ${ejercicio}...`);
      
      try {
        const llmResponse = await generarFeedbackEjercicio(
          ejercicio,
          framesData,
          framesClaveParsed,
          metricasParsed
        );
        
        if (llmResponse.success) {
          feedbackLLM = llmResponse.feedback;
          tokensUsados = llmResponse.tokensUsados;
          usaIA = true;
          console.log(`✅ Feedback IA generado exitosamente (${tokensUsados} tokens)`);
        } else {
          console.log(`⚠️ Fallback a feedback básico: ${llmResponse.error}`);
          feedbackLLM = llmResponse.feedback;
        }
      } catch (llmErr) {
        console.error(`❌ Error al generar feedback con IA: ${llmErr.message}`);
        // En caso de error de IA, usar feedback del frontend como fallback
        feedbackLLM = resultadoAnalisis.feedback;
      }
    } else {
      // Si faltan datos de IA, usar el feedback del análisis del frontend
      const missingItems = [];
      if (!framesData) missingItems.push('frames');
      if (!framesClaveParsed) missingItems.push('framesClave');
      if (!process.env.OPENAI_API_KEY) missingItems.push('OPENAI_API_KEY');
      
      console.log(`⚠️ Análisis sin IA - faltan: ${missingItems.join(', ')}`);
      feedbackLLM = resultadoAnalisis.feedback || [
        "❌ No se pudo analizar el video completamente.",
        "Por favor, verifica que el video muestre correctamente la ejecución del ejercicio."
      ];
    }

    // El feedback puede venir del LLM o del análisis básico
    const feedbackFinal = feedbackLLM;

    // Guardar análisis en la base de datos (sin guardar el video)
    const analisis = new AnalisisVideo({
      usuario: userId,
      ejercicio: ejercicio,
      videoUrl: null, // No guardamos videos físicamente
      esCorrecta: true, // Valor por defecto - el LLM ya no clasifica
      angulos: resultadoAnalisis.angulos || {},
      rompioParalelo: resultadoAnalisis.rompioParalelo !== undefined ? resultadoAnalisis.rompioParalelo : null,
      feedback: feedbackFinal,
      coordenadas: resultadoAnalisis.coordenadas || {},
      duracion: resultadoAnalisis.duracion,
      repeticionesDetectadas: resultadoAnalisis.repeticionesDetectadas,
    });

    await analisis.save();

    // Responder con el resultado
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
      usaIA: usaIA,
      tokensUsados: tokensUsados
    });

  } catch (err) {
    console.error("❌ Error al analizar video:", err);

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

    // No hay archivos físicos que eliminar
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
