/**
 * Validador de ejercicios basado en heurísticas biomecánicas
 * Valida que el ejercicio detectado en el video coincida con el ejercicio seleccionado
 */

/**
 * Valida si el ejercicio del video coincide con el ejercicio seleccionado
 * @param {string} ejercicioSeleccionado - Ejercicio que el usuario seleccionó
 * @param {Object} framesClave - Frames clave del análisis (inicio, peak)
 * @param {Object} metricas - Métricas calculadas del ejercicio
 * @param {Array} frames - Array completo de frames (opcional, requerido para press-hombros)
 * @returns {Object} { valido: boolean, sugerencia: string, razon: string }
 */
function validarEjercicioConHeuristica(ejercicioSeleccionado, framesClave, metricas, frames = null) {
  
  // Validar que tengamos datos mínimos
  if (!framesClave || !framesClave.peak) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames clave en el video. Asegúrate de grabar el ejercicio completo de perfil.'
    };
  }

  // Ejecutar validación segun el ejercicio seleccionado
  switch (ejercicioSeleccionado) {
    case 'sentadilla':
      return validarSentadilla(framesClave, metricas);
    
    case 'peso-muerto':
      return validarPesoMuerto(framesClave, metricas);
    
    case 'press-hombros':
      return validarPressHombros(framesClave, metricas, frames);
    
    case 'remo-barra':
      return validarRemoBarra(framesClave, metricas, frames);
    
    default:
      // Si el ejercicio no está implementado, permitir por defecto
      return {
        valido: true,
        sugerencia: ejercicioSeleccionado,
        razon: 'Ejercicio no validado (permitido por defecto)'
      };
  }
}

/**
 * Validar sentadilla
 * Características: Movimiento vertical descendente, flexión profunda de rodilla, indicador de paralelo
 */
function validarSentadilla(framesClave, metricas) {
  const { inicio, peak } = framesClave;
  
  // 1. Debe haber movimiento vertical significativo de cadera (descendente)
  if (inicio && peak) {
    const movimientoCadera = peak.caderaY - inicio.caderaY;
    
    // La cadera debe bajar (Y aumenta en coordenadas de pantalla)
    if (movimientoCadera < 0.05) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: 'No se detectó movimiento descendente significativo de cadera. Verifica que el video muestre una sentadilla completa de perfil.'
      };
    }
  }
  
  // 2. Ángulo de rodilla debe estar en rango de flexión profunda (50-120°)
  const anguloRodillaPeak = peak.anguloRodilla;
  if (anguloRodillaPeak && (anguloRodillaPeak < 40 || anguloRodillaPeak > 140)) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Ángulo de rodilla (${anguloRodillaPeak.toFixed(1)}°) fuera del rango típico de sentadilla. Verifica que el video muestre el ejercicio correcto.`
    };
  }
  
  // 3. Debe existir métrica de "rompió paralelo" (específica de sentadilla)
  if (metricas && metricas.rompioParalelo === undefined) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron métricas específicas de sentadilla. Verifica que el video muestre el ejercicio completo de perfil.'
    };
  }
  
  // Validación exitosa
  return {
    valido: true,
    sugerencia: 'sentadilla',
    razon: 'Movimiento compatible con sentadilla'
  };
}

/**
 * Validar peso muerto
 * Características: Gran cambio en ángulo de torso (horizontal → vertical), extensión de rodillas
 */
function validarPesoMuerto(framesClave, metricas) {
  const { inicio, peak } = framesClave;
  
  if (!inicio || !peak) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames de inicio y final. Asegúrate de grabar el peso muerto completo.'
    };
  }
  
  // 1. Ángulo de torso inicial debe ser bajo (30-60°, torso inclinado)
  const anguloTorsoInicio = inicio.anguloTorso;
  if (anguloTorsoInicio && anguloTorsoInicio > 70) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Torso inicial muy vertical (${anguloTorsoInicio.toFixed(1)}°). En peso muerto, el torso debe estar inclinado al inicio.`
    };
  }
  
  // 2. Ángulo de torso final debe ser alto (70-90°, torso vertical)
  const anguloTorsoFinal = peak.anguloTorso;
  if (anguloTorsoFinal && anguloTorsoFinal < 65) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Torso final no alcanza verticalidad (${anguloTorsoFinal.toFixed(1)}°). Verifica que el video muestre el ejercicio correcto.`
    };
  }
  
  // 3. Debe haber gran diferencia entre inicio y final en ángulo de torso (>25°)
  if (anguloTorsoInicio && anguloTorsoFinal) {
    const cambioTorso = anguloTorsoFinal - anguloTorsoInicio;
    if (cambioTorso < 20) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: `Cambio de torso insuficiente (${cambioTorso.toFixed(1)}°). En peso muerto, el torso debe cambiar significativamente.`
      };
    }
  }
  
  // 4. Rodilla inicial debe estar flexionada (60-90°)
  const anguloRodillaInicio = inicio.anguloRodilla;
  if (anguloRodillaInicio && (anguloRodillaInicio < 50 || anguloRodillaInicio > 100)) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Ángulo de rodilla inicial (${anguloRodillaInicio.toFixed(1)}°) fuera del rango típico de peso muerto. Verifica que el video muestre el ejercicio correcto.`
    };
  }
  
  // Validación exitosa
  return {
    valido: true,
    sugerencia: 'peso-muerto',
    razon: 'Movimiento compatible con peso muerto'
  };
}

/**
 * Validar press de hombros
 * Características: Extensión completa de codos, torso vertical, movimiento vertical de muñecas
 */
function validarPressHombros(framesClave, metricas, frames) {
  const { inicio, peak } = framesClave;
  
  // 1. Debe tener array de frames completo (requerido para press-hombros)
  if (!frames || frames.length === 0) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames completos. Press de hombros requiere análisis frame por frame.'
    };
  }
  
  // 2. Ángulo de codo en peak debe estar cerca de 180° (extensión completa)
  const anguloCodoPeak = peak.anguloCodo;
  if (anguloCodoPeak && anguloCodoPeak < 140) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Codos no alcanzan extensión completa (${anguloCodoPeak.toFixed(1)}°). Verifica que el video muestre el ejercicio correcto.`
    };
  }
  
  // 3. Torso debe mantenerse relativamente vertical (75-90°) durante el movimiento
  const anguloTorsoPeak = peak.anguloTorso;
  if (anguloTorsoPeak && anguloTorsoPeak < 70) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Torso muy inclinado (${anguloTorsoPeak.toFixed(1)}°). En press de hombros, el torso debe mantenerse vertical.`
    };
  }
  
  // 4. Debe haber movimiento vertical de muñeca/codo (posicionMuneca o posicionCodo)
  if (inicio && peak) {
    const tienePosicionMuneca = inicio.posicionMuneca !== undefined && peak.posicionMuneca !== undefined;
    const tienePosicionCodo = inicio.posicionCodo !== undefined && peak.posicionCodo !== undefined;
    
    if (!tienePosicionMuneca && !tienePosicionCodo) {
      return {
        valido: false,
        sugerencia: 'desconocido',
        razon: 'No se detectaron posiciones de muñeca/codo. Asegúrate de grabar el ejercicio completo de perfil.'
      };
    }
  }
  
  // Validación exitosa
  return {
    valido: true,
    sugerencia: 'press-hombros',
    razon: 'Movimiento compatible con press de hombros'
  };
}

/**
 * Validar remo con barra
 * Características: Torso inclinado constante, flexión-extensión de codos, movimiento horizontal
 */
function validarRemoBarra(framesClave, metricas, frames) {
  const { inicio, peak } = framesClave;
  
  // 1. Debe tener array de frames completo
  if (!frames || frames.length === 0) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames completos. Remo con barra requiere análisis frame por frame.'
    };
  }
  
  if (!inicio || !peak) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames de inicio y peak. Asegúrate de grabar el ejercicio completo.'
    };
  }
  
  // 2. Torso debe estar inclinado (45-70°) y mantenerse relativamente constante
  const anguloTorsoInicio = inicio.anguloTorso;
  const anguloTorsoPeak = peak.anguloTorso;
  
  if (anguloTorsoInicio && (anguloTorsoInicio < 40 || anguloTorsoInicio > 75)) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Torso fuera del rango típico de remo (${anguloTorsoInicio.toFixed(1)}°). Verifica que el video muestre el ejercicio correcto.`
    };
  }
  
  // 3. Ángulo de codo debe variar significativamente (extensión-flexión)
  const anguloCodoInicio = inicio.anguloCodo;
  const anguloCodoPeak = peak.anguloCodo;
  
  if (anguloCodoInicio && anguloCodoPeak) {
    const cambioAnguloCodo = Math.abs(anguloCodoPeak - anguloCodoInicio);
    if (cambioAnguloCodo < 30) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: `Cambio de ángulo de codo insuficiente (${cambioAnguloCodo.toFixed(1)}°). Verifica que el video muestre el ejercicio correcto.`
      };
    }
  }
  
  // Validación exitosa
  return {
    valido: true,
    sugerencia: 'remo-barra',
    razon: 'Movimiento compatible con remo con barra'
  };
}

module.exports = {
  validarEjercicioConHeuristica
};
