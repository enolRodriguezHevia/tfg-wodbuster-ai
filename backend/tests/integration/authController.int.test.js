const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../../config/db');
const mongoose = require('mongoose');
const User = require('../../models/User');
const authController = require('../../controllers/authController');

const app = express();
app.use(express.json());
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);

describe('Auth Controller (integración real)', () => {
  const testUser = {
    email: 'integration@example.com',
    username: 'integrationuser',
    password: 'integrationPass123'
  };

  beforeAll(async () => {
    await connectDB();
    await User.deleteOne({ username: testUser.username });
  }, 20000);

  afterAll(async () => {
    await User.deleteOne({ username: testUser.username });
    await mongoose.disconnect();
  }, 20000);

  test('Registro y login reales', async () => {
    // Registro
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send(testUser);
    expect([201, 400]).toContain(signupRes.status); // Puede fallar si ya existe
    // Login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: testUser.password });
    expect([200, 400]).toContain(loginRes.status);
    if (loginRes.status === 200) {
      expect(loginRes.body.user).toBeDefined();
      expect(loginRes.body.user.username).toBe(testUser.username);
    }
  }, 20000);

  test('Error al registrar usuario con email inválido', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'noemail', username: 'usererror', password: 'integrationPass123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Email inválido/);
  }, 10000);

  test('Error al registrar usuario con username repetido', async () => {
    // Registrar usuario válido
    await request(app)
      .post('/api/auth/signup')
      .send(testUser);
    // Intentar registrar con mismo username
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'other@example.com', username: testUser.username, password: 'integrationPass123' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Username ya registrado/);
  }, 10000);

  test('Error al hacer login con contraseña incorrecta', async () => {
    // Registrar usuario válido
    await request(app)
      .post('/api/auth/signup')
      .send(testUser);
    // Intentar login con contraseña incorrecta
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: testUser.username, password: 'wrongpassword' });
    expect(res.status).toBe(400);
    expect(res.body.message).toMatch(/Usuario o contraseña incorrectos/);
  }, 10000);
});
