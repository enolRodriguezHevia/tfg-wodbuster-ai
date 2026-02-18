const request = require('supertest');
const express = require('express');
const WodCrossFit = require('../models/WodCrossFit');
const User = require('../models/User');
const { obtenerWods, registrarWod } = require('../controllers/wodCrossFitController');

jest.mock('../models/WodCrossFit');
jest.mock('../models/User');

const app = express();
app.use(express.json());
app.get('/api/wod-crossfit/:username', obtenerWods);
app.post('/api/wod-crossfit/:username', registrarWod);


describe('WodCrossFit Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/wod-crossfit/:username devuelve WODs del usuario', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    WodCrossFit.find.mockImplementation(() => ({
      sort: () => Promise.resolve([
        { _id: 'wod1', nombreWod: 'Fran', nivel: 'rx', tiempo: 300, fecha: new Date(), notas: '', createdAt: new Date() }
      ])
    }));
    const res = await request(app).get('/api/wod-crossfit/testuser');
    expect(res.status).toBe(200);
    expect(res.body.wods.length).toBe(1);
    expect(res.body.wods[0].nombreWod).toBe('Fran');
    expect(res.body.total).toBe(1);
  });

  test('POST /api/wod-crossfit/:username crea un WOD', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    const wodMock = {
      _id: 'wod2',
      nombreWod: 'Isabel',
      nivel: 'rx',
      tiempo: 400,
      fecha: new Date(),
      notas: ''
    };
    WodCrossFit.prototype.save = jest.fn().mockImplementation(function() {
      Object.assign(this, wodMock);
      return Promise.resolve();
    });
    const res = await request(app)
      .post('/api/wod-crossfit/testuser')
      .send({ username: 'testuser', nombreWod: 'Isabel', nivel: 'rx', tiempo: 400, fecha: new Date() });
    expect(res.status).toBe(201);
    expect(res.body.wod.nombreWod).toBe('Isabel');
    expect(res.body.message).toMatch(/registrado/i);
  });

  test('GET /api/wod-crossfit/:username 404 si usuario no existe', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/wod-crossfit/unknown');
    expect(res.status).toBe(404);
  });

  // Cobertura extra
  test('GET /api/wod-crossfit/:username devuelve array vacío si no hay WODs', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    WodCrossFit.find.mockImplementation(() => ({ sort: () => Promise.resolve([]) }));
    const res = await request(app).get('/api/wod-crossfit/testuser');
    expect(res.status).toBe(200);
    expect(res.body.wods).toEqual([]);
    expect(res.body.total).toBe(0);
  });

  test('POST /api/wod-crossfit/:username 400 si faltan campos', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    const res = await request(app)
      .post('/api/wod-crossfit/testuser')
      .send({ username: 'testuser', nombreWod: '', nivel: '', tiempo: undefined });
    expect(res.status).toBe(400);
  });

  test('POST /api/wod-crossfit/:username 400 si username inválido', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    const res = await request(app)
      .post('/api/wod-crossfit/testuser')
      .send({ username: '!', nombreWod: 'Fran', nivel: 'rx', tiempo: 300 });
    expect(res.status).toBe(400);
  });

  test('POST /api/wod-crossfit/:username 400 si nombreWod inválido', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    const res = await request(app)
      .post('/api/wod-crossfit/testuser')
      .send({ username: 'testuser', nombreWod: 'NoExiste', nivel: 'rx', tiempo: 300 });
    expect(res.status).toBe(400);
  });

  test('POST /api/wod-crossfit/:username 400 si nivel inválido', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    const res = await request(app)
      .post('/api/wod-crossfit/testuser')
      .send({ username: 'testuser', nombreWod: 'Fran', nivel: 'pro', tiempo: 300 });
    expect(res.status).toBe(400);
  });

  test('POST /api/wod-crossfit/:username 404 si usuario no existe', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app)
      .post('/api/wod-crossfit/unknown')
      .send({ username: 'unknown', nombreWod: 'Fran', nivel: 'rx', tiempo: 300 });
    expect(res.status).toBe(404);
  });
});
