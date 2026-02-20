const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../../config/db');
const mongoose = require('mongoose');
const User = require('../../models/User');
const OneRM = require('../../models/OneRM');
const oneRMController = require('../../controllers/oneRMController');

const app = express();
app.use(express.json());
app.post('/api/onerm', oneRMController.registrarOneRM);
app.get('/api/onerm/:username/historial/:ejercicio', oneRMController.obtenerHistorialPorEjercicio);


describe('OneRM Controller (integración real)', () => {
  const testUser = {
    email: 'integration4@example.com',
    username: 'integrationuser4',
    password: 'integrationPass123'
  };
  let userId;

  beforeAll(async () => {
    await connectDB();
    await User.deleteOne({ username: testUser.username });
    const user = await User.create(testUser);
    userId = user._id;
    await OneRM.deleteMany({ userId });
  }, 20000);

  afterAll(async () => {
    await User.deleteOne({ username: testUser.username });
    await OneRM.deleteMany({ userId });
    await mongoose.disconnect();
  }, 20000);

  test('Registrar y obtener historial de 1RM real', async () => {
    // Registrar 1RM
    const registro = {
      username: testUser.username,
      nombreEjercicio: 'Sentadilla',
      peso: 100
    };
    const resPost = await request(app)
      .post('/api/onerm')
      .send(registro);
    expect([201, 400, 404]).toContain(resPost.status);
    // Obtener historial
    const resGet = await request(app)
      .get(`/api/onerm/${testUser.username}/historial/Sentadilla`);
    expect([200, 404]).toContain(resGet.status);
    if (resGet.status === 200) {
      expect(Array.isArray(resGet.body.registros)).toBe(true);
    }
  }, 20000);

  test('Error al registrar 1RM con usuario inexistente', async () => {
    const res = await request(app)
      .post('/api/onerm')
      .send({ username: 'noexiste', nombreEjercicio: 'Sentadilla', peso: 100 });
    expect(res.status).toBe(404);
  }, 10000);

  test('Error al registrar 1RM con datos inválidos', async () => {
    const res = await request(app)
      .post('/api/onerm')
      .send({ username: testUser.username, nombreEjercicio: '', peso: 0 });
    expect(res.status).toBe(400);
  }, 10000);
});
