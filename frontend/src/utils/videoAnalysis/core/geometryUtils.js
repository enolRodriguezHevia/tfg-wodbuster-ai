/**
 * Calcular ángulo entre tres puntos usando producto punto
 * punto2 es el vértice del ángulo
 */
export function calcularAngulo(punto1, punto2, punto3) {
  // Vectores desde punto2 (vértice)
  const v1 = {
    x: punto1.x - punto2.x,
    y: punto1.y - punto2.y
  };
  const v2 = {
    x: punto3.x - punto2.x,
    y: punto3.y - punto2.y
  };
  
  // Producto punto
  const dot = v1.x * v2.x + v1.y * v2.y;
  
  // Magnitudes
  const mag1 = Math.sqrt(v1.x * v1.x + v1.y * v1.y);
  const mag2 = Math.sqrt(v2.x * v2.x + v2.y * v2.y);
  
  // Evitar división por cero
  if (mag1 === 0 || mag2 === 0) return 0;
  
  // Ángulo en radianes (producto punto / producto de magnitudes)
  let cosAngle = dot / (mag1 * mag2);
  
  // Asegurar que esté en el rango [-1, 1] por errores de precisión
  cosAngle = Math.max(-1, Math.min(1, cosAngle));
  
  // Convertir a grados
  const angulo = Math.acos(cosAngle) * 180.0 / Math.PI;
  
  return Math.round(angulo * 10) / 10;
}

/**
 * Calcular ángulo de flexión de cadera para sentadilla usando vectores direccionales
 * Mide el ángulo entre el torso (cadera->hombro) y muslo (cadera->rodilla)
 * @param {Object} hombro - Punto del hombro
 * @param {Object} cadera - Punto de la cadera (vértice)
 * @param {Object} rodilla - Punto de la rodilla
 * @returns {number} Ángulo en grados (0-180°)
 */
export function calcularAnguloFlexionCadera(hombro, cadera, rodilla) {
  // Vector del torso: cadera -> hombro (hacia arriba)
  const vectorTorso = {
    x: hombro.x - cadera.x,
    y: hombro.y - cadera.y  // En MediaPipe: Y negativo = hacia arriba
  };
  
  // Vector del muslo: cadera -> rodilla (hacia abajo)
  const vectorMuslo = {
    x: rodilla.x - cadera.x,
    y: rodilla.y - cadera.y  // En MediaPipe: Y positivo = hacia abajo
  };
  
  // Calcular ángulos de cada vector respecto al eje horizontal
  const anguloTorso = Math.atan2(-vectorTorso.y, vectorTorso.x); // Invertir Y para que arriba sea positivo
  const anguloMuslo = Math.atan2(-vectorMuslo.y, vectorMuslo.x);
  
  // Diferencia de ángulos
  let diferencia = Math.abs(anguloTorso - anguloMuslo) * 180 / Math.PI;
  
  // Asegurar que esté en rango 0-180°
  if (diferencia > 180) {
    diferencia = 360 - diferencia;
  }
  
  return Math.round(diferencia * 10) / 10;
}
