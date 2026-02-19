import { initializePoseLandmarker } from '../config/mediaPipeConfig.js';
import { calcularAngulo } from '../core/geometryUtils.js';
import { generarImagenConLandmarks } from '../core/visualizationUtils.js';
import { prepararVideo, crearCanvas, procesarFrames, generarRespuestaError } from '../core/videoProcessor.js';

/**
 * Procesar un frame de remo con barra
 */
function procesarFrameRemoBarra(landmarks, tiempo, frameIndex) {
  const codoIzq = landmarks[13];
  const munecaIzq = landmarks[15];
  const hombroIzq = landmarks[11];
  const caderaIzq = landmarks[23];
  const rodillaIzq = landmarks[25];
  const tobilloIzq = landmarks[27];
  
  const codoDer = landmarks[14];
  const munecaDer = landmarks[16];
  const hombroDer = landmarks[12];
  const caderaDer = landmarks[24];
  const rodillaDer = landmarks[26];
  const tobilloDer = landmarks[28];
  
  const visibilidadIzq = Math.abs(codoIzq.z - munecaIzq.z);
  const visibilidadDer = Math.abs(codoDer.z - munecaDer.z);
  
  let codo, muneca, hombro, cadera, rodilla, tobillo;
  if (visibilidadIzq < visibilidadDer) {
    codo = codoIzq;
    muneca = munecaIzq;
    hombro = hombroIzq;
    cadera = caderaIzq;
    rodilla = rodillaIzq;
    tobillo = tobilloIzq;
  } else {
    codo = codoDer;
    muneca = munecaDer;
    hombro = hombroDer;
    cadera = caderaDer;
    rodilla = rodillaDer;
    tobillo = tobilloDer;
  }
  
  const anguloCodo = calcularAngulo(hombro, codo, muneca);
  
  const deltaX = Math.abs(hombro.x - cadera.x);
  const deltaY = hombro.y - cadera.y;
  
  let anguloTorso;
  if (deltaY < 0) {
    anguloTorso = Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
  } else {
    anguloTorso = -Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
  }
  
  const anguloRodilla = calcularAngulo(cadera, rodilla, tobillo);
  const anguloAlineacion = calcularAngulo(rodilla, cadera, hombro);
  
  const esFrameValido = anguloCodo >= 30 && anguloCodo <= 180;
  
  if (!esFrameValido) {
    return null;
  }
  
  return {
    tiempo,
    frameIndex,
    anguloCodo,
    anguloTorso,
    anguloRodilla,
    anguloAlineacion,
    posicionMuneca: muneca.y,
    posicionCodo: codo.y,
    posicionHombro: hombro.y,
    posicionCadera: cadera.y
  };
}

/**
 * Detectar repeticiones de remo con barra
 */
function detectarRepeticionesRemoBarra(frames) {
  if (frames.length < 10) {
    return [];
  }
  
  const posicionesMuneca = frames.map(f => f.posicionMuneca);
  const maxMunecaY = Math.max(...posicionesMuneca);
  
  const frameInicio = frames.find(f => f.posicionMuneca === maxMunecaY);
  const indiceInicio = frames.indexOf(frameInicio);
  
  const framesPosteriores = frames.slice(indiceInicio + 1);
  
  if (framesPosteriores.length === 0) {
    return [];
  }
  
  const minMunecaYDespues = Math.min(...framesPosteriores.map(f => f.posicionMuneca));
  const framePeak = framesPosteriores.find(f => f.posicionMuneca === minMunecaYDespues);
  
  const amplitudMuneca = frameInicio.posicionMuneca - framePeak.posicionMuneca;
  
  return [{
    numero: 1,
    frameInicio,
    framePeak,
    amplitud: amplitudMuneca,
    tiempoInicio: frameInicio.tiempo,
    tiempoPeak: framePeak.tiempo,
    duracion: Math.abs(framePeak.tiempo - frameInicio.tiempo)
  }];
}

/**
 * Analizar resultados de remo con barra
 */
async function analizarResultadosRemoBarra(frames, landmarksFrames, duracion, video, canvas, ctx) {
  if (frames.length === 0) {
    return {
      ...generarRespuestaError(duracion, 'pose'),
      imagenInicio: null,
      imagenPeak: null
    };
  }
  
  const repeticiones = detectarRepeticionesRemoBarra(frames);
  
  if (repeticiones.length === 0) {
    return {
      ...generarRespuestaError(duracion, 'repeticiones'),
      imagenInicio: null,
      imagenPeak: null
    };
  }
  
  const primeraRep = repeticiones[0];
  const frameInicio = primeraRep.frameInicio;
  const framePeak = primeraRep.framePeak;
  
  let imagenInicio = null;
  let imagenPeak = null;
  
  try {
    const inicioIdx = frameInicio.frameIndex;
    if (inicioIdx !== undefined && inicioIdx < landmarksFrames.length && landmarksFrames[inicioIdx]) {
      const frameData = landmarksFrames[inicioIdx];
      imagenInicio = await generarImagenConLandmarks(video, frameData, ctx, canvas, 'INICIO');
    }
    
    const peakIdx = framePeak.frameIndex;
    if (peakIdx !== undefined && peakIdx < landmarksFrames.length && landmarksFrames[peakIdx]) {
      const frameData = landmarksFrames[peakIdx];
      imagenPeak = await generarImagenConLandmarks(video, frameData, ctx, canvas, 'PEAK');
    }
  } catch (error) {
    throw error;
  }
  
  return {
    imagenInicio,
    imagenPeak,
    detallesPrimeraRep: {
      inicio: {
        tiempo: frameInicio.tiempo.toFixed(2),
        anguloCodo: frameInicio.anguloCodo.toFixed(1),
        anguloTorso: frameInicio.anguloTorso.toFixed(1),
        anguloAlineacion: frameInicio.anguloAlineacion.toFixed(1)
      },
      peak: {
        tiempo: framePeak.tiempo.toFixed(2),
        anguloCodo: framePeak.anguloCodo.toFixed(1),
        anguloTorso: framePeak.anguloTorso.toFixed(1),
        anguloAlineacion: framePeak.anguloAlineacion.toFixed(1)
      },
      amplitud: primeraRep.amplitud.toFixed(3)
    },
    framesClave: {
      inicio: {
        tiempo: parseFloat(frameInicio.tiempo),
        anguloCodo: parseFloat(frameInicio.anguloCodo),
        anguloTorso: parseFloat(frameInicio.anguloTorso),
        anguloAlineacion: parseFloat(frameInicio.anguloAlineacion)
      },
      peak: {
        tiempo: parseFloat(framePeak.tiempo),
        anguloCodo: parseFloat(framePeak.anguloCodo),
        anguloTorso: parseFloat(framePeak.anguloTorso),
        anguloAlineacion: parseFloat(framePeak.anguloAlineacion)
      }
    }
  };
}

/**
 * Analizar video de remo con barra
 */
export async function analizarRemoBarraVideo(videoFile) {
  try {
    
    const detector = await initializePoseLandmarker();
    const video = await prepararVideo(videoFile);
    const { canvas, ctx } = crearCanvas(video);
    
    const { resultadosFrames, landmarksFrames, duracion } = await procesarFrames(
      video,
      detector,
      procesarFrameRemoBarra,
      30,
      300
    );
        
    const resultado = await analizarResultadosRemoBarra(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    URL.revokeObjectURL(video.src);
    
    return resultado;
  } catch (error) {
    throw error;
  }
}
