const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const { construirPromptSentadilla } = require('../prompts/sentadilla');
const { construirPromptPesoMuerto } = require('../prompts/pesoMuerto');
const { construirPromptPressHombros } = require('../prompts/pressHombros');
const { construirPromptRemoBarra } = require('../prompts/remoBarra');

/**
 * Servicio para interactuar con LLMs (Claude como principal, OpenAI como respaldo)
 * Genera feedback inteligente sobre técnica de ejercicio
 */

// Inicializar clientes
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

/**
 * Generar feedback sobre técnica de ejercicio usando Claude (principal) o OpenAI (respaldo)
 * @param {string} ejercicio - Nombre del ejercicio
 * @param {Array} frames - Datos de todos los frames detectados
 * @param {Object} framesClave - Frames importantes (inicio, peak, etc.)
 * @param {Object} metricas - Métricas calculadas (amplitud, duración, etc.)
 * @param {string} preferencia - Preferencia del usuario: 'claude' o 'openai' (default: 'claude')
 * @returns {Object} Feedback estructurado del LLM
 */
async function generarFeedbackEjercicio(ejercicio, frames, framesClave, metricas, preferencia = 'claude') {
  console.log(`🤖 Generando feedback con LLM para: ${ejercicio}`);
  console.log(`📊 Frames analizados: ${frames ? frames.length : 'N/A (solo framesClave)'}`);
  console.log(`⚙️  Preferencia del usuario: ${preferencia.toUpperCase()}`);
  
  // Construir prompt estructurado
  const prompt = construirPromptAnalisis(ejercicio, frames, framesClave, metricas);
  
  // Mostrar el prompt completo para debugging
  console.log('\n📝 PROMPT ENVIADO AL LLM:');
  console.log('='.repeat(80));
  console.log(prompt);
  console.log('='.repeat(80) + '\n');
  
  const systemPrompt = `Eres un fisioterapeuta y entrenador personal experto en biomecánica deportiva y prevención de lesiones. 
Tu tarea es analizar la técnica de ejercicios de fuerza basándote en datos de tracking de pose (MediaPipe).

Proporciona feedback constructivo, claro y específico centrado en:
1. Prevención de lesiones
2. Correcciones técnicas concretas
3. Explicaciones biomecánicas simples
4. Retroalimentación positiva donde sea apropiado

El feedback debe ser profesional pero amigable, sin ser condescendiente. Escribe en texto narrativo bien organizado, no en formato JSON.`;

  // Determinar orden de intentos según preferencia
  const intentarPrimero = preferencia === 'openai' ? 'openai' : 'claude';
  const intentarDespues = preferencia === 'openai' ? 'claude' : 'openai';
  
  // Primer intento (modelo preferido)
  const resultadoPrimero = await intentarLLM(intentarPrimero, systemPrompt, prompt);
  if (resultadoPrimero.success) {
    return resultadoPrimero;
  }
  
  // Segundo intento (fallback)
  console.warn(`⚠️  ${intentarPrimero.toUpperCase()} falló, intentando con ${intentarDespues.toUpperCase()} como respaldo...`);
  const resultadoFallback = await intentarLLM(intentarDespues, systemPrompt, prompt);
  
  if (resultadoFallback.success) {
    return {
      ...resultadoFallback,
      fallback: true,
      preferidoFallo: intentarPrimero
    };
  }
  
  // Ambos fallaron
  console.error('❌ Error con ambos LLMs (Claude y OpenAI)');
  return {
    success: false,
    error: `${intentarPrimero}: ${resultadoPrimero.error} | ${intentarDespues}: ${resultadoFallback.error}`,
    feedback: generarFeedbackFallback(ejercicio, framesClave, metricas),
    fallback: true
  };
}

/**
 * Intenta generar feedback con un LLM específico
 * @param {string} modelo - 'claude' o 'openai'
 * @param {string} systemPrompt - Prompt del sistema
 * @param {string} userPrompt - Prompt del usuario
 * @returns {Object} Resultado del intento
 */
async function intentarLLM(modelo, systemPrompt, userPrompt) {
  if (modelo === 'claude') {
    try {
      console.log('🔵 Intentando con Claude Sonnet 4.5...');
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });
      
      const feedbackText = response.content[0].text;
      
      console.log(`✅ Feedback generado exitosamente con Claude`);
      console.log(`💰 Tokens usados: ${response.usage.input_tokens + response.usage.output_tokens} (entrada: ${response.usage.input_tokens}, salida: ${response.usage.output_tokens})`);
      
      return {
        success: true,
        feedback: feedbackText,
        tokensUsados: response.usage.input_tokens + response.usage.output_tokens,
        modelo: 'claude-sonnet-4-20250514',
        provider: 'anthropic'
      };
    } catch (error) {
      console.error(`❌ Error con Claude: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  } else if (modelo === 'openai') {
    try {
      console.log('🟢 Intentando con OpenAI GPT-4o...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 1200
      });
      
      const feedbackText = response.choices[0].message.content;
      
      console.log(`✅ Feedback generado exitosamente con OpenAI`);
      console.log(`💰 Tokens usados: ${response.usage.total_tokens} (entrada: ${response.usage.prompt_tokens}, salida: ${response.usage.completion_tokens})`);
      
      return {
        success: true,
        feedback: feedbackText,
        tokensUsados: response.usage.total_tokens,
        modelo: response.model,
        provider: 'openai'
      };
    } catch (error) {
      console.error(`❌ Error con OpenAI: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  return {
    success: false,
    error: 'Modelo no reconocido'
  };
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

/**
 * Generar plan de entrenamiento personalizado usando Claude (principal) o OpenAI (respaldo)
 * @param {string} promptPlan - Prompt completo con información del usuario
 * @param {string} preferencia - Preferencia del usuario: 'claude' o 'openai' (default: 'claude')
 * @returns {Object} Plan de entrenamiento estructurado
 */
async function generarPlanEntrenamiento(promptPlan, preferencia = 'claude') {
  console.log('🤖 Generando plan de entrenamiento con LLM...');
  console.log(`⚙️  Preferencia del usuario: ${preferencia.toUpperCase()}`);
  
  const systemPrompt = `Eres un entrenador personal profesional experto en diseño de programas de entrenamiento personalizados.

Tu tarea es crear un plan de entrenamiento detallado basándote en la información del usuario proporcionada.

El plan debe incluir:
1. Análisis de nivel actual y objetivos
2. Programa semanal estructurado
3. Ejercicios específicos con series, repeticiones y pesos recomendados
4. Progresión planificada
5. Consideraciones sobre recuperación y prevención de lesiones

El plan debe ser profesional, motivador y realista. Escribe en formato markdown bien organizado.`;

  // Determinar orden de intentos según preferencia
  const intentarPrimero = preferencia === 'openai' ? 'openai' : 'claude';
  const intentarDespues = preferencia === 'openai' ? 'claude' : 'openai';
  
  // Primer intento (modelo preferido)
  const resultadoPrimero = await intentarLLMPlan(intentarPrimero, systemPrompt, promptPlan);
  if (resultadoPrimero.success) {
    return resultadoPrimero;
  }
  
  // Segundo intento (fallback)
  console.warn(`⚠️  ${intentarPrimero.toUpperCase()} falló, intentando con ${intentarDespues.toUpperCase()} como respaldo...`);
  const resultadoFallback = await intentarLLMPlan(intentarDespues, systemPrompt, promptPlan);
  
  if (resultadoFallback.success) {
    return {
      ...resultadoFallback,
      fallback: true,
      preferidoFallo: intentarPrimero
    };
  }
  
  // Ambos fallaron
  console.error('❌ Error con ambos LLMs (Claude y OpenAI)');
  return {
    success: false,
    error: `${intentarPrimero}: ${resultadoPrimero.error} | ${intentarDespues}: ${resultadoFallback.error}`,
    plan: null
  };
}

/**
 * Intenta generar plan con un LLM específico
 * @param {string} modelo - 'claude' o 'openai'
 * @param {string} systemPrompt - Prompt del sistema
 * @param {string} userPrompt - Prompt del usuario
 * @returns {Object} Resultado del intento
 */
async function intentarLLMPlan(modelo, systemPrompt, userPrompt) {
  if (modelo === 'claude') {
    try {
      console.log('🔵 Intentando con Claude Sonnet 4.5...');
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ]
      });
      
      const planText = response.content[0].text;
      
      console.log(`✅ Plan generado exitosamente con Claude`);
      console.log(`💰 Tokens usados: ${response.usage.input_tokens + response.usage.output_tokens} (entrada: ${response.usage.input_tokens}, salida: ${response.usage.output_tokens})`);
      
      return {
        success: true,
        plan: planText,
        tokensUsados: response.usage.input_tokens + response.usage.output_tokens,
        modelo: 'claude-sonnet-4-20250514',
        provider: 'anthropic'
      };
    } catch (error) {
      console.error(`❌ Error con Claude: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  } else if (modelo === 'openai') {
    try {
      console.log('🟢 Intentando con OpenAI GPT-4o...');
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });
      
      const planText = response.choices[0].message.content;
      
      console.log(`✅ Plan generado exitosamente con OpenAI`);
      console.log(`💰 Tokens usados: ${response.usage.total_tokens} (entrada: ${response.usage.prompt_tokens}, salida: ${response.usage.completion_tokens})`);
      
      return {
        success: true,
        plan: planText,
        tokensUsados: response.usage.total_tokens,
        modelo: response.model,
        provider: 'openai'
      };
    } catch (error) {
      console.error(`❌ Error con OpenAI: ${error.message}`);
      return {
        success: false,
        error: error.message
      };
    }
  }
  
  return {
    success: false,
    error: 'Modelo no reconocido'
  };
}

module.exports = {
  generarFeedbackEjercicio,
  generarPlanEntrenamiento
};