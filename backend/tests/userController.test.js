const request = require('supertest');
const express = require('express');
jest.mock('../services/s3Service', () => ({
  uploadProfilePhotoToS3: jest.fn().mockResolvedValue('https://fake-s3-url.com/foto.png')
}));
const userController = require('../controllers/userController');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

jest.mock('../models/User');

const app = express();
app.use(express.json());
app.use(authMiddleware); // Simula autenticación
app.get('/api/user/:username', userController.obtenerPerfil);
app.put('/api/user/:username', userController.actualizarPerfil);
app.delete('/api/user/:username', userController.eliminarCuenta);
app.post('/api/user/:username/photo', userController.subirFotoPerfil);

// Mock de autenticación siempre OK
jest.mock('../middleware/authMiddleware', () => (req, res, next) => next());

describe('User Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/user/:username', () => {
    test('Devuelve perfil si existe', async () => {
      User.findOne = jest.fn().mockResolvedValue({
        username: 'testuser', email: 'test@example.com', sex: 'masculino', age: 25, weight: 70, height: 180, profilePhoto: null
      });
      const res = await request(app).get('/api/user/testuser');
      expect(res.status).toBe(200);
      expect(res.body.user).toBeDefined();
      expect(res.body.user.username).toBe('testuser');
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app).get('/api/user/unknown');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/user/:username', () => {
    test('Actualiza email válido', async () => {
      const mockUser = {
        username: 'testuser',
        email: 'old@example.com',
        save: jest.fn().mockResolvedValue(),
        set: jest.fn(),
      };
      User.findOne = jest.fn()
        .mockResolvedValueOnce(mockUser) // para buscar usuario
        .mockResolvedValueOnce(null);   // para comprobar email duplicado
      const res = await request(app)
        .put('/api/user/testuser')
        .send({ email: 'new@example.com' });
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('new@example.com');
    });
    test('Rechaza email vacío', async () => {
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser' });
      const res = await request(app)
        .put('/api/user/testuser')
        .send({ email: '' });
      expect(res.status).toBe(400);
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .put('/api/user/unknown')
        .send({ email: 'a@a.com' });
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/user/:username', () => {
    test('Elimina cuenta con contraseña correcta', async () => {
      const mockUser = {
        username: 'testuser',
        password: await require('bcrypt').hash('password123', 10),
        profilePhoto: null,
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      User.deleteOne = jest.fn().mockResolvedValue({ deletedCount: 1 });
      const res = await request(app)
        .delete('/api/user/testuser')
        .send({ password: 'password123' });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    test('Rechaza si falta contraseña', async () => {
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser' });
      const res = await request(app)
        .delete('/api/user/testuser')
        .send({ password: '' });
      expect(res.status).toBe(400);
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .delete('/api/user/unknown')
        .send({ password: 'x' });
      expect(res.status).toBe(404);
    });
    test('Rechaza si contraseña incorrecta', async () => {
      const mockUser = {
        username: 'testuser',
        password: await require('bcrypt').hash('password123', 10),
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const res = await request(app)
        .delete('/api/user/testuser')
        .send({ password: 'wrongpass' });
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/user/:username/llm/config', () => {
    beforeAll(() => {
      // Mock select() para User.findOne como función async
      User.findOne = jest.fn(() => ({
        select: jest.fn().mockResolvedValue({ llmPreference: 'claude' })
      }));
      app.get('/api/user/:username/llm/config', userController.obtenerConfiguracionLLM);
    });
    afterAll(() => jest.clearAllMocks());
    test('Devuelve configuración LLM si usuario existe', async () => {
      const res = await request(app).get('/api/user/testuser/llm/config');
      expect(res.status).toBe(200);
      expect(res.body.llmPreference).toBe('claude');
      expect(res.body.modelosInfo).toBeDefined();
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn(() => ({ select: jest.fn().mockResolvedValue(null) }));
      const res = await request(app).get('/api/user/unknown/llm/config');
      expect(res.status).toBe(404);
    });
  });

  describe('PUT /api/user/:username/llm/preference', () => {
    beforeAll(() => {
      app.put('/api/user/:username/llm/preference', userController.actualizarPreferenciaLLM);
    });
    afterAll(() => jest.clearAllMocks());
    test('Actualiza preferencia LLM correctamente', async () => {
      const mockUser = {
        username: 'testuser',
        llmPreference: 'openai',
        save: jest.fn().mockResolvedValue(),
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const res = await request(app)
        .put('/api/user/testuser/llm/preference')
        .send({ llmPreference: 'claude' });
      expect(res.status).toBe(200);
      expect(res.body.message).toMatch(/actualizad[oa]/i);
      expect(mockUser.llmPreference).toBe('claude');
    });
    test('Rechaza preferencia inválida', async () => {
      const mockUser = {
        username: 'testuser',
        llmPreference: 'openai',
        save: jest.fn().mockResolvedValue(),
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const res = await request(app)
        .put('/api/user/testuser/llm/preference')
        .send({ llmPreference: 'modelo_invalido' });
      expect(res.status).toBe(400);
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .put('/api/user/unknown/llm/preference')
        .send({ llmPreference: 'claude' });
      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/user/:username/photo', () => {
    const multer = require('multer');
    const path = require('path');
    const fs = require('fs');
    // Mock de multer y fs
    jest.mock('multer');
    jest.spyOn(fs, 'existsSync').mockReturnValue(false);
    jest.spyOn(fs, 'unlinkSync').mockImplementation(() => {});

    test('Sube foto correctamente', async () => {
      // Registrar ruta con fakeUpload solo para este test
      const localApp = express();
      localApp.use(express.json());
      const fakeUpload = (req, res, next) => {
        req.file = {
          buffer: Buffer.from('fake image data'),
          originalname: 'foto.png',
          mimetype: 'image/png'
        };
        next();
      };
      localApp.post('/api/user/:username/photo', fakeUpload, userController.subirFotoPerfil);
      const mockUser = {
        username: 'testuser',
        profilePhoto: null,
        save: jest.fn().mockResolvedValue(),
      };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const res = await request(localApp)
        .post('/api/user/testuser/photo');
      expect([200, 201]).toContain(res.status);
      expect(res.body.message).toMatch(/actualizad[oa]/i);
    });

    test('Error si no se adjunta imagen', async () => {
      // Registrar ruta sin req.file solo para este test
      const localApp = express();
      localApp.use(express.json());
      localApp.post('/api/user/:username/photo', (req, res, next) => { req.file = undefined; next(); }, userController.subirFotoPerfil);
      const mockUser = { username: 'testuser', save: jest.fn().mockResolvedValue() };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const res = await request(localApp)
        .post('/api/user/testuser/photo');
      expect(res.status).toBe(400);
    });

    test('404 si usuario no existe', async () => {
      // Registrar ruta con fakeUpload solo para este test
      const localApp = express();
      localApp.use(express.json());
      const fakeUpload = (req, res, next) => {
        req.file = {
          path: 'uploads/profiles/profile-123.png',
          originalname: 'foto.png',
          mimetype: 'image/png',
        };
        next();
      };
      localApp.post('/api/user/:username/photo', fakeUpload, userController.subirFotoPerfil);
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(localApp)
        .post('/api/user/unknown/photo')
        .set('Content-Type', 'multipart/form-data')
        .send();
      expect([404, 400]).toContain(res.status);
    });
  });
  // Cobertura extra
  describe('PUT /api/user/:username datos inválidos', () => {
    test('Rechaza sexo inválido', async () => {
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser', save: jest.fn(), set: jest.fn() });
      const res = await request(app)
        .put('/api/user/testuser')
        .send({ sex: 'otro' });
      expect(res.status).toBe(400);
    });
    test('Rechaza edad inválida', async () => {
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser', save: jest.fn(), set: jest.fn() });
      const res = await request(app)
        .put('/api/user/testuser')
        .send({ age: -5 });
      expect(res.status).toBe(400);
    });
    test('Rechaza peso inválido', async () => {
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser', save: jest.fn(), set: jest.fn() });
      const res = await request(app)
        .put('/api/user/testuser')
        .send({ weight: 'noesnumero' });
      expect(res.status).toBe(400);
    });
    test('Rechaza altura inválida', async () => {
      User.findOne = jest.fn().mockResolvedValue({
        username: 'testuser',
        save: jest.fn().mockResolvedValue(),
        set: jest.fn()
      });
      const res = await request(app)
        .put('/api/user/testuser')
        .send({ height: 'noesnumero' });
      expect(res.status).toBe(400);
    });
    test('Rechaza email duplicado', async () => {
      const mockUser = { username: 'testuser', email: 'old@example.com', save: jest.fn(), set: jest.fn() };
      User.findOne = jest.fn()
        .mockResolvedValueOnce(mockUser) // para buscar usuario
        .mockResolvedValueOnce({ username: 'other', email: 'new@example.com' }); // para comprobar email duplicado
      const res = await request(app)
        .put('/api/user/testuser')
        .send({ email: 'new@example.com' });
      expect(res.status).toBe(400);
    });
  });

  describe('DELETE /api/user/:username', () => {
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .delete('/api/user/unknown')
        .send({ password: '12345678' });
      expect(res.status).toBe(404);
    });
    test('Rechaza si falta contraseña', async () => {
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser', password: 'hash', save: jest.fn() });
      const res = await request(app)
        .delete('/api/user/testuser')
        .send({ });
      expect(res.status).toBe(400);
    });
    test('Rechaza si contraseña incorrecta', async () => {
      const bcrypt = require('bcrypt');
      User.findOne = jest.fn().mockResolvedValue({ username: 'testuser', password: 'hash', save: jest.fn() });
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      const res = await request(app)
        .delete('/api/user/testuser')
        .send({ password: 'wrongpass' });
      expect(res.status).toBe(400);
      bcrypt.compare.mockRestore();
    });
  });

  describe('LLM config y preferencia', () => {
    beforeAll(() => {
      app.get('/api/user/:username/llm/config', userController.obtenerConfiguracionLLM);
      app.put('/api/user/:username/llm/preference', userController.actualizarPreferenciaLLM);
    });
    test('GET /api/user/:username/llm/config devuelve config si usuario existe', async () => {
      // Mock que soporta .select()
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue({ username: 'testuser', llmPreference: 'claude' })
      });
      const res = await request(app).get('/api/user/testuser/llm/config');
      expect(res.status).toBe(200);
      expect(res.body.llmPreference).toBe('claude');
    });
    test('GET /api/user/:username/llm/config 404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockReturnValue({
        select: jest.fn().mockResolvedValue(null)
      });
      const res = await request(app).get('/api/user/unknown/llm/config');
      expect(res.status).toBe(404);
    });
    test('PUT /api/user/:username/llm/preference actualiza preferencia válida', async () => {
      const mockUser = { username: 'testuser', llmPreference: 'claude', save: jest.fn() };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const res = await request(app)
        .put('/api/user/testuser/llm/preference')
        .send({ llmPreference: 'openai' });
      expect(res.status).toBe(200);
      expect(res.body.llmPreference).toBe('openai');
    });
    test('PUT /api/user/:username/llm/preference rechaza preferencia inválida', async () => {
      const mockUser = { username: 'testuser', llmPreference: 'claude', save: jest.fn() };
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      const res = await request(app)
        .put('/api/user/testuser/llm/preference')
        .send({ llmPreference: 'otro' });
      expect(res.status).toBe(400);
    });
    test('PUT /api/user/:username/llm/preference 404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .put('/api/user/unknown/llm/preference')
        .send({ llmPreference: 'openai' });
      expect(res.status).toBe(404);
    });
  });

});
