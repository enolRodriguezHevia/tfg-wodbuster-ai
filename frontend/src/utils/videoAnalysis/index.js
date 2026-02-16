/**
 * API pública para análisis de video
 * Módulo modularizado para análisis de ejercicios con MediaPipe
 */

// Exportar funciones de análisis por ejercicio
export { analizarSentadillaVideo } from './detectors/sentadillaDetector.js';
export { analizarPressHombroVideo } from './detectors/pressHombroDetector.js';
export { analizarRemoBarraVideo } from './detectors/remoBarraDetector.js';
export { analizarPesoMuertoVideo } from './detectors/pesoMuertoDetector.js';

// Exportar configuración de MediaPipe (por si se necesita acceso directo)
export { initializePoseLandmarker } from './config/mediaPipeConfig.js';

// Exportar utilidades geométricas (por si se necesitan externamente)
export { calcularAngulo, calcularAnguloFlexionCadera } from './core/geometryUtils.js';
