const AnalisisVideo = require("../models/AnalisisVideo");
const User = require("../models/User");
const { generarFeedbackEjercicio } = require("../services/llmService");
const { validarEjercicioConHeuristica } = require("../utils/ejercicioValidator");

/**
 * Analizar un video de ejercicio con IA (LLM) - con streaming SSE
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

    // VALIDACIÓN: Verificar que el ejercicio del video coincide con el seleccionado
    const validacion = validarEjercicioConHeuristica(
      ejercicio,
      framesClaveParsed,
      metricasParsed,
      framesData
    );

    if (!validacion.valido) {
      return res.status(400).json({
        message: "El movimiento detectado no coincide con el ejercicio seleccionado",
        ejercicioSeleccionado: ejercicio,
        posibleEjercicio: validacion.sugerencia,
        razon: validacion.razon
      });
    }

    // Obtener preferencia de LLM del usuario
    const user = await User.findById(userId).select('llmPreference');
    const llmPreference = user?.llmPreference || 'claude';

    // Configurar SSE (Server-Sent Events)
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    let feedbackCompleto = '';
    let tokensUsados = 0;
    let usaIA = false;
    let modeloUsado = null;
    let proveedorUsado = null;
    let huboFallback = false;
    
    // Validar que tenemos los datos mínimos necesarios
    const tieneFramesNecesarios = ejercicio === 'press-hombros' ? (framesData && framesClaveParsed) : framesClaveParsed;
    
    if (tieneFramesNecesarios && (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY)) {      
      try {
        // Callback para enviar chunks al cliente
        const onChunk = (chunk) => {
          feedbackCompleto += chunk;
          res.write(`data: ${JSON.stringify({ type: 'chunk', content: chunk })}\n\n`);
        };

        const llmResponse = await generarFeedbackEjercicio(
          ejercicio,
          framesData,
          framesClaveParsed,
          metricasParsed,
          llmPreference,
          onChunk
        );
        
        if (llmResponse.success) {
          tokensUsados = llmResponse.tokensUsados;
          modeloUsado = llmResponse.modelo;
          proveedorUsado = llmResponse.provider;
          huboFallback = llmResponse.fallback || false;
          usaIA = true;
        } else {
          feedbackCompleto = llmResponse.feedback;
        }
      } catch (llmErr) {
        feedbackCompleto = resultadoAnalisis.feedback || [
          "⚠️ Análisis completado sin IA.",
          "El sistema detectó tu movimiento pero no pudo generar un análisis detallado.",
          "Por favor, intenta de nuevo o contacta con soporte."
        ];
      }
    } else {
      feedbackCompleto = resultadoAnalisis.feedback || [
        "❌ No se pudo analizar el video completamente.",
        "Por favor, verifica que el video muestre correctamente la ejecución del ejercicio."
      ];
    }

    // Asegurar que siempre tengamos un feedback válido
    const feedbackFinal = feedbackCompleto || [
      "❌ No se pudo generar análisis para este video.",
      "Por favor, verifica que el video muestre correctamente la ejecución del ejercicio."
    ];

    // Guardar análisis en la base de datos
    const analisis = new AnalisisVideo({
      usuario: userId,
      ejercicio: ejercicio,
      videoUrl: null,
      esCorrecta: true,
      angulos: resultadoAnalisis.angulos || {},
      rompioParalelo: resultadoAnalisis.rompioParalelo !== undefined ? resultadoAnalisis.rompioParalelo : null,
      feedback: feedbackFinal,
      coordenadas: resultadoAnalisis.coordenadas || {},
    });

    await analisis.save();

    // Enviar evento final con metadata
    res.write(`data: ${JSON.stringify({ 
      type: 'done',
      analisisId: analisis._id,
      ejercicio: analisis.ejercicio,
      esCorrecta: analisis.esCorrecta,
      angulos: analisis.angulos,
      rompioParalelo: analisis.rompioParalelo,
      fechaAnalisis: analisis.fechaAnalisis,
      usaIA: usaIA,
      tokensUsados: tokensUsados,
      metadata: {
        modelo: modeloUsado,
        provider: proveedorUsado,
        usadoFallback: huboFallback
      }
    })}\n\n`);
    
    res.end();

  } catch (err) {
    // Si ya se enviaron headers SSE, enviar error por SSE
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ 
        type: 'error', 
        message: 'Error al procesar el video',
        error: err.message 
      })}\n\n`);
      res.end();
    } else {
      res.status(500).json({ 
        message: "Error al procesar el video",
        error: err.message 
      });
    }
  }
};