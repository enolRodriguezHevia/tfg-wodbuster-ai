
const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');

const authController = require('../../controllers/authController');
const planEntrenamientoController = require('../../controllers/planEntrenamientoController');

const app = express();
app.use(express.json());
app.post('/api/auth/signup', authController.signup);
app.post('/api/plan-entrenamiento/generar/:username', planEntrenamientoController.generarPlanEntrenamiento);

const testUser = {
  username: 'testUserLLM',
  email: 'testllm@example.com',
  password: 'test1234'
};

beforeAll(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  await request(app).post('/api/auth/signup').send(testUser);
});

afterAll(async () => {
  if (mongoose.connection.db) {
    await mongoose.connection.db.dropDatabase();
  }
  await mongoose.disconnect();
});

describe('LLM Service (integración real)', () => {
  test('Generar prompt de entrenamiento real', async () => {
    const promptData = {
      username: testUser.username,
      objetivo: 'fuerza',
      dias: 3
    };
    const res = await request(app)
      .post(`/api/plan-entrenamiento/generar/${testUser.username}`)
      .send(promptData);
    expect([200, 400]).toContain(res.status);
    if (res.status === 200) {
      expect(res.body.plan).toBeDefined();
    }
  }, 20000);

  test('Error al generar plan con usuario inexistente', async () => {
    const promptData = {
      username: 'noexiste',
      objetivo: 'fuerza',
      dias: 3
    };
    const res = await request(app)
      .post('/api/plan-entrenamiento/generar/noexiste')
      .send(promptData);
    expect(res.status).toBe(404);
  }, 10000);

  test('Error al generar plan con datos inválidos', async () => {
    const promptData = {
      username: testUser.username,
      objetivo: '',
      dias: 0
    };
    const res = await request(app)
      .post(`/api/plan-entrenamiento/generar/${testUser.username}`)
      .send(promptData);
    expect(res.status).toBe(400);
  }, 10000);
});
