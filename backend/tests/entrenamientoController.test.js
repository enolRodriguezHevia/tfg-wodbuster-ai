const request = require('supertest');
const express = require('express');
const Entrenamiento = require('../models/Entrenamiento');
const Ejercicio = require('../models/Ejercicio');
const User = require('../models/User');
const {
  obtenerEntrenamientos,
  registrarEntrenamiento,
  obtenerEntrenamientoPorId,
  eliminarEntrenamiento,
  obtenerEstadisticas
} = require('../controllers/entrenamientoController');

jest.mock('../models/Entrenamiento');
jest.mock('../models/Ejercicio');
jest.mock('../models/User');

const app = express();
app.use(express.json());
app.get('/api/entrenamiento/:username', obtenerEntrenamientos);
app.post('/api/entrenamiento/:username', registrarEntrenamiento);
app.get('/api/entrenamiento/id/:id', obtenerEntrenamientoPorId);
app.delete('/api/entrenamiento/:id', eliminarEntrenamiento);
app.get('/api/entrenamiento/:username/stats', obtenerEstadisticas);

describe('Entrenamiento Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('GET /api/entrenamiento/:username devuelve entrenamientos del usuario', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    Entrenamiento.find.mockImplementation(() => ({
      sort: () => Promise.resolve([
        { _id: 'ent1', fecha: new Date(), volumenTotal: 100 }
      ])
    }));
    Ejercicio.find.mockResolvedValue([
      { _id: 'ej1', nombre: 'Sentadilla', series: 3, repeticiones: 10, peso: 100, valoracion: 8 }
    ]);
    const res = await request(app).get('/api/entrenamiento/testuser');
    expect(res.status).toBe(200);
    expect(res.body.entrenamientos.length).toBe(1);
    expect(res.body.entrenamientos[0].volumenTotal).toBe(100);
    expect(res.body.entrenamientos[0].ejercicios.length).toBe(1);
    expect(res.body.entrenamientos[0].ejercicios[0].nombre).toBe('Sentadilla');
  });

  test('POST /api/entrenamiento/:username crea un entrenamiento', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    const entrenamientoMock = {
      _id: 'ent2',
      fecha: new Date(),
      volumenTotal: 200
    };
    Entrenamiento.prototype.save = jest.fn().mockImplementation(function() {
      Object.assign(this, entrenamientoMock);
      return Promise.resolve();
    });
    Ejercicio.insertMany.mockResolvedValue([
      { _id: 'ej2', nombre: 'Press Banca', series: 4, repeticiones: 8, peso: 80, valoracion: 9 }
    ]);
    const res = await request(app)
      .post('/api/entrenamiento/testuser')
      .send({ username: 'testuser', fecha: new Date(), ejercicios: [
        { nombre: 'Press Banca', series: 4, repeticiones: 8, peso: 80, valoracion: 9 }
      ] });
    expect(res.status).toBe(201);
    expect(res.body.entrenamiento.volumenTotal).toBe(200);
    expect(res.body.entrenamiento.ejercicios.length).toBe(1);
    expect(res.body.entrenamiento.ejercicios[0].nombre).toBe('Press Banca');
    expect(res.body.message).toMatch(/registrado/i);
  });

  test('GET /api/entrenamiento/:username 404 si usuario no existe', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/entrenamiento/unknown');
    expect(res.status).toBe(404);
  });

  // Cobertura extra
  test('GET /api/entrenamiento/id/:id devuelve entrenamiento por ID', async () => {
    Entrenamiento.findById.mockResolvedValue({ _id: 'ent1', fecha: new Date(), volumenTotal: 100 });
    Ejercicio.find.mockResolvedValue([
      { _id: 'ej1', nombre: 'Sentadilla', series: 3, repeticiones: 10, peso: 100, valoracion: 8 }
    ]);
    const res = await request(app).get('/api/entrenamiento/id/ent1');
    expect(res.status).toBe(200);
    expect(res.body.entrenamiento.volumenTotal).toBe(100);
    expect(res.body.entrenamiento.ejercicios[0].nombre).toBe('Sentadilla');
  });

  test('GET /api/entrenamiento/id/:id 404 si no existe', async () => {
    Entrenamiento.findById.mockResolvedValue(null);
    const res = await request(app).get('/api/entrenamiento/id/unknown');
    expect(res.status).toBe(404);
  });

  test('DELETE /api/entrenamiento/:id elimina entrenamiento y ejercicios', async () => {
    Entrenamiento.findByIdAndDelete.mockResolvedValue({ _id: 'ent1' });
    Ejercicio.deleteMany.mockResolvedValue({ deletedCount: 2 });
    const res = await request(app).delete('/api/entrenamiento/ent1');
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/eliminados/);
  });

  test('DELETE /api/entrenamiento/:id 404 si no existe', async () => {
    Entrenamiento.findByIdAndDelete.mockResolvedValue(null);
    const res = await request(app).delete('/api/entrenamiento/unknown');
    expect(res.status).toBe(404);
  });

  test('GET /api/entrenamiento/:username/stats devuelve estadísticas', async () => {
    User.findOne.mockResolvedValue({ _id: 'user1', username: 'testuser' });
    Entrenamiento.find.mockResolvedValue([
      { volumenTotal: 100 },
      { volumenTotal: 200 }
    ]);
    const res = await request(app).get('/api/entrenamiento/testuser/stats');
    expect(res.status).toBe(200);
    expect(res.body.stats.totalEntrenamientos).toBe(2);
    expect(res.body.stats.volumenTotalAcumulado).toBe(300);
    expect(res.body.stats.promedioVolumenPorEntrenamiento).toBe(150);
  });

  test('GET /api/entrenamiento/:username/stats 404 si usuario no existe', async () => {
    User.findOne.mockResolvedValue(null);
    const res = await request(app).get('/api/entrenamiento/unknown/stats');
    expect(res.status).toBe(404);
  });

});
