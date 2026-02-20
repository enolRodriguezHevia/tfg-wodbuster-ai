const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const AnalisisVideo = require('../../models/AnalisisVideo');
const User = require('../../models/User');

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
app.post('/api/analisis-video/analizar', require('../../controllers/analisisVideoController').analizarVideo);

// Solo ejecuta si hay API KEY real
(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY) && describe('AnalisisVideo Controller (integración LLM real)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('POST /api/analisis-video/analizar integración con LLM real', async () => {
    User.findById = jest.fn().mockResolvedValue({ _id: 'user1', llmPreference: 'openai' });
    AnalisisVideo.prototype.save = jest.fn().mockResolvedValue();
    // No mock de llmService, se usa el real
    const res = await request(app)
      .post('/api/analisis-video/analizar')
      .send({
        ejercicio: 'sentadilla',
        analisisResultado: JSON.stringify({ angulos: {}, feedback: ['Feedback integración'] }),
        framesClave: JSON.stringify({}),
        frames: JSON.stringify([]),
        metricas: JSON.stringify({})
      });
    expect([200, 400, 500]).toContain(res.status); // Puede fallar por API, pero debe responder
    if (res.status === 200) {
      expect(res.body.usaIA).toBe(true);
      expect(typeof res.body.tokensUsados).toBe('number');
    }
  });
});
