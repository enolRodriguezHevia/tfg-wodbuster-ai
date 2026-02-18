
const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const User = require('../models/User');
const PlanEntrenamiento = require('../models/PlanEntrenamiento');
const Entrenamiento = require('../models/Entrenamiento');
const OneRM = require('../models/OneRM');
const WodCrossFit = require('../models/WodCrossFit');


const llmService = require('../services/llmService');

const app = express();
app.use(express.json());
app.post('/api/plan/:username', require('../controllers/planEntrenamientoController').generarPlanEntrenamiento);
app.get('/api/plan/:username/anteriores', require('../controllers/planEntrenamientoController').obtenerPlanesAnteriores);
app.get('/api/plan/:username/:planId', require('../controllers/planEntrenamientoController').obtenerPlanPorId);
app.delete('/api/plan/:username/:planId', require('../controllers/planEntrenamientoController').eliminarPlan);

// Mocks para la mayoría de tests
jest.mock('../models/User');
jest.mock('../models/PlanEntrenamiento');
jest.mock('../models/Entrenamiento');
jest.mock('../models/OneRM');
jest.mock('../models/WodCrossFit');
jest.mock('../services/llmService');
// Test de integración real SOLO si hay API KEY
// ...tests unitarios únicamente...

describe('PlanEntrenamiento Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock global para OneRM.find
    OneRM.find.mockImplementation(() => ({
      sort: () => Promise.resolve([])
    }));
    // Mock global para WodCrossFit.find
    WodCrossFit.find.mockImplementation(() => ({
      sort: () => Promise.resolve([])
    }));
    // Mock global para Ejercicio.find
    const emptyEjercicio = { sort: () => Promise.resolve([]) };
    require('../models/Ejercicio').find = jest.fn().mockImplementation(() => emptyEjercicio);
  });

  describe('POST /api/plan/:username', () => {
        // Mock por defecto para tests que no lo sobrescriben
        Entrenamiento.find.mockImplementation(() => ({
          sort: () => Promise.resolve([])
        }));
    test('Genera plan correctamente con OpenAI', async () => {
            Entrenamiento.find.mockImplementation(() => ({
              sort: () => Promise.resolve([
                { _id: entrenamientoId, userId, fecha: new Date(), volumenTotal: 100 }
              ])
            }));
      const Ejercicio = require('../models/Ejercicio');
      const userId = 'user1';
      const entrenamientoId = 'ent1';
      Ejercicio.find = jest.fn().mockImplementation(({ entrenamientoId: eid }) => ({
        sort: () => Promise.resolve(
          eid === entrenamientoId
            ? [
                { _id: 'ej1', userId, entrenamientoId, nombre: 'Sentadilla', series: 3, repeticiones: 10, peso: 100, valoracion: 8 }
              ]
            : []
        )
      }));
      const userMock = {
        _id: userId,
        username: 'testuser',
        sex: 'masculino',
        age: 25,
        weight: 70,
        height: 180
      };
      User.findOne.mockResolvedValue(userMock);
      User.findById = jest.fn().mockResolvedValue(userMock);
      Entrenamiento.find.mockImplementation(() => ({
        sort: () => Promise.resolve([
          { _id: entrenamientoId, userId, fecha: new Date(), volumenTotal: 100 }
        ])
      }));
      OneRM.find.mockImplementation(() => ({
        sort: () => Promise.resolve([
          { _id: 'rm1', userId, nombreEjercicio: 'Sentadilla', peso: 100, fecha: new Date() }
        ])
      }));
      WodCrossFit.find.mockImplementation(() => ({
        sort: () => Promise.resolve([])
      }));
      llmService.generarPlanEntrenamiento.mockResolvedValue({
        success: true,
        plan: 'Plan generado por OpenAI',
        modelo: 'GPT-4o',
        provider: 'openai',
        fallback: false
      });
      PlanEntrenamiento.prototype.save = jest.fn().mockResolvedValue();
      const res = await request(app)
        .post('/api/plan/testuser')
        .send({ nombre: 'Mi plan' });
      expect(res.status).toBe(200);
      expect(res.body.plan).toContain('OpenAI');
      expect(res.body.metadata.modelo).toBe('GPT-4o');
      expect(res.body.metadata.provider).toBe('openai');
    });

    test('Genera plan correctamente con Claude', async () => {
            Entrenamiento.find.mockImplementation(() => ({
              sort: () => Promise.resolve([
                { _id: entrenamientoId, userId, fecha: new Date(), volumenTotal: 120 }
              ])
            }));
      const Ejercicio = require('../models/Ejercicio');
      const userId = 'user1';
      const entrenamientoId = 'ent1';
      Ejercicio.find = jest.fn().mockImplementation(({ entrenamientoId: eid }) => ({
        sort: () => Promise.resolve(
          eid === entrenamientoId
            ? [
                { _id: 'ej2', userId, entrenamientoId, nombre: 'Press Banca', series: 4, repeticiones: 8, peso: 80, valoracion: 9 }
              ]
            : []
        )
      }));
      const userMock = {
        _id: userId,
        username: 'testuser',
        sex: 'masculino',
        age: 25,
        weight: 70,
        height: 180
      };
      User.findOne.mockResolvedValue(userMock);
      User.findById = jest.fn().mockResolvedValue(userMock);
      Entrenamiento.find.mockImplementation(() => ({
        sort: () => Promise.resolve([
          { _id: entrenamientoId, userId, fecha: new Date(), volumenTotal: 120 }
        ])
      }));
      OneRM.find.mockImplementation(() => ({
        sort: () => Promise.resolve([
          { _id: 'rm2', userId, nombreEjercicio: 'Press Banca', peso: 80, fecha: new Date() }
        ])
      }));
      WodCrossFit.find.mockImplementation(() => ({
        sort: () => Promise.resolve([])
      }));
      llmService.generarPlanEntrenamiento.mockResolvedValue({
        success: true,
        plan: 'Plan generado por Claude',
        modelo: 'Claude Sonnet 4.5',
        provider: 'anthropic',
        fallback: false
      });
      PlanEntrenamiento.prototype.save = jest.fn().mockResolvedValue();
      const res = await request(app)
        .post('/api/plan/testuser')
        .send({ nombre: 'Mi plan' });
      expect(res.status).toBe(200);
      expect(res.body.plan).toContain('Claude');
      expect(res.body.metadata.modelo).toMatch(/claude/i);
      expect(res.body.metadata.provider).toMatch(/anthropic/i);
    });

    test('400 si falta información básica', async () => {
            Entrenamiento.find.mockImplementation(() => ({
              sort: () => Promise.resolve([])
            }));
      const Ejercicio = require('../models/Ejercicio');
      Ejercicio.find = jest.fn().mockImplementation(() => ({
        sort: () => Promise.resolve([])
      }));
      const userMock = {
        _id: 'user1',
        username: 'testuser',
        sex: 'N/D',
        age: null,
        weight: null,
        height: null
      };
      User.findOne.mockResolvedValue(userMock);
      User.findById = jest.fn().mockResolvedValue(userMock);
      Entrenamiento.find.mockImplementation(() => ({
        sort: () => Promise.resolve([])
      }));
      OneRM.find.mockImplementation(() => ({
        sort: () => Promise.resolve([])
      }));
      WodCrossFit.find.mockImplementation(() => ({
        sort: () => Promise.resolve([])
      }));
      const res = await request(app)
        .post('/api/plan/testuser')
        .send({ nombre: 'Mi plan' });
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('404 si usuario no existe', async () => {
            Entrenamiento.find.mockImplementation(() => ({
              sort: () => Promise.resolve([])
            }));
      User.findOne.mockResolvedValue(null);
      const res = await request(app)
        .post('/api/plan/unknown')
        .send({ nombre: 'Mi plan' });
      expect(res.status).toBe(404);
    });

    test('500 si el LLM falla', async () => {
            Entrenamiento.find.mockImplementation(() => ({
              sort: () => Promise.resolve([])
            }));
      User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser', sex: 'masculino', age: 25, weight: 70, height: 180 });
      Entrenamiento.find.mockResolvedValue([]);
      OneRM.find.mockResolvedValue([]);
      WodCrossFit.find.mockResolvedValue([]);
      llmService.generarPlanEntrenamiento = jest.fn().mockResolvedValue({
        success: false,
        error: 'Error LLM'
      });
      const res = await request(app)
        .post('/api/plan/testuser')
        .send({ nombre: 'Mi plan' });
      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
    });
  });

  describe('GET /api/plan/:username/anteriores', () => {
    test('Devuelve planes anteriores', async () => {
      User.findOne.mockResolvedValue({ _id: 'user1' });
      PlanEntrenamiento.find.mockReturnValue({ sort: jest.fn().mockResolvedValue([{ _id: 'plan1', titulo: 'Plan 1' }]) });
      const res = await request(app)
        .get('/api/plan/testuser/anteriores');
      expect(res.status).toBe(200);
      expect(res.body.planes.length).toBeGreaterThan(0);
    });
    test('404 si usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app)
        .get('/api/plan/unknown/anteriores');
      expect(res.status).toBe(404);
    });
  });

  describe('GET /api/plan/:username/:planId', () => {
    test('Devuelve plan por ID', async () => {
      User.findOne.mockResolvedValue({ _id: 'user1' });
      PlanEntrenamiento.findOne.mockResolvedValue({ _id: 'plan1', titulo: 'Plan 1' });
      const res = await request(app)
        .get('/api/plan/testuser/plan1');
      expect(res.status).toBe(200);
      expect(res.body.plan).toBeDefined();
    });
    test('404 si usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app)
        .get('/api/plan/unknown/plan1');
      expect(res.status).toBe(404);
    });
    test('404 si plan no existe', async () => {
      User.findOne.mockResolvedValue({ _id: 'user1' });
      PlanEntrenamiento.findOne.mockResolvedValue(null);
      const res = await request(app)
        .get('/api/plan/testuser/planX');
      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/plan/:username/:planId', () => {
    test('Elimina plan correctamente', async () => {
      User.findOne.mockResolvedValue({ _id: 'user1' });
      PlanEntrenamiento.findOneAndDelete.mockResolvedValue({ _id: 'plan1' });
      const res = await request(app)
        .delete('/api/plan/testuser/plan1');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });
    test('404 si usuario no existe', async () => {
      User.findOne.mockResolvedValue(null);
      const res = await request(app)
        .delete('/api/plan/unknown/plan1');
      expect(res.status).toBe(404);
    });
    test('404 si plan no existe', async () => {
      User.findOne.mockResolvedValue({ _id: 'user1' });
      PlanEntrenamiento.findOneAndDelete.mockResolvedValue(null);
      const res = await request(app)
        .delete('/api/plan/testuser/planX');
      expect(res.status).toBe(404);
    });
  });
});
