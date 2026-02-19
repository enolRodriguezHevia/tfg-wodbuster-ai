import { initializePoseLandmarker } from '../config/mediaPipeConfig.js';
import { calcularAngulo, calcularAnguloFlexionCadera } from '../core/geometryUtils.js';
import { generarImagenConLandmarks } from '../core/visualizationUtils.js';
import { prepararVideo, crearCanvas, procesarFrames, generarRespuestaError } from '../core/videoProcessor.js';

/**
 * Procesar un frame de sentadilla
 */
function procesarFrameSentadilla(landmarks, tiempo, frameIndex) {
  // Usar el lado más visible
  const caderaIzq = landmarks[23];
  const rodillaIzq = landmarks[25];
  const tobilloIzq = landmarks[27];
  const hombroIzq = landmarks[11];
  
  const caderaDer = landmarks[24];
  const rodillaDer = landmarks[26];
  const tobilloDer = landmarks[28];
  const hombroDer = landmarks[12];
  
  const visibilidadIzq = Math.abs(caderaIzq.z - rodillaIzq.z);
  const visibilidadDer = Math.abs(caderaDer.z - rodillaDer.z);
  
  let cadera, rodilla, tobillo, hombro;
  if (visibilidadIzq < visibilidadDer) {
    cadera = caderaIzq;
    rodilla = rodillaIzq;
    tobillo = tobilloIzq;
    hombro = hombroIzq;
  } else {
    cadera = caderaDer;
    rodilla = rodillaDer;
    tobillo = tobilloDer;
    hombro = hombroDer;
  }
  
  // Calcular ángulos clave
  const anguloRodilla = calcularAngulo(cadera, rodilla, tobillo);
  const anguloAlineacion = calcularAnguloFlexionCadera(hombro, cadera, tobillo);
  const anguloFlexionCadera = calcularAnguloFlexionCadera(hombro, cadera, rodilla);
  const alturaRelativa = cadera.y - rodilla.y;
  
  const deltaX = Math.abs(hombro.x - cadera.x);
  const deltaY = Math.abs(hombro.y - cadera.y);
  const anguloTorso = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  
  // Validar que sea un frame válido
  const esFrameValido = anguloRodilla >= 30 && anguloRodilla <= 180 &&
                        anguloAlineacion >= 30 && anguloAlineacion <= 180;
  
  if (!esFrameValido) {
    return null;
  }
  
  return {
    tiempo,
    anguloRodilla,
    anguloAlineacion,
    anguloFlexionCadera,
    alturaRelativa,
    anguloTorso,
    posicionCadera: cadera.y,
    posicionRodilla: rodilla.y,
    frameIndex
  };
}

/**
 * Analizar resultados de sentadilla
 */
async function analizarResultadosSentadilla(frames, landmarksFrames, duracion, video, canvas, ctx) {
  if (frames.length === 0) {
    return {
      ...generarRespuestaError(duracion, 'pose'),
      angulos: {},
      imagenVisualizada: null,
      framesCompletos: [],
      framesClave: { inicio: null, peak: null },
      metricas: { rompioParalelo: false }
    };
  }
  
  // Filtrar frames válidos (rodilla entre 40° y 170°)
  const framesValidos = frames.filter(f => 
    f.anguloRodilla >= 40 && f.anguloRodilla <= 170
  );
  
  if (framesValidos.length === 0) {
    
    return {
      esCorrecta: false,
      angulos: {},
      feedback: [
        "❌ No se detectó una sentadilla válida en el video.",
        "📹 Posibles causas:",
        "• El video muestra solo la posición inicial/final (piernas casi rectas)",
        "• No incluye el descenso completo de la sentadilla",
        "• La grabación debe ser de PERFIL (lado) durante toda la ejecución",
        "• Asegúrate de grabar la sentadilla completa: bajada y subida"
      ],
      imagenVisualizada: null,
      framesCompletos: frames.map((frame, idx) => ({
        indice: idx,
        tiempo: frame.tiempo,
        anguloRodilla: frame.anguloRodilla,
        anguloTorso: frame.anguloTorso,
        anguloAlineacion: frame.anguloAlineacion,
        anguloFlexionCadera: frame.anguloFlexionCadera,
        alturaRelativa: frame.alturaRelativa,
        caderaY: frame.posicionCadera,
        rodillaY: frame.posicionRodilla
      })),
      framesClave: { inicio: null, peak: null },
      metricas: { 
        rompioParalelo: false,
        anguloRodillaMin: frames.length > 0 ? Math.min(...frames.map(f => f.anguloRodilla)) : 0
      }
    };
  }
  
  // Encontrar punto más bajo y más alto
  const posicionesCadera = framesValidos.map(f => f.posicionCadera);
  const posicionCaderaMax = Math.max(...posicionesCadera);
  const posicionCaderaMin = Math.min(...posicionesCadera);
  const frameMin = framesValidos.find(f => f.posicionCadera === posicionCaderaMax);
  const frameMax = framesValidos.find(f => f.posicionCadera === posicionCaderaMin);
  
  const anguloRodillaBaja = frameMin.anguloRodilla;
  const anguloAlineacionBaja = frameMin.anguloAlineacion;
  const anguloFlexionCaderaBaja = frameMin.anguloFlexionCadera;
  const alturaRelativaBaja = frameMin.alturaRelativa;
  
  const rompioParalelo = alturaRelativaBaja > -0.02;
    
  // Generar imagen visualizada
  let imagenVisualizada = null;
  try {
    if (frameMin && frameMin.frameIndex !== undefined && landmarksFrames[frameMin.frameIndex]) {
      const frameData = landmarksFrames[frameMin.frameIndex];
      imagenVisualizada = await generarImagenConLandmarks(video, frameData, ctx, canvas, 'PUNTO MÁS BAJO');
    }
  } catch (error) {
    throw error;
  }
  
  return {
    angulos: {
      rodilla: anguloRodillaBaja,
      alineacion: anguloAlineacionBaja,
      flexionCadera: anguloFlexionCaderaBaja
    },
    rompioParalelo,
    imagenVisualizada,
    framesCompletos: frames.map((frame, idx) => ({
      indice: idx,
      tiempo: frame.tiempo,
      anguloRodilla: frame.anguloRodilla,
      anguloTorso: frame.anguloTorso,
      anguloAlineacion: frame.anguloAlineacion,
      anguloFlexionCadera: frame.anguloFlexionCadera,
      alturaRelativa: frame.alturaRelativa,
      caderaY: frame.posicionCadera,
      rodillaY: frame.posicionRodilla
    })),
    framesClave: {
      inicio: frameMax ? {
        indice: frameMax.frameIndex,
        tiempo: frameMax.tiempo,
        anguloRodilla: frameMax.anguloRodilla,
        anguloTorso: frameMax.anguloTorso,
        anguloAlineacion: frameMax.anguloAlineacion,
        anguloFlexionCadera: frameMax.anguloFlexionCadera,
        caderaY: frameMax.posicionCadera,
        rodillaY: frameMax.posicionRodilla
      } : null,
      peak: frameMin ? {
        indice: frameMin.frameIndex,
        tiempo: frameMin.tiempo,
        anguloRodilla: frameMin.anguloRodilla,
        anguloTorso: frameMin.anguloTorso,
        anguloAlineacion: frameMin.anguloAlineacion,
        anguloFlexionCadera: frameMin.anguloFlexionCadera,
        caderaY: frameMin.posicionCadera,
        rodillaY: frameMin.posicionRodilla
      } : null
    },
    metricas: {
      rompioParalelo,
      anguloRodillaMin: anguloRodillaBaja,
      anguloAlineacionMin: anguloAlineacionBaja,
      anguloFlexionCaderaMin: anguloFlexionCaderaBaja,
      amplitudCadera: frameMax && frameMin ? Math.abs(frameMax.posicionCadera - frameMin.posicionCadera) : 0
    }
  };
}

/**
 * Analizar video de sentadilla
 */
export async function analizarSentadillaVideo(videoFile) {
  try {
    
    const detector = await initializePoseLandmarker();
    const video = await prepararVideo(videoFile);
    const { canvas, ctx } = crearCanvas(video);
    
    const { resultadosFrames, landmarksFrames, duracion } = await procesarFrames(
      video,
      detector,
      procesarFrameSentadilla,
      30,
      90
    );
        
    const resultado = await analizarResultadosSentadilla(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    URL.revokeObjectURL(video.src);
    
    return resultado;
  } catch (error) {
    throw error;
  }
}
