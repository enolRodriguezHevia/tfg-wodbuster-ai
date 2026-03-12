
const dotenv = require('dotenv');
dotenv.config();
const request = require('supertest');
const express = require('express');

const AnalisisVideo = require('../models/AnalisisVideo');
const User = require('../models/User');
const llmService = require('../services/llmService');
const ejercicioValidator = require('../utils/ejercicioValidator');

jest.mock('../models/AnalisisVideo');
jest.mock('../models/User');
jest.mock('../services/llmService');
jest.mock('../utils/ejercicioValidator');


// Middleware fake para simular autenticación y archivo subido
function fakeAuth(req, res, next) {
  req.user = { id: 'user1' };
  next();
}
function fakeFile(req, res, next) {
  req.file = { originalname: 'video.mp4', buffer: Buffer.from('fake') };
  next();
}
const app = express();
app.use(express.json());
app.use(fakeAuth);
app.use(fakeFile);
app.post('/api/analisis-video/analizar', require('../controllers/analisisVideoController').analizarVideo);

// Helper para parsear SSE response
const parseSSEResponse = (text) => {
  const lines = text.split('\n');
  const events = [];
  
  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = line.slice(6);
      if (data && data !== '[DONE]') {
        try {
          events.push(JSON.parse(data));
        } catch (e) {
          // Ignorar líneas que no son JSON válido
        }
      }
    }
  }
  
  return events;
};

describe('AnalisisVideo Controller (unitarios)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock del validador para que siempre pase
    ejercicioValidator.validarEjercicioConHeuristica.mockReturnValue({ valido: true });
  });

  test('POST /api/analisis-video/analizar crea un análisis con feedback LLM', async () => {
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'user1', llmPreference: 'openai' })
    });
    
    // Mock LLM para simular streaming
    llmService.generarFeedbackEjercicio.mockImplementation(async (ejercicio, frames, framesClave, metricas, preferencia, onChunk) => {
      if (onChunk) {
        onChunk('Feedback ');
        onChunk('IA');
      }
      return {
        success: true,
        feedback: 'Feedback IA',
        tokensUsados: 10,
        modelo: 'GPT-4',
        provider: 'openai',
        fallback: false
      };
    });
    
    AnalisisVideo.prototype.save = jest.fn().mockImplementation(function() {
      this._id = 'fakeid';
      return Promise.resolve(this);
    });
    
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({
        ejercicio: 'sentadilla',
        analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback IA'] }),
        framesClave: JSON.stringify({
          peak: {
            anguloRodilla: 85,
            caderaY: 0.6,
            rodillaY: 0.4,
            hombroY: 0.3
          }
        }),
        frames: JSON.stringify([]),
        metricas: JSON.stringify({ rompioParalelo: true })
      });
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    
    const events = parseSSEResponse(res.text);
    const doneEvent = events.find(e => e.type === 'done');
    
    expect(doneEvent).toBeDefined();
    expect(doneEvent.usaIA).toBe(true);
  });

  test('400 si no se sube archivo', async () => {
    const appNoFile = express();
    appNoFile.use(express.json());
    appNoFile.use(fakeAuth);
    // No fakeFile
    appNoFile.post('/api/analisis-video/analizar', require('../controllers/analisisVideoController').analizarVideo);
    const res = await request(appNoFile)
      .post('/api/analisis-video/analizar')
      .send({ ejercicio: 'sentadilla', analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback'] }) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no se ha subido/i);
  });

  test('400 si ejercicio no válido', async () => {
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({ ejercicio: 'invalido', analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback'] }) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/ejercicio no válido/i);
  });

  test('400 si error al parsear datos', async () => {
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({ ejercicio: 'sentadilla', analisisResultado: '{maljson}', framesClave: '{maljson}' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/parsear/i);
  });

  test('400 si no se recibe resultado del análisis', async () => {
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({ ejercicio: 'sentadilla', framesClave: JSON.stringify({}) });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/no se recibió el resultado/i);
  });

  test('Feedback sin IA si faltan API_KEYS', async () => {
    // Simula que no hay API_KEYS
    const oldAnthropic = process.env.ANTHROPIC_API_KEY;
    const oldOpenai = process.env.OPENAI_API_KEY;
    delete process.env.ANTHROPIC_API_KEY;
    delete process.env.OPENAI_API_KEY;
    
    User.findById = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'user1', llmPreference: 'openai' }) });
    AnalisisVideo.prototype.save = jest.fn().mockResolvedValue();
    
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({
        ejercicio: 'sentadilla',
        analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback sin IA'] }),
        framesClave: JSON.stringify({
          peak: {
            anguloRodilla: 85,
            caderaY: 0.6,
            rodillaY: 0.4,
            hombroY: 0.3
          }
        }),
        metricas: JSON.stringify({ rompioParalelo: true })
      });
    
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/event-stream');
    
    const events = parseSSEResponse(res.text);
    const doneEvent = events.find(e => e.type === 'done');
    
    expect(doneEvent).toBeDefined();
    expect(doneEvent.usaIA).toBe(false);
    
    process.env.ANTHROPIC_API_KEY = oldAnthropic;
    process.env.OPENAI_API_KEY = oldOpenai;
  });

  test('500 si ocurre error inesperado', async () => {
    // Forzar error lanzando excepción en save
    User.findById = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'user1', llmPreference: 'openai' }) });
    AnalisisVideo.prototype.save = jest.fn().mockRejectedValue(new Error('DB error'));
    
    llmService.generarFeedbackEjercicio.mockImplementation(async (ejercicio, frames, framesClave, metricas, preferencia, onChunk) => {
      if (onChunk) {
        onChunk('Feedback');
      }
      return { 
        success: true, 
        feedback: 'Feedback', 
        tokensUsados: 1, 
        modelo: 'GPT-4', 
        provider: 'openai', 
        fallback: false 
      };
    });
    
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({
        ejercicio: 'sentadilla',
        analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback'] }),
        framesClave: JSON.stringify({
          peak: {
            anguloRodilla: 90,
            caderaY: 0.5,
            rodillaY: 0.4
          }
        }),
        metricas: JSON.stringify({ rompioParalelo: true })
      });
    
    expect(res.status).toBe(200); // SSE siempre devuelve 200
    expect(res.headers['content-type']).toContain('text/event-stream');
    
    const events = parseSSEResponse(res.text);
    const errorEvent = events.find(e => e.type === 'error');
    
    expect(errorEvent).toBeDefined();
    expect(errorEvent.message).toMatch(/error al procesar/i);
  });
});
