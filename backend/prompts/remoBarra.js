/**
 * Prompt para análisis de Remo con Barra
 * Evaluación dinámica de movimiento de tracción horizontal
 */

function construirPromptRemoBarra(nombreEjercicio, frames, framesClave, metricas) {
  // Resumen de frames clave
  const resumenFrames = {
    inicio: framesClave.inicio ? {
      anguloCodo: framesClave.inicio.anguloCodo?.toFixed(1),
      anguloTorso: framesClave.inicio.anguloTorso?.toFixed(1),
      anguloRodilla: framesClave.inicio.anguloRodilla?.toFixed(1),
      anguloAlineacion: framesClave.inicio.anguloAlineacion?.toFixed(1)
    } : null,
    peak: framesClave.peak ? {
      anguloCodo: framesClave.peak.anguloCodo?.toFixed(1),
      anguloTorso: framesClave.peak.anguloTorso?.toFixed(1),
      anguloRodilla: framesClave.peak.anguloRodilla?.toFixed(1),
      anguloAlineacion: framesClave.peak.anguloAlineacion?.toFixed(1)
    } : null
  };
  
  // Calcular cambios entre inicio y peak
  const cambioAnguloCodo = (framesClave.inicio?.anguloCodo && framesClave.peak?.anguloCodo) 
    ? (framesClave.inicio.anguloCodo - framesClave.peak.anguloCodo).toFixed(1)
    : 'N/A';
  const cambioAnguloTorso = (framesClave.inicio?.anguloTorso && framesClave.peak?.anguloTorso)
    ? (framesClave.inicio.anguloTorso - framesClave.peak.anguloTorso).toFixed(1)
    : 'N/A';
  const amplitudMuneca = metricas?.amplitud?.toFixed(3) || 'N/A';
  
  const prompt = `Eres un entrenador virtual especializado en fuerza y técnica de levantamiento de pesas, con enfoque prioritario en **salud y prevención de lesiones**.

Te voy a pasar los datos de un remo inclinado con barra. Tu tarea es evaluar la técnica analizando la posición inicial y el peak (contracción máxima).

**Ejercicio**: ${nombreEjercicio}

**Posición INICIAL (brazos extendidos):**
- Ángulo de codo: ${resumenFrames.inicio?.anguloCodo || 'N/A'}° (ideal: 160-180°, extendido)
- Ángulo de torso: ${resumenFrames.inicio?.anguloTorso || 'N/A'}° (inclinación hacia adelante, ideal: 30-50° respecto al suelo)

**Posición PEAK (máxima contracción):**
- Ángulo de codo: ${resumenFrames.peak?.anguloCodo || 'N/A'}° (ideal: 90-120°, flexionado con codo al torso)
- Ángulo de torso: ${resumenFrames.peak?.anguloTorso || 'N/A'}° (debe ser similar al inicio ±20°)

**Cambios durante el movimiento:**
- Cambio de codo: ${framesClave.inicio?.anguloCodo?.toFixed(1) || 'N/A'}° → ${framesClave.peak?.anguloCodo?.toFixed(1) || 'N/A'}° (flexión de ${cambioAnguloCodo}°)
- Cambio de torso: ${framesClave.inicio?.anguloTorso?.toFixed(1) || 'N/A'}° → ${framesClave.peak?.anguloTorso?.toFixed(1) || 'N/A'}° (cambio de ${cambioAnguloTorso}°)

═══════════════════════════════════════════════════════════════════
CRITERIOS DE EVALUACIÓN EXPLÍCITOS
═══════════════════════════════════════════════════════════════════

**⚠️ INTERPRETACIÓN DE ÁNGULOS DE TORSO:**

**ÁNGULOS POSITIVOS:** Hombro más alto que cadera (NORMAL para remo)
→ 30-50° = IDEAL (torso inclinado hacia adelante, posición correcta)
→ 20-29° = Muy inclinado pero aceptable
→ 51-60° = Un poco vertical, todavía aceptable
→ >60° = Demasiado vertical (riesgo de mala activación)
→ 0-19° = Casi horizontal (riesgo lumbar alto)

**ÁNGULOS NEGATIVOS:** Hombro más bajo que cadera (ANORMAL)
→ Si ves un ángulo negativo = posición invertida/incorrecta
→ Menciona esto como área de riesgo crítica

**POSICIÓN INICIAL:**

Codo inicial (extendido):
→ 160-180° = IDEAL (no mencionar en riesgo)
→ 150-159° = ACEPTABLE (casi extendido)
→ <150° = PROBLEMA (no parte desde extensión completa)

Torso inicial:
→ 30-50° = IDEAL (no mencionar en riesgo, torso inclinado hacia adelante)
→ 20-60° = ACEPTABLE (observación menor)
→ >60° = DEMASIADO VERTICAL (pérdida de ángulo efectivo)
→ 0-20° = MUY INCLINADO (riesgo de sobrecarga lumbar)
→ <0° (NEGATIVO) = POSICIÓN INVERTIDA (peligro extremo)

**POSICIÓN PEAK (CONTRACCIÓN):**

Codo peak (flexionado):
→ 90-120° = IDEAL (buena contracción, codo al torso)
→ 70-89° o 121-140° = ACEPTABLE (contracción moderada)
→ >140° = RANGO CORTO (poco recorrido, mejora técnica)
→ <70° = EXCESIVO (flexión exagerada o compensación)

**ESTABILIDAD DEL TORSO (TODO EL MOVIMIENTO):**

Calcula cambio de torso (inicio → peak):
→ <10° = IDEAL (excelente estabilidad)
→ 10-20° = ACEPTABLE (estabilidad moderada)
→ >20° = COMPENSACIÓN (uso excesivo de impulso, técnica deficiente)

═══════════════════════════════════════════════════════════════════
INSTRUCCIONES DE ANÁLISIS
═══════════════════════════════════════════════════════════════════

1. Evalúa SOLO la posición inicial y el peak usando los criterios IDEAL/ACEPTABLE/RIESGO definidos arriba
2. Compara el cambio de torso entre inicio y peak para determinar estabilidad
3. Solo incluye en "areasDeRiesgo" valores fuera de rangos IDEAL y ACEPTABLE
4. Los valores dentro del rango IDEAL deben mencionarse en "aspectosPositivos"
5. Proporciona explicaciones descriptivas sin mencionar ángulos numéricos en la respuesta

Notas importantes:
- El remo inclinado requiere torso estable (30-50° respecto al suelo) durante todo el movimiento
- Mantén el torso fijo/estático: cambio >20° indica uso excesivo de impulso corporal
- Los brazos deben partir extendidos (codo 160-180°) y llegar a flexión con codo cerca del torso (90-120°)
- El movimiento debe ser controlado, tirando con la espalda no con impulso del cuerpo
- Valores en el límite superior/inferior del rango IDEAL siguen siendo IDEAL, no riesgo

**Formato de respuesta:**

Escribe un análisis detallado como fisioterapeuta, organizado en párrafos coherentes que incluya:

1. **Evaluación general de la técnica**: Valoración global de cómo se ejecutó el ejercicio
2. **Aspectos técnicos a considerar**: Puntos fuertes y áreas que requieren atención o mejora
3. **Recomendaciones prácticas**: Ejercicios específicos, estiramientos o trabajo complementario para mejorar la técnica y prevenir lesiones

Escribe de forma natural y profesional, como si estuvieras explicándole personalmente al usuario. Utiliza un tono cercano pero experto.`;

  return prompt;
}

module.exports = { construirPromptRemoBarra };
