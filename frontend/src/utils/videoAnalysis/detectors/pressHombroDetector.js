import { initializePoseLandmarker } from '../config/mediaPipeConfig.js';
import { calcularAngulo } from '../core/geometryUtils.js';
import { generarImagenConLandmarks } from '../core/visualizationUtils.js';
import { prepararVideo, crearCanvas, procesarFrames, generarRespuestaError } from '../core/videoProcessor.js';

/**
 * Procesar un frame de press de hombros
 */
function procesarFramePressHombro(landmarks, tiempo, frameIndex) {
  const codoIzq = landmarks[13];
  const munecaIzq = landmarks[15];
  const hombroIzq = landmarks[11];
  const caderaIzq = landmarks[23];
  const tobilloIzq = landmarks[27];
  
  const codoDer = landmarks[14];
  const munecaDer = landmarks[16];
  const hombroDer = landmarks[12];
  const caderaDer = landmarks[24];
  const tobilloDer = landmarks[28];
  
  const visibilidadIzq = Math.abs(codoIzq.z - munecaIzq.z);
  const visibilidadDer = Math.abs(codoDer.z - munecaDer.z);
  
  let codo, muneca, hombro, cadera, tobillo;
  if (visibilidadIzq < visibilidadDer) {
    codo = codoIzq;
    muneca = munecaIzq;
    hombro = hombroIzq;
    cadera = caderaIzq;
    tobillo = tobilloIzq;
  } else {
    codo = codoDer;
    muneca = munecaDer;
    hombro = hombroDer;
    cadera = caderaDer;
    tobillo = tobilloDer;
  }
  
  const anguloCodo = calcularAngulo(hombro, codo, muneca);
  const deltaX = Math.abs(hombro.x - cadera.x);
  const deltaY = Math.abs(hombro.y - cadera.y);
  const anguloTorso = Math.atan2(deltaY, deltaX) * 180 / Math.PI;
  const anguloAlineacion = calcularAngulo(tobillo, cadera, hombro);
  
  const esFrameValido = anguloCodo >= 30 && anguloCodo <= 180;
  
  if (!esFrameValido) {
    return null;
  }
  
  return {
    tiempo,
    frameIndex,
    anguloCodo,
    anguloTorso,
    anguloAlineacion,
    posicionMuneca: muneca.y,
    posicionCodo: codo.y,
    posicionHombro: hombro.y,
    posicionCadera: cadera.y,
    posicionTobillo: tobillo.y,
    posicionXMuneca: muneca.x
  };
}

/**
 * Detectar repeticiones de press de hombros
 */
function detectarRepeticionesPressHombro(frames) {
  if (frames.length < 10) {
    console.log('⚠️ Muy pocos frames para análisis:', frames.length);
    return [];
  }
  
  const posicionesMuneca = frames.map(f => f.posicionMuneca);
  const minMunecaY = Math.min(...posicionesMuneca);
  const maxMunecaY = Math.max(...posicionesMuneca);
  
  const frameLockout = frames.find(f => f.posicionMuneca === minMunecaY);
  const indiceLockout = frames.indexOf(frameLockout);
  
  const framesAnteriores = frames.slice(0, indiceLockout);
  
  if (framesAnteriores.length === 0) {
    return [];
  }
  
  const maxMunecaYAntes = Math.max(...framesAnteriores.map(f => f.posicionMuneca));
  const frameInicio = framesAnteriores.find(f => f.posicionMuneca === maxMunecaYAntes);
  
  const amplitudMuneca = frameInicio.posicionMuneca - frameLockout.posicionMuneca;
  const desviacionX = Math.abs(frameInicio.posicionXMuneca - frameLockout.posicionXMuneca);
  
  return [{
    numero: 1,
    frameInicio,
    frameLockout,
    amplitud: amplitudMuneca,
    desviacionX,
    tiempoInicio: frameInicio.tiempo,
    tiempoLockout: frameLockout.tiempo,
    duracion: Math.abs(frameLockout.tiempo - frameInicio.tiempo)
  }];
}

/**
 * Analizar resultados de press de hombros
 */
async function analizarResultadosPressHombro(frames, landmarksFrames, duracion, video, canvas, ctx) {
  if (frames.length === 0) {
    return {
      ...generarRespuestaError(duracion, 'pose'),
      imagenLockout: null
    };
  }
  
  const repeticiones = detectarRepeticionesPressHombro(frames);
  
  if (repeticiones.length === 0) {
    return {
      ...generarRespuestaError(duracion, 'repeticiones'),
      imagenLockout: null
    };
  }
  
  const primeraRep = repeticiones[0];
  const frameInicio = primeraRep.frameInicio;
  const frameLockout = primeraRep.frameLockout;
  
  let imagenLockout = null;
  try {
    const lockoutIdx = frameLockout.frameIndex;
    if (lockoutIdx !== undefined && lockoutIdx < landmarksFrames.length && landmarksFrames[lockoutIdx]) {
      const frameData = landmarksFrames[lockoutIdx];
      imagenLockout = await generarImagenConLandmarks(video, frameData, ctx, canvas, 'LOCKOUT');
    }
  } catch (error) {
    console.error("⚠️ Error al generar imágenes visualizadas:", error);
  }
  
  const cambioTorso = frameLockout.anguloTorso - frameInicio.anguloTorso;
  
  return {
    imagenLockout,
    detallesPrimeraRep: {
      inicio: {
        tiempo: frameInicio.tiempo.toFixed(2),
        anguloCodo: frameInicio.anguloCodo.toFixed(1),
        anguloTorso: frameInicio.anguloTorso.toFixed(1),
        anguloAlineacion: frameInicio.anguloAlineacion.toFixed(1)
      },
      lockout: {
        tiempo: frameLockout.tiempo.toFixed(2),
        anguloCodo: frameLockout.anguloCodo.toFixed(1),
        anguloTorso: frameLockout.anguloTorso.toFixed(1),
        anguloAlineacion: frameLockout.anguloAlineacion.toFixed(1)
      }
    },
    framesCompletos: frames.map((frame, idx) => ({
      frameIndex: idx,
      tiempo: frame.tiempo,
      anguloCodo: frame.anguloCodo,
      anguloTorso: frame.anguloTorso,
      anguloAlineacion: frame.anguloAlineacion,
      posicionMuneca: frame.posicionMuneca,
      posicionCodo: frame.posicionCodo
    })),
    framesClave: {
      inicio: {
        indice: frameInicio.frameIndex,
        tiempo: frameInicio.tiempo,
        anguloCodo: frameInicio.anguloCodo,
        anguloTorso: frameInicio.anguloTorso,
        anguloAlineacion: frameInicio.anguloAlineacion,
        posicionMuneca: frameInicio.posicionMuneca
      },
      peak: {
        indice: frameLockout.frameIndex,
        tiempo: frameLockout.tiempo,
        anguloCodo: frameLockout.anguloCodo,
        anguloTorso: frameLockout.anguloTorso,
        anguloAlineacion: frameLockout.anguloAlineacion,
        posicionMuneca: frameLockout.posicionMuneca
      }
    }
  };
}

/**
 * Analizar video de press de hombros
 */
export async function analizarPressHombroVideo(videoFile) {
  try {
    console.log("🎬 Iniciando análisis de press de hombros...");
    
    const detector = await initializePoseLandmarker();
    const video = await prepararVideo(videoFile);
    const { canvas, ctx } = crearCanvas(video);
    
    const { resultadosFrames, landmarksFrames, duracion } = await procesarFrames(
      video,
      detector,
      procesarFramePressHombro,
      30,
      300
    );
    
    console.log(`✅ Analizados ${resultadosFrames.length} frames`);
    
    const resultado = await analizarResultadosPressHombro(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    URL.revokeObjectURL(video.src);
    
    return resultado;
  } catch (error) {
    console.error("❌ Error en análisis de press de hombros:", error);
    throw error;
  }
}
