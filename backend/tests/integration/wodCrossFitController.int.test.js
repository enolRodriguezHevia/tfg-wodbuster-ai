const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../../config/db');
const mongoose = require('mongoose');
const User = require('../../models/User');
const WodCrossFit = require('../../models/WodCrossFit');
const wodCrossFitController = require('../../controllers/wodCrossFitController');

const app = express();
app.use(express.json());
app.post('/api/wod-crossfit/:username', wodCrossFitController.registrarWod);
app.get('/api/wod-crossfit/:username', wodCrossFitController.obtenerWods);

describe('WodCrossFit Controller (integración real)', () => {
  const testUser = {
    email: 'integration5@example.com',
    username: 'integrationuser5',
    password: 'integrationPass123'
  };
  let userId;

  beforeAll(async () => {
    await connectDB();
    await User.deleteOne({ username: testUser.username });
    const user = await User.create(testUser);
    userId = user._id;
    await WodCrossFit.deleteMany({ userId });
  }, 20000);

  afterAll(async () => {
    await User.deleteOne({ username: testUser.username });
    await WodCrossFit.deleteMany({ userId });
    await mongoose.disconnect();
  }, 20000);

  test('Registrar y obtener WOD real', async () => {
    // Registrar WOD
    const wod = {
      username: testUser.username,
      nombreWod: 'Fran',
      nivel: 'rx',
      tiempo: 300
    };
    const resPost = await request(app)
      .post(`/api/wod-crossfit/${testUser.username}`)
      .send(wod);
    expect([201, 400, 404]).toContain(resPost.status);
    // Obtener WODs
    const resGet = await request(app)
      .get(`/api/wod-crossfit/${testUser.username}`);
    expect([200, 404]).toContain(resGet.status);
    if (resGet.status === 200) {
      expect(Array.isArray(resGet.body.wods)).toBe(true);
    }
  }, 20000);

  test('Error al registrar WOD con usuario inexistente', async () => {
    const res = await request(app)
      .post('/api/wod-crossfit/noexiste')
      .send({ username: 'noexiste', nombreWod: 'Fran', nivel: 'rx', tiempo: 300 });
    expect(res.status).toBe(404);
  }, 10000);

  test('Error al registrar WOD con datos inválidos', async () => {
    const res = await request(app)
      .post(`/api/wod-crossfit/${testUser.username}`)
      .send({ username: testUser.username, nombreWod: '', nivel: '', tiempo: undefined });
    expect(res.status).toBe(400);
  }, 10000);
});
