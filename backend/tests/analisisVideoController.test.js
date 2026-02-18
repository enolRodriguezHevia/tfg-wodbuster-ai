
const dotenv = require('dotenv');
dotenv.config();
const request = require('supertest');
const express = require('express');

const AnalisisVideo = require('../models/AnalisisVideo');
const User = require('../models/User');
const llmService = require('../services/llmService');

jest.mock('../models/AnalisisVideo');
jest.mock('../models/User');
jest.mock('../services/llmService');


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

describe('AnalisisVideo Controller (unitarios)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/analisis-video/analizar crea un análisis con feedback LLM', async () => {
    User.findById = jest.fn().mockReturnValue({
      select: jest.fn().mockResolvedValue({ _id: 'user1', llmPreference: 'openai' })
    });
    llmService.generarFeedbackEjercicio.mockResolvedValue({
      success: true,
      feedback: ['Feedback IA'],
      tokensUsados: 10,
      modelo: 'GPT-4',
      provider: 'openai',
      fallback: false
    });
    // Mockea save para que this.feedback esté disponible en la respuesta
    AnalisisVideo.prototype.save = jest.fn().mockImplementation(function() {
      this._id = 'fakeid';
      return Promise.resolve(this);
    });
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({
        ejercicio: 'sentadilla',
        analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback IA'] }),
        framesClave: JSON.stringify({}),
        frames: JSON.stringify([]),
        metricas: JSON.stringify({})
      });
    // Mostrar la respuesta real para depuración si el test falla
    expect(res.status).toBe(200);
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
        framesClave: JSON.stringify({})
      });
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.feedback)).toBe(true);
    // Debe contener el feedback enviado o el mensaje genérico
    expect(
      res.body.feedback.some(
        f => typeof f === 'string' && (f.includes('Feedback sin IA') || f.includes('No se pudo analizar') || f.includes('No se pudo generar análisis'))
      )
    ).toBe(true);
    process.env.ANTHROPIC_API_KEY = oldAnthropic;
    process.env.OPENAI_API_KEY = oldOpenai;
  });

  test('500 si ocurre error inesperado', async () => {
    // Forzar error lanzando excepción en save
    User.findById = jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue({ _id: 'user1', llmPreference: 'openai' }) });
    AnalisisVideo.prototype.save = jest.fn().mockRejectedValue(new Error('DB error'));
    llmService.generarFeedbackEjercicio.mockResolvedValue({ success: true, feedback: ['Feedback'], tokensUsados: 1, modelo: 'GPT-4', provider: 'openai', fallback: false });
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({
        ejercicio: 'sentadilla',
        analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback'] }),
        framesClave: JSON.stringify({})
      });
    expect(res.status).toBe(500);
    expect(res.body.message).toMatch(/error al procesar/i);
  });
});
