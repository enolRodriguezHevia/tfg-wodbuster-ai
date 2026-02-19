import { initializePoseLandmarker } from '../config/mediaPipeConfig.js';
import { calcularAngulo } from '../core/geometryUtils.js';
import { generarImagenConLandmarks } from '../core/visualizationUtils.js';
import { prepararVideo, crearCanvas, procesarFrames, generarRespuestaError } from '../core/videoProcessor.js';

/**
 * Procesar un frame de peso muerto
 */
function procesarFramePesoMuerto(landmarks, tiempo, frameIndex) {
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
  
  const anguloRodilla = calcularAngulo(cadera, rodilla, tobillo);
  const anguloCadera = calcularAngulo(hombro, cadera, rodilla);
  const anguloAlineacion = calcularAngulo(tobillo, cadera, hombro);
  const posicionCadera = cadera.y;
  
  const deltaX = Math.abs(hombro.x - cadera.x);
  const deltaY = hombro.y - cadera.y;
  
  let anguloTorso;
  if (deltaY < 0) {
    anguloTorso = Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
  } else {
    anguloTorso = -Math.atan2(Math.abs(deltaY), deltaX) * 180 / Math.PI;
  }
  
  const esFrameValido = anguloRodilla >= 20 && anguloRodilla <= 180 &&
                        anguloCadera >= 20 && anguloCadera <= 180;
  
  if (!esFrameValido) {
    return null;
  }
  
  return {
    tiempo,
    frameIndex,
    posicionCadera,
    anguloRodilla,
    anguloCadera,
    anguloTorso,
    anguloAlineacion,
    posicionHombro: hombro.y,
    posicionRodilla: rodilla.y,
    posicionTobillo: tobillo.y
  };
}

/**
 * Detectar repeticiones de peso muerto
 */
function detectarRepeticionesPesoMuerto(frames) {
  if (frames.length < 10) {
    return [];
  }
  
  const posicionesCadera = frames.map(f => f.posicionCadera);
  const maxCaderaY = Math.max(...posicionesCadera);
  
  const frameInicio = frames.find(f => f.posicionCadera === maxCaderaY);
  const indiceInicio = frames.indexOf(frameInicio);
  
  const hombroMasBajoQueCadera = frameInicio.posicionHombro > frameInicio.posicionCadera;
  const anguloTorsoNegativo = frameInicio.anguloTorso < 0;
  const torsoMuyHorizontal = frameInicio.anguloTorso >= 0 && frameInicio.anguloTorso < 20;
  
  const framesPosteriores = frames.slice(indiceInicio + 1);
  
  if (framesPosteriores.length === 0) {
    return [];
  }
  
  const posicionesHombroPost = framesPosteriores.map(f => f.posicionHombro);
  const minHombroY = Math.min(...posicionesHombroPost);
  
  const frameLockout = framesPosteriores.find(f => f.posicionHombro === minHombroY);
  
  const amplitudCadera = frameInicio.posicionCadera - frameLockout.posicionCadera;
  const amplitudHombros = frameInicio.posicionHombro - frameLockout.posicionHombro;
  
  if (amplitudHombros < 0.02) {
    return [];
  }
  
  return [{
    numero: 1,
    frameInicio,
    frameLockout,
    amplitud: Math.max(amplitudCadera, amplitudHombros),
    tiempoInicio: frameInicio.tiempo,
    tiempoLockout: frameLockout.tiempo,
    duracion: Math.abs(frameLockout.tiempo - frameInicio.tiempo),
    alertasSeguridad: {
      hombroMasBajoQueCadera,
      anguloTorsoNegativo,
      torsoMuyHorizontal,
      anguloTorsoInicio: frameInicio.anguloTorso
    }
  }];
}

/**
 * Analizar resultados de peso muerto
 */
async function analizarResultadosPesoMuerto(frames, landmarksFrames, duracion, video, canvas, ctx) {
  if (frames.length === 0) {
    return {
      ...generarRespuestaError(duracion, 'pose'),
      imagenInicio: null,
      imagenLockout: null
    };
  }
  
  const repeticiones = detectarRepeticionesPesoMuerto(frames);
  
  if (repeticiones.length === 0) {
    return {
      ...generarRespuestaError(duracion, 'repeticiones'),
      imagenInicio: null,
      imagenLockout: null
    };
  }
  
  const primeraRep = repeticiones[0];
  const frameInicio = primeraRep.frameInicio;
  const frameLockout = primeraRep.frameLockout;
  
  let imagenInicio = null;
  let imagenLockout = null;
  
  try {
    const inicioIdx = frameInicio.frameIndex;
    if (inicioIdx !== undefined && inicioIdx < landmarksFrames.length && landmarksFrames[inicioIdx]) {
      const frameData = landmarksFrames[inicioIdx];
      imagenInicio = await generarImagenConLandmarks(video, frameData, ctx, canvas, 'INICIO');
    }
    
    const lockoutIdx = frameLockout.frameIndex;
    if (lockoutIdx !== undefined && lockoutIdx < landmarksFrames.length && landmarksFrames[lockoutIdx]) {
      const frameData = landmarksFrames[lockoutIdx];
      imagenLockout = await generarImagenConLandmarks(video, frameData, ctx, canvas, 'LOCKOUT');
    }
  } catch (error) {
    throw error
  }
  
  return {
    imagenInicio,
    imagenLockout,
    detallesPrimeraRep: {
      inicio: {
        tiempo: frameInicio.tiempo.toFixed(2),
        anguloRodilla: frameInicio.anguloRodilla.toFixed(1),
        anguloTorso: frameInicio.anguloTorso.toFixed(1)
      },
      lockout: {
        tiempo: frameLockout.tiempo.toFixed(2),
        anguloRodilla: frameLockout.anguloRodilla.toFixed(1),
        anguloTorso: frameLockout.anguloTorso.toFixed(1)
      }
    },
    framesClave: {
      inicio: {
        indice: frameInicio.frameIndex,
        tiempo: frameInicio.tiempo,
        anguloRodilla: frameInicio.anguloRodilla,
        anguloTorso: frameInicio.anguloTorso,
        anguloAlineacion: frameInicio.anguloAlineacion,
        caderaY: frameInicio.posicionCadera,
        hombroY: frameInicio.posicionHombro,
        alertasSeguridad: repeticiones[0].alertasSeguridad
      },
      peak: {
        indice: frameLockout.frameIndex,
        tiempo: frameLockout.tiempo,
        anguloRodilla: frameLockout.anguloRodilla,
        anguloTorso: frameLockout.anguloTorso,
        anguloAlineacion: frameLockout.anguloAlineacion,
        caderaY: frameLockout.posicionCadera,
        hombroY: frameLockout.posicionHombro
      }
    }
  };
}

/**
 * Analizar video de peso muerto
 */
export async function analizarPesoMuertoVideo(videoFile) {
  try {
    
    const detector = await initializePoseLandmarker();
    const video = await prepararVideo(videoFile);
    const { canvas, ctx } = crearCanvas(video);
    
    const { resultadosFrames, landmarksFrames, duracion } = await procesarFrames(
      video,
      detector,
      procesarFramePesoMuerto,
      30,
      300
    );
        
    const resultado = await analizarResultadosPesoMuerto(resultadosFrames, landmarksFrames, duracion, video, canvas, ctx);
    
    URL.revokeObjectURL(video.src);
    
    return resultado;
  } catch (error) {
    throw error;
  }
}
