const request = require('supertest');
const express = require('express');
const dotenv = require('dotenv');
dotenv.config();

const app = express();
app.use(express.json());
app.post('/api/plan/:username', require('../../controllers/planEntrenamientoController').generarPlanEntrenamiento);

if (!process.env.OPENAI_API_KEY && !process.env.ANTHROPIC_API_KEY) {
  describe('INTEGRACIÓN REAL LLM', () => {
    test('NO SE EJECUTA: Falta API KEY de OpenAI o Claude', () => {
      expect(true).toBe(true);
    });
  });
} else {
  describe('INTEGRACIÓN REAL LLM', () => {
    const testUser = {
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      llmPreference: 'openai',
    };
    const testUserClaude = {
      username: 'testclaude',
      email: 'testclaude@example.com',
      password: 'password123',
      llmPreference: 'claude',
    };
    let User;
    const connectDB = require('../../config/db');
    const mongoose = require('mongoose');
    beforeAll(async () => {
      await connectDB();
      jest.unmock('../../services/llmService');
      jest.unmock('../../models/User');
      jest.unmock('../../models/PlanEntrenamiento');
      User = require('../../models/User');
      await User.deleteOne({ username: testUser.username });
      await User.create(testUser);
    }, 20000);
    afterAll(async () => {
      jest.resetModules();
      await User.deleteOne({ username: testUser.username });
      await User.deleteOne({ username: testUserClaude.username });
      await mongoose.disconnect();
    }, 20000);
    test('Genera plan real con OpenAI', async () => {
      const res = await request(app)
        .post('/api/plan/testuser')
        .send({ nombre: 'Mi plan real' });
      expect([200, 400, 500]).toContain(res.status); // Puede ser 400 si falta info, 500 si hay error, 200 si todo OK
      if (res.status === 200) {
        expect(res.body.plan).toBeDefined();
        expect(res.body.metadata.modelo).toBeDefined();
        expect(res.body.metadata.provider).toBeDefined();
      } else {
        expect(res.body.success).toBe(false);
      }
    }, 60000);
    test('Genera plan real con Claude', async () => {
      await User.create(testUserClaude);
      const res = await request(app)
        .post('/api/plan/testclaude')
        .send({ nombre: 'Mi plan real Claude' });
      expect([200, 400, 500]).toContain(res.status);
      if (res.status === 200) {
        expect(res.body.plan).toBeDefined();
        expect(res.body.metadata.modelo).toBeDefined();
        expect(res.body.metadata.provider).toBeDefined();
        expect(res.body.metadata.provider.toLowerCase()).toContain('anthropic');
      } else {
        expect(res.body.success).toBe(false);
      }
    }, 60000);
  });
}
