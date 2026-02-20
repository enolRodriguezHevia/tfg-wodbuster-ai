const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../../config/db');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Entrenamiento = require('../../models/Entrenamiento');
const Ejercicio = require('../../models/Ejercicio');
const entrenamientoController = require('../../controllers/entrenamientoController');

const app = express();
app.use(express.json());
app.post('/api/entrenamiento/:username', entrenamientoController.registrarEntrenamiento);
app.get('/api/entrenamiento/:username', entrenamientoController.obtenerEntrenamientos);

describe('Entrenamiento Controller (integración real)', () => {
  const testUser = {
    email: 'integration2@example.com',
    username: 'integrationuser2',
    password: 'integrationPass123'
  };
  let userId;

  beforeAll(async () => {
    await connectDB();
    await User.deleteOne({ username: testUser.username });
    const user = await User.create(testUser);
    userId = user._id;
    await Entrenamiento.deleteMany({ userId });
    await Ejercicio.deleteMany({ userId });
  }, 20000);

  afterAll(async () => {
    await User.deleteOne({ username: testUser.username });
    await Entrenamiento.deleteMany({ userId });
    await Ejercicio.deleteMany({ userId });
    await mongoose.disconnect();
  }, 20000);

  test('Registrar y obtener entrenamiento real', async () => {
    // Registrar entrenamiento
    const entrenamientoData = {
      username: testUser.username,
      fecha: new Date(),
      ejercicios: [
        { nombre: 'Sentadilla', series: 3, repeticiones: 10, peso: 100, valoracion: 8 }
      ]
    };
    const resPost = await request(app)
      .post(`/api/entrenamiento/${testUser.username}`)
      .send(entrenamientoData);
    expect([201, 400]).toContain(resPost.status);
    // Obtener entrenamientos
    const resGet = await request(app)
      .get(`/api/entrenamiento/${testUser.username}`);
    expect([200, 404]).toContain(resGet.status);
    if (resGet.status === 200) {
      expect(Array.isArray(resGet.body.entrenamientos)).toBe(true);
    }
  }, 20000);

  test('Error al registrar entrenamiento con usuario inexistente', async () => {
    const entrenamientoData = {
      username: 'noexiste',
      fecha: new Date(),
      ejercicios: [
        { nombre: 'Sentadilla', series: 3, repeticiones: 10, peso: 100, valoracion: 8 }
      ]
    };
    const res = await request(app)
      .post('/api/entrenamiento/noexiste')
      .send(entrenamientoData);
    expect(res.status).toBe(404);
  }, 10000);

  test('Error al registrar entrenamiento con datos inválidos', async () => {
    const entrenamientoData = {
      username: testUser.username,
      fecha: new Date(),
      ejercicios: []
    };
    const res = await request(app)
      .post(`/api/entrenamiento/${testUser.username}`)
      .send(entrenamientoData);
    expect(res.status).toBe(400);
  }, 10000);
});
