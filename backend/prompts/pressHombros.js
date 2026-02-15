/**
 * Prompt para análisis de Press de Hombros
 * Evaluación biomecánica bifásica avanzada:
 * - Fase 1: Lockout (posición final)
 * - Fase 2: Movimiento dinámico completo
 * - Fase 3: Análisis de estabilidad, variación natural y compensaciones progresivas
 */

function construirPromptPressHombros(nombreEjercicio, frames, framesClave, metricas) {

  // =============================
  // RESUMEN FRAMES CLAVE
  // =============================

  const resumenFrames = {
    inicio: framesClave.inicio ? {
      tiempo: framesClave.inicio.tiempo.toFixed(2),
      anguloCodo: framesClave.inicio.anguloCodo?.toFixed(1),
      anguloTorso: framesClave.inicio.anguloTorso?.toFixed(1),
      anguloAlineacion: framesClave.inicio.anguloAlineacion?.toFixed(1)
    } : null,

    peak: framesClave.peak ? {
      tiempo: framesClave.peak.tiempo.toFixed(2),
      anguloCodo: framesClave.peak.anguloCodo?.toFixed(1),
      anguloTorso: framesClave.peak.anguloTorso?.toFixed(1),
      anguloAlineacion: framesClave.peak.anguloAlineacion?.toFixed(1)
    } : null
  };


  // =============================
  // SAMPLING INTELIGENTE
  // =============================

  const frameSampling = frames.length > 80
    ? Math.ceil(frames.length / 80)
    : 1;


  // =============================
  // FRAME DATA COMPLETO
  // =============================

  const frameDataArray = frames
    .filter((_, idx) =>
      idx % frameSampling === 0 ||
      idx === framesClave.inicio?.indice ||
      idx === framesClave.peak?.indice
    )
    .map(frame => {

      const angTorso = frame.anguloTorso != null
        ? frame.anguloTorso.toFixed(1)
        : 'N/A';

      const angCodo = frame.anguloCodo != null
        ? frame.anguloCodo.toFixed(1)
        : 'N/A';

      const angAlineacion = frame.anguloAlineacion != null
        ? frame.anguloAlineacion.toFixed(1)
        : 'N/A';

      const muñecaY = frame.posicionMuneca != null
        ? frame.posicionMuneca.toFixed(3)
        : 'N/A';

      const codoY = frame.posicionCodo != null
        ? frame.posicionCodo.toFixed(3)
        : 'N/A';

      return `  {idx:${frame.frameIndex ?? 'N/A'}, tiempo:${frame.tiempo?.toFixed(2)}, muñecaY:${muñecaY}, codoY:${codoY}, angCodo:${angCodo}, angTorso:${angTorso}, angAlineacion:${angAlineacion}}`;

    })
    .join(',\n');


  // =============================
  // MÉTRICAS DE CAMBIO
  // =============================

  const cambioAnguloCodo =
    (framesClave.inicio?.anguloCodo && framesClave.peak?.anguloCodo)
      ? (framesClave.peak.anguloCodo - framesClave.inicio.anguloCodo).toFixed(1)
      : 'N/A';

  const cambioAnguloTorso =
    (framesClave.inicio?.anguloTorso && framesClave.peak?.anguloTorso)
      ? (framesClave.peak.anguloTorso - framesClave.inicio.anguloTorso).toFixed(1)
      : 'N/A';

  const amplitudMuneca = metricas?.amplitud?.toFixed(3) || 'N/A';


  // =============================
  // PROMPT FINAL
  // =============================

  const prompt = `Eres un entrenador experto en biomecánica y prevención de lesiones. Analiza este press de hombros estricto.

**EJERCICIO**: ${nombreEjercicio}

**LOCKOUT (frame final en t=${resumenFrames.peak?.tiempo || 'N/A'}s):**
- Codo: ${resumenFrames.peak?.anguloCodo || 'N/A'}°
- Torso: ${resumenFrames.peak?.anguloTorso || 'N/A'}°
- Alineación: ${resumenFrames.peak?.anguloAlineacion || 'N/A'}°

**DATOS COMPLETOS DEL MOVIMIENTO:**
frameData = [
${frameDataArray}
]

**DEFINICIONES:**
- angTorso: ángulo respecto al suelo (90°=vertical, valores menores=inclinado hacia atrás)
- angCodo: apertura del codo (180°=extendido completo)
- angAlineacion: tobillo-cadera-hombro (180°=columna neutra, menor=hiperextensión)

═══════════════════════════════════════════════════════════════════
ANÁLISIS BIFÁSICO OBLIGATORIO
═══════════════════════════════════════════════════════════════════

**FASE 1: LOCKOUT (usar SOLO frame peak)**

Codo en lockout = ${resumenFrames.peak?.anguloCodo || 'N/A'}°
→ Evaluar: ≥150° ideal | 140-149° aceptable | <140° fallo

Alineación en lockout = ${resumenFrames.peak?.anguloAlineacion || 'N/A'}°
→ Evaluar: ≥160° ideal | 150-159° aceptable | <150° peligroso

Torso en lockout = ${resumenFrames.peak?.anguloTorso || 'N/A'}°
→ Evaluar: 0-15° ideal | 15-20° aceptable | >20° compensación

**FASE 2: ESTABILIDAD DINÁMICA (usar TODOS los frames)**

PASO 1: Extrae todos los valores de angTorso de frameData
PASO 2: Para cada valor de angTorso, calcula su desviación de vertical: desviación = |90 - angTorso|
PASO 3: Calcula:
  - desviaciónMax = máxima desviación de 90° (cuánto se desvió del vertical)
  - cambioTorso = diferencia entre valor máximo y mínimo de angTorso

PASO 4: Evaluar estabilidad:
  - Ideal: desviaciónMax ≤15°, cambioTorso ≤10°
  - Aceptable: desviaciónMax ≤20°, cambioTorso ≤15°
  - Compensación: desviaciónMax ≤25°, cambioTorso ≤20°
  - Peligroso: desviaciónMax >25° o cambioTorso >20°
  - Alto riesgo: desviaciónMax >30°

**VARIACIÓN NATURAL PERMITIDA:**
NO marcar riesgo alto si: torso en lockout está entre 75-90° (desviación ≤15°) Y desviaciónMax ≤25°
SÍ marcar riesgo alto si: desviaciónMax >30° O lockout <70° (desviación >20° en final)

═══════════════════════════════════════════════════════════════════
INSTRUCCIONES FINALES
═══════════════════════════════════════════════════════════════════

1. Evalúa FASE 1 con los valores exactos mostrados arriba
2. Calcula FASE 2 extrayendo angTorso de frameData
3. Usa valores numéricos exactos en tu feedback
4. Diferencia problemas de lockout vs problemas dinámicos

**Formato de respuesta:**

Escribe un análisis detallado como fisioterapeuta, organizado en párrafos coherentes que incluya:

1. **Evaluación general de la técnica**: Valoración global de cómo se ejecutó el ejercicio
2. **Aspectos técnicos a considerar**: Puntos fuertes y áreas que requieren atención o mejora
3. **Recomendaciones prácticas**: Ejercicios específicos, estiramientos o trabajo complementario para mejorar la técnica y prevenir lesiones

Escribe de forma natural y profesional, como si estuvieras explicándole personalmente al usuario. Utiliza un tono cercano pero experto.`;

  return prompt;
}

module.exports = { construirPromptPressHombros };
