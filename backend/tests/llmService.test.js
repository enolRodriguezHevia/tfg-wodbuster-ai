
// Mock de OpenAI y Anthropic para evitar requerir claves reales
jest.mock('openai', () => {
  return jest.fn().mockImplementation(() => ({
    chat: { completions: { create: jest.fn() } }
  }));
});
jest.mock('@anthropic-ai/sdk', () => {
  return jest.fn().mockImplementation(() => ({
    messages: { create: jest.fn() }
  }));
});

const { construirPromptAnalisis, generarFeedbackFallback, calcularEstadisticas } = require('../services/llmService');

describe('llmService helpers', () => {
  describe('construirPromptAnalisis', () => {
    it('genera prompt para sentadilla', () => {
      const prompt = construirPromptAnalisis('sentadilla', null, { inicio: 1 }, { rango: 10 });
      expect(typeof prompt).toBe('string');
      expect(prompt).toMatch(/Sentadilla/);
    });
    it('genera prompt para peso-muerto', () => {
      const prompt = construirPromptAnalisis('peso-muerto', null, { inicio: 1 }, { rango: 10 });
      expect(typeof prompt).toBe('string');
      expect(prompt).toMatch(/Peso muerto/);
    });
  });

  describe('generarFeedbackFallback', () => {
    it('devuelve mensaje de fallback', () => {
      const msg = generarFeedbackFallback('sentadilla', {}, {});
      expect(msg).toMatch(/Análisis no disponible/);
      expect(msg).toMatch(/Sentadilla|sentadilla/);
    });
  });

  describe('calcularEstadisticas', () => {
    it('devuelve string con métricas si hay datos', () => {
      const frames = [
        { anguloCodo: 90, anguloTorso: 45 },
        { anguloCodo: 100, anguloTorso: 50 }
      ];
      const stats = calcularEstadisticas(frames);
      expect(stats).toMatch(/anguloCodo/);
      expect(stats).toMatch(/min=90.0/);
      expect(stats).toMatch(/max=100.0/);
      expect(stats).toMatch(/promedio=95.0/);
    });
    it('devuelve mensaje si no hay frames', () => {
      expect(calcularEstadisticas([])).toMatch(/No hay frames/);
    });
  });
});
