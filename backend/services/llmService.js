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
 * @param {Function} onChunk - Callback para recibir chunks de texto en streaming (opcional)
 * @returns {Object} Feedback estructurado del LLM
 */
async function generarFeedbackEjercicio(ejercicio, frames, framesClave, metricas, preferencia = 'claude', onChunk = null) {
  
  // Construir prompt estructurado
  const prompt = construirPromptAnalisis(ejercicio, frames, framesClave, metricas);
  
  const systemPrompt = `Eres un fisioterapeuta y entrenador personal experto en biomecánica deportiva y prevención de lesiones. 
Tu tarea es analizar la técnica de ejercicios de fuerza basándote en datos de tracking de pose (MediaPipe).

Proporciona feedback constructivo, claro y específico centrado en:
1. Prevención de lesiones
2. Correcciones técnicas concretas
3. Explicaciones biomecánicas simples
4. Retroalimentación positiva donde sea apropiado

IMPORTANTE SOBRE EL FORMATO:
- Usa formato de texto limpio y profesional, sin exceso de símbolos markdown
- Usa encabezados claros con MAYÚSCULAS en lugar de múltiples #
- Usa negritas (**texto**) solo para énfasis importante
- Usa listas con guión simple (-) cuando sea necesario
- Usa separadores de línea (---) para dividir secciones principales
- Los emojis son opcionales y solo para énfasis clave

El feedback debe ser profesional pero amigable, sin ser condescendiente. Escribe en texto narrativo bien organizado y FÁCIL DE LEER.`;

  // Determinar orden de intentos según preferencia
  const intentarPrimero = preferencia === 'openai' ? 'openai' : 'claude';
  const intentarDespues = preferencia === 'openai' ? 'claude' : 'openai';
  
  // Primer intento (modelo preferido)
  const resultadoPrimero = await intentarLLM(intentarPrimero, systemPrompt, prompt, onChunk);
  if (resultadoPrimero.success) {
    return resultadoPrimero;
  }
  
  // Segundo intento (fallback)
  const resultadoFallback = await intentarLLM(intentarDespues, systemPrompt, prompt, onChunk);
  
  if (resultadoFallback.success) {
    return {
      ...resultadoFallback,
      fallback: true,
      preferidoFallo: intentarPrimero
    };
  }
  
  // Ambos fallaron
  return {
    success: false,
    error: `${intentarPrimero}: ${resultadoPrimero.error} | ${intentarDespues}: ${resultadoFallback.error}`,
    feedback: generarFeedbackFallback(ejercicio, framesClave, metricas),
    fallback: true
  };
}

/**
 * Intenta generar feedback con un LLM específico (con streaming)
 * @param {string} modelo - 'claude' o 'openai'
 * @param {string} systemPrompt - Prompt del sistema
 * @param {string} userPrompt - Prompt del usuario
 * @param {Function} onChunk - Callback para cada chunk de texto (opcional)
 * @returns {Object} Resultado del intento
 */
async function intentarLLM(modelo, systemPrompt, userPrompt, onChunk = null) {
  if (modelo === 'claude') {
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1200,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        stream: true
      });
      
      let feedbackText = '';
      let inputTokens = 0;
      let outputTokens = 0;
      
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          feedbackText += chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        } else if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        }
      }
      
      return {
        success: true,
        feedback: feedbackText,
        tokensUsados: inputTokens + outputTokens,
        modelo: 'claude-sonnet-4-20250514',
        provider: 'anthropic'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  } else if (modelo === 'openai') {
    try {
      const stream = await openai.chat.completions.create({
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
        max_tokens: 1200,
        stream: true
      });
      
      let feedbackText = '';
      let tokensUsados = 0;
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          feedbackText += content;
          if (onChunk) {
            onChunk(content);
          }
        }
        if (chunk.usage) {
          tokensUsados = chunk.usage.total_tokens;
        }
      }
  
      return {
        success: true,
        feedback: feedbackText,
        tokensUsados: tokensUsados,
        modelo: 'gpt-4o',
        provider: 'openai'
      };
    } catch (error) {
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
 * @param {Function} onChunk - Callback para recibir chunks de texto en streaming (opcional)
 * @returns {Object} Plan de entrenamiento estructurado
 */
async function generarPlanEntrenamiento(promptPlan, preferencia = 'claude', onChunk = null) {

  const systemPrompt = `Eres un entrenador personal profesional experto en diseño de programas de entrenamiento personalizados.

FORMATO DE RESPUESTA:
- Usa MAYÚSCULAS para títulos principales
- Usa negritas (**texto**) solo para énfasis importante
- Estructura clara con secciones bien definidas
- Texto limpio y profesional, fácil de leer
- Emojis opcionales solo para secciones principales`;

  // Determinar orden de intentos según preferencia
  const intentarPrimero = preferencia === 'openai' ? 'openai' : 'claude';
  const intentarDespues = preferencia === 'openai' ? 'claude' : 'openai';
  
  // Primer intento (modelo preferido)
  const resultadoPrimero = await intentarLLMPlan(intentarPrimero, systemPrompt, promptPlan, onChunk);
  if (resultadoPrimero.success) {
    return resultadoPrimero;
  }
  
  // Segundo intento (fallback)
  const resultadoFallback = await intentarLLMPlan(intentarDespues, systemPrompt, promptPlan, onChunk);
  
  if (resultadoFallback.success) {
    return {
      ...resultadoFallback,
      fallback: true,
      preferidoFallo: intentarPrimero
    };
  }
  
  // Ambos fallaron
  return {
    success: false,
    error: `${intentarPrimero}: ${resultadoPrimero.error} | ${intentarDespues}: ${resultadoFallback.error}`,
    plan: null
  };
}

/**
 * Intenta generar plan con un LLM específico (con streaming)
 * @param {string} modelo - 'claude' o 'openai'
 * @param {string} systemPrompt - Prompt del sistema
 * @param {string} userPrompt - Prompt del usuario
 * @param {Function} onChunk - Callback para cada chunk de texto (opcional)
 * @returns {Object} Resultado del intento
 */
async function intentarLLMPlan(modelo, systemPrompt, userPrompt, onChunk = null) {
  if (modelo === 'claude') {
    try {
      const stream = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 3000,
        temperature: 0.7,
        system: systemPrompt,
        messages: [
          {
            role: 'user',
            content: userPrompt
          }
        ],
        stream: true
      });
      
      let planText = '';
      let inputTokens = 0;
      let outputTokens = 0;
      
      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          planText += chunk;
          if (onChunk) {
            onChunk(chunk);
          }
        } else if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        } else if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        }
      }
      
      return {
        success: true,
        plan: planText,
        tokensUsados: inputTokens + outputTokens,
        modelo: 'claude-sonnet-4-20250514',
        provider: 'anthropic'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  } else if (modelo === 'openai') {
    try {
      const stream = await openai.chat.completions.create({
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
        max_tokens: 3000,
        stream: true
      });
      
      let planText = '';
      let tokensUsados = 0;
      
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          planText += content;
          if (onChunk) {
            onChunk(content);
          }
        }
        if (chunk.usage) {
          tokensUsados = chunk.usage.total_tokens;
        }
      }
      
      return {
        success: true,
        plan: planText,
        tokensUsados: tokensUsados,
        modelo: 'gpt-4o',
        provider: 'openai'
      };
    } catch (error) {
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
  generarPlanEntrenamiento,
  construirPromptAnalisis,
  generarFeedbackFallback,
  calcularEstadisticas
};