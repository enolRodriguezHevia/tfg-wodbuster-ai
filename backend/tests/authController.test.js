const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const authController = require('../controllers/authController');
const User = require('../models/User');

// Mock del modelo User
jest.mock('../models/User');

// Crear app de Express para testing
const app = express();
app.use(express.json());
app.post('/api/auth/signup', authController.signup);
app.post('/api/auth/login', authController.login);

describe('Auth Controller - Signup', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/signup - Validaciones', () => {
    test('Debería rechazar email inválido', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'invalid-email',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email inválido');
    });

    test('Debería rechazar username inválido (menos de 4 caracteres)', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'usr',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username inválido');
    });

    test('Debería rechazar username inválido (más de 20 caracteres)', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'username_demasiado_largo_para_validar',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username inválido');
    });

    test('Debería rechazar username con caracteres especiales inválidos', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'user@name!',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username inválido');
    });

    test('Debería rechazar contraseña corta (menos de 8 caracteres)', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'pass'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Contraseña inválida');
    });

    test('Debería rechazar contraseña con espacios', async () => {
      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'pass word 123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Contraseña inválida');
    });
  });

  describe('POST /api/auth/signup - Usuarios duplicados', () => {
    test('Debería rechazar email ya registrado', async () => {
      User.findOne.mockResolvedValueOnce({ email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Email ya registrado');
    });

    test('Debería rechazar username ya registrado', async () => {
      User.findOne
        .mockResolvedValueOnce(null) // email no existe
        .mockResolvedValueOnce({ username: 'testuser' }); // username existe

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Username ya registrado');
    });
  });

  describe('POST /api/auth/signup - Registro exitoso', () => {
    test('Debería crear usuario con datos mínimos', async () => {
      User.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue();
      User.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuario creado con éxito');
      expect(mockSave).toHaveBeenCalled();
    });

    test('Debería crear usuario con todos los datos opcionales', async () => {
      User.findOne.mockResolvedValue(null);
      const mockSave = jest.fn().mockResolvedValue();
      User.mockImplementation(() => ({
        save: mockSave
      }));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123',
          sex: 'masculino',
          age: 25,
          weight: 75,
          height: 180
        });

      expect(response.status).toBe(201);
      expect(response.body.message).toBe('Usuario creado con éxito');
      expect(mockSave).toHaveBeenCalled();
    });

    test('Debería hashear la contraseña antes de guardar', async () => {
      User.findOne.mockResolvedValue(null);
      let savedPassword;
      const mockSave = jest.fn().mockResolvedValue();
      User.mockImplementation((userData) => {
        savedPassword = userData.password;
        return { save: mockSave };
      });

      await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });

      expect(savedPassword).not.toBe('password123');
      expect(savedPassword).toHaveLength(60); // bcrypt hash length
    });
  });

  describe('POST /api/auth/signup - Manejo de errores', () => {
    test('Debería manejar errores del servidor', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/signup')
        .send({
          email: 'test@example.com',
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error del servidor');
    });
  });
});

describe('Auth Controller - Login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login - Validaciones', () => {
    test('Debería rechazar login sin username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Usuario o contraseña incorrectos');
    });

    test('Debería rechazar login sin password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Usuario o contraseña incorrectos');
    });

    test('Debería rechazar login sin credenciales', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Usuario o contraseña incorrectos');
    });
  });

  describe('POST /api/auth/login - Usuario no encontrado', () => {
    test('Debería rechazar usuario inexistente', async () => {
      User.findOne.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Usuario o contraseña incorrectos');
    });
  });

  describe('POST /api/auth/login - Contraseña incorrecta', () => {
    test('Debería rechazar contraseña incorrecta', async () => {
      const hashedPassword = await bcrypt.hash('correctpassword', 10);
      User.findOne.mockResolvedValue({
        username: 'testuser',
        password: hashedPassword,
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toBe('Usuario o contraseña incorrectos');
    });
  });

  describe('POST /api/auth/login - Login exitoso', () => {
    test('Debería hacer login correctamente con credenciales válidas', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      User.findOne.mockResolvedValue({
        username: 'testuser',
        password: hashedPassword,
        email: 'test@example.com',
        sex: 'masculino',
        age: 25,
        weight: 75,
        height: 180,
        profilePhoto: null
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.message).toBe('Login exitoso ✅');
      expect(response.body.user).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.email).toBe('test@example.com');
    });

    test('No debería devolver la contraseña en la respuesta', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      User.findOne.mockResolvedValue({
        username: 'testuser',
        password: hashedPassword,
        email: 'test@example.com',
        sex: 'masculino'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user.password).toBeUndefined();
    });

    test('Debería devolver todos los datos del usuario excepto contraseña', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      User.findOne.mockResolvedValue({
        username: 'testuser',
        password: hashedPassword,
        email: 'test@example.com',
        sex: 'femenino',
        age: 30,
        weight: 60,
        height: 165,
        profilePhoto: '/uploads/photo.jpg'
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toEqual({
        username: 'testuser',
        email: 'test@example.com',
        sex: 'femenino',
        age: 30,
        weight: 60,
        height: 165,
        profilePhoto: '/uploads/photo.jpg'
      });
    });
  });

  describe('POST /api/auth/login - Manejo de errores', () => {
    test('Debería manejar errores del servidor', async () => {
      User.findOne.mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(500);
      expect(response.body.message).toBe('Error del servidor');
    });
  });
});
