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
 * Características: Movimiento vertical descendente, flexión profunda de rodilla
 */
function validarSentadilla(framesClave, metricas) {
  const { inicio, peak } = framesClave;
  
  if (!inicio || !peak) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames de inicio y peak. Asegúrate de grabar el ejercicio completo.'
    };
  }
  
  const movimientoCadera = peak.caderaY - inicio.caderaY;
  const anguloRodillaPeak = peak.anguloRodilla;
  const anguloTorsoPeak = peak.anguloTorso;
  const anguloCodoPeak = peak.anguloCodo;
  
  // VALIDACIÓN 1: Descartar press de hombros (torso vertical + codos extendidos + poco movimiento de cadera)
  if (anguloTorsoPeak && anguloTorsoPeak > 75 && anguloCodoPeak && anguloCodoPeak > 140 && movimientoCadera < 0.05) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'El movimiento detectado no coincide con una sentadilla. Verifica que el video muestre el ejercicio correcto.'
    };
  }
  
  // VALIDACIÓN 2: Descartar peso muerto (torso muy inclinado al inicio + poco movimiento vertical)
  const anguloTorsoInicio = inicio.anguloTorso;
  if (anguloTorsoInicio && anguloTorsoInicio < 50 && movimientoCadera < 0.06) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'El movimiento detectado no coincide con una sentadilla. Verifica que el video muestre el ejercicio correcto.'
    };
  }
  
  // VALIDACIÓN 3: Descartar remo (poco movimiento vertical + cambio grande de codo)
  if (anguloCodoPeak && inicio.anguloCodo) {
    const cambioAnguloCodo = Math.abs(anguloCodoPeak - inicio.anguloCodo);
    if (movimientoCadera < 0.05 && cambioAnguloCodo > 30) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: 'El movimiento detectado no coincide con una sentadilla. Verifica que el video muestre el ejercicio correcto.'
      };
    }
  }
  
  // VALIDACIÓN 4: Debe haber movimiento vertical significativo de cadera (característica principal)
  if (movimientoCadera < 0.04) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'No se detectó movimiento descendente significativo de cadera. En sentadilla, la cadera debe bajar considerablemente.'
    };
  }
  
  // VALIDACIÓN 5: Rodilla debe flexionarse (no puede estar casi recta)
  if (anguloRodillaPeak && (anguloRodillaPeak < 30 || anguloRodillaPeak > 150)) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Ángulo de rodilla (${anguloRodillaPeak.toFixed(1)}°) fuera del rango de sentadilla. Verifica que el video muestre el ejercicio correcto.`
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
 * Características: Gran cambio en ángulo de torso (inclinado → vertical), extensión de cadera
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
  
  const anguloTorsoInicio = inicio.anguloTorso;
  const anguloTorsoFinal = peak.anguloTorso;
  const anguloRodillaInicio = inicio.anguloRodilla;
  const anguloCodoInicio = inicio.anguloCodo;
  const anguloCodoPeak = peak.anguloCodo;
  const movimientoCadera = Math.abs(peak.caderaY - inicio.caderaY);
  
  // VALIDACIÓN 1: Descartar sentadilla (mucho movimiento vertical + rodilla muy flexionada)
  const anguloRodillaPeak = peak.anguloRodilla;
  if (movimientoCadera > 0.10 && anguloRodillaPeak && anguloRodillaPeak < 100) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'El movimiento detectado no coincide con un peso muerto. Verifica que el video muestre el ejercicio correcto.'
    };
  }
  
  // VALIDACIÓN 2: Descartar press de hombros (torso vertical + codos extendidos)
  if (anguloTorsoInicio && anguloTorsoInicio > 70 && anguloCodoPeak && anguloCodoPeak > 140) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'El movimiento detectado no coincide con un peso muerto. Verifica que el video muestre el ejercicio correcto.'
    };
  }
  
  // VALIDACIÓN 3: Descartar remo (torso se mantiene constante + cambio grande de codo)
  if (anguloCodoInicio && anguloCodoPeak && anguloTorsoInicio && anguloTorsoFinal) {
    const cambioAnguloCodo = Math.abs(anguloCodoPeak - anguloCodoInicio);
    const cambioTorso = Math.abs(anguloTorsoFinal - anguloTorsoInicio);
    if (cambioAnguloCodo > 30 && cambioTorso < 15) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: 'El movimiento detectado no coincide con un peso muerto. Verifica que el video muestre el ejercicio correcto.'
      };
    }
  }
  
  // VALIDACIÓN 4: Debe haber cambio de torso (característica principal del peso muerto)
  if (anguloTorsoInicio !== undefined && anguloTorsoFinal !== undefined) {
    const cambioTorso = anguloTorsoFinal - anguloTorsoInicio;
    if (cambioTorso < 8) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: `Cambio de torso insuficiente (${cambioTorso.toFixed(1)}°). En peso muerto, el torso debe cambiar de inclinado a más vertical.`
      };
    }
  }
  
  // VALIDACIÓN 5: Torso inicial no debe estar ya vertical
  if (anguloTorsoInicio && anguloTorsoInicio > 75) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Torso inicial muy vertical (${anguloTorsoInicio.toFixed(1)}°). En peso muerto, el torso debe estar inclinado al inicio.`
    };
  }
  
  // Validación exitosa - permite técnicas malas (torso final no vertical, etc.)
  return {
    valido: true,
    sugerencia: 'peso-muerto',
    razon: 'Movimiento compatible con peso muerto'
  };
}

/**
 * Validar press de hombros
 * Características: Extensión de codos, torso vertical, movimiento vertical de brazos
 */
function validarPressHombros(framesClave, metricas, frames) {
  const { inicio, peak } = framesClave;
  
  if (!inicio || !peak) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames de inicio y peak. Asegúrate de grabar el ejercicio completo.'
    };
  }
  
  const anguloCodoPeak = peak.anguloCodo;
  const anguloTorsoPeak = peak.anguloTorso;
  const anguloTorsoInicio = inicio.anguloTorso;
  const movimientoCadera = Math.abs(peak.caderaY - inicio.caderaY);
  const anguloRodillaPeak = peak.anguloRodilla;
  
  // VALIDACIÓN 1: Descartar sentadilla (mucho movimiento vertical + rodillas flexionadas)
  if (movimientoCadera > 0.08 && anguloRodillaPeak && anguloRodillaPeak < 120) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'El movimiento detectado no coincide con un press de hombros. Verifica que el video muestre el ejercicio correcto.'
    };
  }
  
  // VALIDACIÓN 2: Descartar peso muerto (torso muy inclinado al inicio + gran cambio de torso)
  if (anguloTorsoInicio && anguloTorsoPeak) {
    const cambioTorso = Math.abs(anguloTorsoPeak - anguloTorsoInicio);
    if (anguloTorsoInicio < 50 && cambioTorso > 20) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: 'El movimiento detectado no coincide con un press de hombros. Verifica que el video muestre el ejercicio correcto.'
      };
    }
  }
  
  // VALIDACIÓN 3: Descartar remo (torso inclinado constante + codos no muy extendidos)
  if (anguloTorsoPeak && anguloTorsoPeak < 65 && anguloCodoPeak && anguloCodoPeak < 140) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'El movimiento detectado no coincide con un press de hombros. Verifica que el video muestre el ejercicio correcto.'
    };
  }
  
  // VALIDACIÓN 4: Torso debe mantenerse relativamente vertical (característica principal)
  if (anguloTorsoPeak && anguloTorsoPeak < 60) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Torso muy inclinado (${anguloTorsoPeak.toFixed(1)}°). En press de hombros, el torso debe mantenerse vertical.`
    };
  }
  
  // VALIDACIÓN 5: Codos deben tender a extenderse (permite técnica mala pero no demasiado)
  if (anguloCodoPeak && anguloCodoPeak < 110) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: `Codos no se extienden suficientemente (${anguloCodoPeak.toFixed(1)}°). Verifica que el video muestre el ejercicio correcto.`
    };
  }
  
  // Validación exitosa - permite extensión incompleta (120-180°)
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
  
  if (!inicio || !peak) {
    return {
      valido: false,
      sugerencia: 'desconocido',
      razon: 'No se detectaron frames de inicio y peak. Asegúrate de grabar el ejercicio completo.'
    };
  }
  
  const anguloTorsoInicio = inicio.anguloTorso;
  const anguloTorsoPeak = peak.anguloTorso;
  const anguloCodoInicio = inicio.anguloCodo;
  const anguloCodoPeak = peak.anguloCodo;
  
  // VALIDACIÓN 1: Descartar press de hombros (torso vertical + extensión de codos)
  if (anguloTorsoPeak && anguloTorsoPeak > 75 && anguloCodoPeak && anguloCodoPeak > 140) {
    return {
      valido: false,
      sugerencia: 'otro',
      razon: 'El movimiento detectado no coincide con un remo con barra. Verifica que el video muestre el ejercicio correcto.'
    };
  }
  
  // VALIDACIÓN 2: Descartar sentadilla (movimiento vertical de cadera + flexión de rodilla)
  if (inicio.caderaY && peak.caderaY) {
    const movimientoCadera = Math.abs(peak.caderaY - inicio.caderaY);
    const anguloRodillaPeak = peak.anguloRodilla;
    if (movimientoCadera > 0.08 && anguloRodillaPeak && anguloRodillaPeak < 120) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: 'El movimiento detectado no coincide con un remo con barra. Verifica que el video muestre el ejercicio correcto.'
      };
    }
  }
  
  // VALIDACIÓN 3: Debe haber cambio significativo de codo (característica principal del remo)
  if (anguloCodoInicio && anguloCodoPeak) {
    const cambioAnguloCodo = Math.abs(anguloCodoPeak - anguloCodoInicio);
    if (cambioAnguloCodo < 15) {
      return {
        valido: false,
        sugerencia: 'otro',
        razon: `Cambio de ángulo de codo insuficiente (${cambioAnguloCodo.toFixed(1)}°). En remo, los codos deben flexionarse y extenderse significativamente.`
      };
    }
  }
  
  // Validación exitosa - es remo (incluso con mala técnica de torso)
  return {
    valido: true,
    sugerencia: 'remo-barra',
    razon: 'Movimiento compatible con remo con barra'
  };
}

module.exports = {
  validarEjercicioConHeuristica
};
