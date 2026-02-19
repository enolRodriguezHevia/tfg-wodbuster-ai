const { buscarUsuario, manejarErrorServidor } = require('../utils/controllerHelpers');

jest.mock('../models/User', () => ({
  findOne: jest.fn()
}));
const User = require('../models/User');

describe('controllerHelpers', () => {
  describe('buscarUsuario', () => {
    it('devuelve el usuario si existe', async () => {
      User.findOne.mockResolvedValue({ username: 'testuser' });
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const user = await buscarUsuario('testuser', res);
      expect(user).toEqual({ username: 'testuser' });
      expect(res.status).not.toHaveBeenCalled();
    });
    it('responde 404 si no existe', async () => {
      User.findOne.mockResolvedValue(null);
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const user = await buscarUsuario('unknown', res);
      expect(user).toBeNull();
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ message: 'Usuario no encontrado' });
    });
  });

  describe('manejarErrorServidor', () => {
    it('responde 500 correctamente', () => {
      const res = { status: jest.fn().mockReturnThis(), json: jest.fn() };
      const err = new Error('fail');
      manejarErrorServidor(res, err, 'test', false);
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: 'Error del servidor' }));
    });
  });
});
