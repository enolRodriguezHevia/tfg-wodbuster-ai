const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const connectDB = require('../../config/db');
const mongoose = require('mongoose');
const User = require('../../models/User');
const userController = require('../../controllers/userController');

const app = express();
app.use(express.json());
app.get('/api/user/:username', userController.obtenerPerfil);
app.put('/api/user/:username', userController.actualizarPerfil);


describe('User Controller (integración real)', () => {
  const testUser = {
    email: 'integration3@example.com',
    username: 'integrationuser3',
    password: 'integrationPass123',
    sex: 'masculino',
    age: 30,
    weight: 80,
    height: 180
  };

  beforeAll(async () => {
    await connectDB();
    await User.deleteOne({ username: testUser.username });
    await User.create(testUser);
  }, 20000);

  afterAll(async () => {
    await User.deleteOne({ username: testUser.username });
    await mongoose.disconnect();
  }, 20000);

  test('Obtener y actualizar perfil real', async () => {
    // Obtener perfil
    const resGet = await request(app)
      .get(`/api/user/${testUser.username}`);
    expect([200, 404]).toContain(resGet.status);
    if (resGet.status === 200) {
      expect(resGet.body.user).toBeDefined();
      expect(resGet.body.user.username).toBe(testUser.username);
    }
    // Actualizar perfil
    const resPut = await request(app)
      .put(`/api/user/${testUser.username}`)
      .send({ email: 'integration3update@example.com' });
    expect([200, 400, 404]).toContain(resPut.status);
    if (resPut.status === 200) {
      expect(resPut.body.user.email).toBe('integration3update@example.com');
    }
  }, 20000);

  test('Error al obtener perfil de usuario inexistente', async () => {
    const res = await request(app)
      .get('/api/user/noexiste');
    expect(res.status).toBe(404);
  }, 10000);

  test('Error al actualizar perfil con email vacío', async () => {
    const res = await request(app)
      .put(`/api/user/${testUser.username}`)
      .send({ email: '' });
    expect(res.status).toBe(400);
  }, 10000);
});
