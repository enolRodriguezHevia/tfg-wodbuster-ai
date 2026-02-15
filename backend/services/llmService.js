const OpenAI = require('openai');
const { construirPromptSentadilla } = require('../prompts/sentadilla');
const { construirPromptPesoMuerto } = require('../prompts/pesoMuerto');
const { construirPromptPressHombros } = require('../prompts/pressHombros');
const { construirPromptRemoBarra } = require('../prompts/remoBarra');

/**
 * Servicio para interactuar con OpenAI API
 * Genera feedback inteligente sobre técnica de ejercicio
 */

// Inicializar cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generar feedback sobre técnica de ejercicio usando GPT-4
 * @param {string} ejercicio - Nombre del ejercicio
 * @param {Array} frames - Datos de todos los frames detectados
 * @param {Object} framesClave - Frames importantes (inicio, peak, etc.)
 * @param {Object} metricas - Métricas calculadas (amplitud, duración, etc.)
 * @returns {Object} Feedback estructurado del LLM
 */
async function generarFeedbackEjercicio(ejercicio, frames, framesClave, metricas) {
  try {
    console.log(`🤖 Generando feedback con LLM para: ${ejercicio}`);
    console.log(`📊 Frames analizados: ${frames.length}`);
    
    // Construir prompt estructurado
    const prompt = construirPromptAnalisis(ejercicio, frames, framesClave, metricas);
    
    // Mostrar el prompt completo para debugging
    console.log('\n📝 PROMPT ENVIADO AL LLM:');
    console.log('='.repeat(80));
    console.log(prompt);
    console.log('='.repeat(80) + '\n');
    
    // Llamar a OpenAI API
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `Eres un fisioterapeuta y entrenador personal experto en biomecánica deportiva y prevención de lesiones. 
Tu tarea es analizar la técnica de ejercicios de fuerza basándote en datos de tracking de pose (MediaPipe).

Proporciona feedback constructivo, claro y específico centrado en:
1. Prevención de lesiones
2. Correcciones técnicas concretas
3. Explicaciones biomecánicas simples
4. Retroalimentación positiva donde sea apropiado

El feedback debe ser profesional pero amigable, sin ser condescendiente. Escribe en texto narrativo bien organizado, no en formato JSON.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1200
    });
    
    const feedbackText = response.choices[0].message.content;
    
    console.log(`✅ Feedback generado exitosamente`);
    console.log(`💰 Tokens usados: ${response.usage.total_tokens} (entrada: ${response.usage.prompt_tokens}, salida: ${response.usage.completion_tokens})`);
    
    return {
      success: true,
      feedback: feedbackText,
      tokensUsados: response.usage.total_tokens,
      modelo: response.model
    };
    
  } catch (error) {
    console.error('❌ Error al generar feedback con LLM:', error.message);
    
    // Fallback a feedback básico si falla la API
    return {
      success: false,
      error: error.message,
      feedback: generarFeedbackFallback(ejercicio, framesClave, metricas)
    };
  }
}

/**
 * Construir prompt estructurado para el análisis
 */
function construirPromptAnalisis(ejercicio, frames, framesClave, metricas) {
  // Mapeo de nombres de ejercicios
  const nombresEjercicios = {
    'remo-barra': 'Remo con barra inclinado',
    'sentadilla': 'Sentadilla',
    'peso-muerto': 'Peso muerto',
    'press-hombros': 'Press de hombros'
  };
  const nombreEjercicio = nombresEjercicios[ejercicio] || ejercicio;
  
  // Construir prompt según el tipo de ejercicio
  if (ejercicio === 'sentadilla') {
    return construirPromptSentadilla(nombreEjercicio, framesClave, metricas);
  } else if (ejercicio === 'peso-muerto') {
    return construirPromptPesoMuerto(nombreEjercicio, framesClave, metricas);
  } else if (ejercicio === 'press-hombros') {
    return construirPromptPressHombros(nombreEjercicio, frames, framesClave, metricas);
  } else if (ejercicio === 'remo-barra') {
    return construirPromptRemoBarra(nombreEjercicio, frames, framesClave, metricas);
  }
  
  // Fallback genérico para ejercicios no reconocidos
  return construirPromptRemoBarra(nombreEjercicio, frames, framesClave, metricas);
}

/**
 * Feedback fallback si falla la API
 */
function generarFeedbackFallback(ejercicio, framesClave, metricas) {
  return `**Análisis no disponible**\n\nLo sentimos, no pudimos generar un análisis automático para tu ${ejercicio} en este momento. Te recomendamos consultar con un entrenador profesional para revisar tu técnica.\n\n**Consejos generales:**\n- Asegúrate de grabar el ejercicio completamente de perfil\n- Verifica que haya buena iluminación\n- Mantén todo el cuerpo visible en el encuadre\n- Realiza el movimiento completo para que podamos analizar tu técnica correctamente`;
}

/**
 * Calcular estadísticas de todos los frames (función auxiliar legacy)
 */
function calcularEstadisticas(frames) {
  if (!frames || frames.length === 0) return 'No hay frames para analizar';
  
  const stats = {};
  
  // Calcular min, max, promedio para cada métrica
  const metricas = ['anguloCodo', 'anguloTorso', 'anguloRodilla', 'anguloAlineacion'];
  
  metricas.forEach(metrica => {
    const valores = frames.map(f => f[metrica]).filter(v => v !== undefined && !isNaN(v));
    if (valores.length > 0) {
      stats[metrica] = {
        min: Math.min(...valores).toFixed(1),
        max: Math.max(...valores).toFixed(1),
        promedio: (valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(1)
      };
    }
  });
  
  return Object.entries(stats)
    .map(([metrica, vals]) => `- ${metrica}: min=${vals.min}°, max=${vals.max}°, promedio=${vals.promedio}°`)
    .join('\n');
}

module.exports = {
  generarFeedbackEjercicio
};