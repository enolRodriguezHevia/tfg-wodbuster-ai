/**
 * Servicio de análisis de video - Backend
 * Nota: El análisis real se hace en el frontend con MediaPipe
 * Este archivo solo mantiene funciones auxiliares
 */

/**
 * Calcular ángulo entre tres puntos
 * Esta función se mantiene por si se necesita análisis en el backend en el futuro
 */
function calcularAngulo(punto1, punto2, punto3) {
  const radianes = Math.atan2(punto3.y - punto2.y, punto3.x - punto2.x) -
                   Math.atan2(punto1.y - punto2.y, punto1.x - punto2.x);
  let angulo = Math.abs(radianes * 180.0 / Math.PI);
  
  if (angulo > 180.0) {
    angulo = 360 - angulo;
  }
  
  return Math.round(angulo * 10) / 10;
}

module.exports = {
  calcularAngulo
};
