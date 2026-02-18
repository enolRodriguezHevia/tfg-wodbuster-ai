const AnalisisVideo = require("../models/AnalisisVideo");
const User = require("../models/User");
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

    // Obtener preferencia de LLM del usuario
    const user = await User.findById(userId).select('llmPreference');
    const llmPreference = user?.llmPreference || 'claude';
    console.log(`⚙️  Preferencia de LLM del usuario: ${llmPreference.toUpperCase()}`);

    // NUEVA FUNCIONALIDAD: Generar feedback con LLM si hay datos disponibles
    let feedbackLLM = null;
    let tokensUsados = 0;
    let usaIA = false;
    let modeloUsado = null;
    let proveedorUsado = null;
    let huboFallback = false;
    
    // Validar que tenemos los datos mínimos necesarios
    // framesClave es obligatorio para todos, frames solo para press-hombros
    const tieneFramesNecesarios = ejercicio === 'press-hombros' ? (framesData && framesClaveParsed) : framesClaveParsed;
    
    if (tieneFramesNecesarios && (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)) {
      console.log(`🤖 Generando feedback con IA para ${ejercicio}...`);
      
      try {
        const llmResponse = await generarFeedbackEjercicio(
          ejercicio,
          framesData,
          framesClaveParsed,
          metricasParsed,
          llmPreference
        );
        
        if (llmResponse.success) {
          feedbackLLM = llmResponse.feedback;
          tokensUsados = llmResponse.tokensUsados;
          modeloUsado = llmResponse.modelo;
          proveedorUsado = llmResponse.provider;
          huboFallback = llmResponse.fallback || false;
          usaIA = true;
          
          const mensajeFallback = huboFallback ? ` (fallback desde ${llmResponse.preferidoFallo?.toUpperCase()})` : '';
          console.log(`✅ Feedback IA generado exitosamente con ${proveedorUsado.toUpperCase()}${mensajeFallback} (${tokensUsados} tokens)`);
        } else {
          console.log(`⚠️ Fallback a feedback básico: ${llmResponse.error}`);
          feedbackLLM = llmResponse.feedback;
        }
      } catch (llmErr) {
        console.error(`❌ Error al generar feedback con IA: ${llmErr.message}`);
        // En caso de error de IA, usar feedback del frontend como fallback
        feedbackLLM = resultadoAnalisis.feedback || [
          "⚠️ Análisis completado sin IA.",
          "El sistema detectó tu movimiento pero no pudo generar un análisis detallado.",
          "Por favor, intenta de nuevo o contacta con soporte."
        ];
      }
    } else {
      // Si faltan datos de IA, usar el feedback del análisis del frontend
      const missingItems = [];
      if (!framesClaveParsed) missingItems.push('framesClave');
      if (ejercicio === 'press-hombros' && !framesData) missingItems.push('frames (requerido para press-hombros)');
      if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) missingItems.push('API_KEYS');
      
      if (missingItems.length > 0) {
        console.log(`⚠️ Análisis sin IA - faltan: ${missingItems.join(', ')}`);
      }
      feedbackLLM = resultadoAnalisis.feedback || [
        "❌ No se pudo analizar el video completamente.",
        "Por favor, verifica que el video muestre correctamente la ejecución del ejercicio."
      ];
    }

    // El feedback puede venir del LLM o del análisis básico
    // Asegurar que siempre tengamos un feedback válido
    const feedbackFinal = feedbackLLM || [
      "❌ No se pudo generar análisis para este video.",
      "Por favor, verifica que el video muestre correctamente la ejecución del ejercicio."
    ];

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
    });

    await analisis.save();

    // Responder con el resultado
    res.status(200).json({
      id: analisis._id,
      ejercicio: analisis.ejercicio,
      esCorrecta: analisis.esCorrecta,
      angulos: analisis.angulos,
      rompioParalelo: analisis.rompioParalelo,
      feedback: analisis.feedback !== undefined ? analisis.feedback : feedbackFinal,
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