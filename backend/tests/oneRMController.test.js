const request = require('supertest');
const express = require('express');
const oneRMController = require('../controllers/oneRMController');
const OneRM = require('../models/OneRM');
const User = require('../models/User');

jest.mock('../models/OneRM');
jest.mock('../models/User');

const app = express();
app.use(express.json());

// Mock helpers
const mockUser = { _id: 'user123', username: 'testuser' };

// Rutas para test
app.post('/api/onerm', oneRMController.registrarOneRM);
app.get('/api/onerm/:username/historial/:ejercicio', oneRMController.obtenerHistorialPorEjercicio);
app.get('/api/onerm/:username/ejercicios', oneRMController.obtenerListaEjercicios);
app.get('/api/onerm/:username/todos', oneRMController.obtenerTodosLosRegistros);
app.delete('/api/onerm/:id', oneRMController.eliminarOneRM);

describe('OneRM Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/onerm', () => {
    test('Registra 1RM correctamente', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      // Mock de instancia para que tras save() tenga los valores esperados
      const fakeOneRM = {
        _id: 'onerm1',
        nombreEjercicio: 'Sentadilla',
        peso: 100,
        fecha: '2024-01-01T00:00:00.000Z',
        save: jest.fn().mockResolvedValue(),
      };
      OneRM.mockImplementation(() => fakeOneRM);
      const res = await request(app)
        .post('/api/onerm')
        .send({ username: 'testuser', nombreEjercicio: 'Sentadilla', peso: 100 });
      expect(res.status).toBe(201);
      expect(res.body.oneRM).toBeDefined();
      expect(res.body.oneRM.nombreEjercicio).toBe('Sentadilla');
    });
    test('Rechaza datos inválidos', async () => {
      const res = await request(app)
        .post('/api/onerm')
        .send({ username: '', nombreEjercicio: '', peso: -5 });
      expect(res.status).toBe(400);
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .post('/api/onerm')
        .send({ username: 'unknown', nombreEjercicio: 'Press', peso: 50 });
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/onerm/:username/historial/:ejercicio', () => {
    test('Devuelve historial de 1RM', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      OneRM.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([
        { _id: '1', peso: 100, fecha: '2024-01-01' },
        { _id: '2', peso: 105, fecha: '2024-02-01' }
      ]) });
      const res = await request(app)
        .get('/api/onerm/testuser/historial/Sentadilla');
      expect(res.status).toBe(200);
      expect(res.body.registros.length).toBe(2);
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .get('/api/onerm/unknown/historial/Sentadilla');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/onerm/:username/ejercicios', () => {
    test('Devuelve lista de ejercicios', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      OneRM.distinct = jest.fn().mockResolvedValue(['Sentadilla', 'Press']);
      const res = await request(app)
        .get('/api/onerm/testuser/ejercicios');
      expect(res.status).toBe(200);
      expect(res.body.ejercicios).toContain('Sentadilla');
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .get('/api/onerm/unknown/ejercicios');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/onerm/:username/todos', () => {
    test('Devuelve todos los registros', async () => {
      User.findOne = jest.fn().mockResolvedValue(mockUser);
      OneRM.find = jest.fn().mockReturnValue({ sort: jest.fn().mockResolvedValue([
        { _id: '1', nombreEjercicio: 'Sentadilla', peso: 100, fecha: '2024-01-01' }
      ]) });
      const res = await request(app)
        .get('/api/onerm/testuser/todos');
      expect(res.status).toBe(200);
      expect(res.body.registros.length).toBe(1);
    });
    test('404 si usuario no existe', async () => {
      User.findOne = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .get('/api/onerm/unknown/todos');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/onerm/:id', () => {
    test('Elimina registro correctamente', async () => {
      OneRM.findByIdAndDelete = jest.fn().mockResolvedValue({ _id: '1' });
      const res = await request(app)
        .delete('/api/onerm/1');
      expect(res.status).toBe(200);
    });
    test('404 si registro no existe', async () => {
      OneRM.findByIdAndDelete = jest.fn().mockResolvedValue(null);
      const res = await request(app)
        .delete('/api/onerm/999');
      expect(res.status).toBe(404);
    });
  });
});
