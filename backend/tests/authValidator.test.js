const { validateEmail, validateUsername, validatePassword, validateSex, validateAge, validateWeight, validateHeight } = require('../validators/authValidator');

describe('authValidator', () => {
  describe('validateEmail', () => {
    it('acepta emails válidos', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+alias@domain.co')).toBe(true);
    });
    it('rechaza emails inválidos', () => {
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@.com')).toBe(false);
      expect(validateEmail('test.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    it('acepta usernames válidos', () => {
      expect(validateUsername('usuario_123')).toBe(true);
      expect(validateUsername('user-name')).toBe(true);
    });
    it('rechaza usernames inválidos', () => {
      expect(validateUsername('a')).toBe(false);
      expect(validateUsername('user!@#')).toBe(false);
      expect(validateUsername('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('acepta contraseñas válidas', () => {
      expect(validatePassword('12345678')).toBe(true);
      expect(validatePassword('pass_sin_espacios')).toBe(true);
    });
    it('rechaza contraseñas inválidas', () => {
      expect(validatePassword('1234')).toBe(false);
      expect(validatePassword('con espacios')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateSex', () => {
    it('acepta sexos válidos', () => {
      expect(validateSex('masculino')).toBe(true);
      expect(validateSex('femenino')).toBe(true);
      expect(validateSex('N/D')).toBe(true);
    });
    it('rechaza sexos inválidos', () => {
      expect(validateSex('otro')).toBe(false);
      expect(validateSex('')).toBe(false);
    });
  });

  describe('validateAge', () => {
    it('acepta edades válidas', () => {
      expect(validateAge(0)).toBe(true);
      expect(validateAge(25)).toBe(true);
      expect(validateAge(150)).toBe(true);
    });
    it('rechaza edades inválidas', () => {
      expect(validateAge(-1)).toBe(false);
      expect(validateAge(151)).toBe(false);
      expect(validateAge('noesnumero')).toBe(false);
    });
  });

  describe('validateWeight', () => {
    it('acepta pesos válidos', () => {
      expect(validateWeight(0)).toBe(true);
      expect(validateWeight(80)).toBe(true);
      expect(validateWeight(500)).toBe(true);
    });
    it('rechaza pesos inválidos', () => {
      expect(validateWeight(-1)).toBe(false);
      expect(validateWeight(501)).toBe(false);
      expect(validateWeight('noesnumero')).toBe(false);
    });
  });

  describe('validateHeight', () => {
    it('acepta alturas válidas', () => {
      expect(validateHeight(0)).toBe(true);
      expect(validateHeight(180)).toBe(true);
      expect(validateHeight(300)).toBe(true);
    });
    it('rechaza alturas inválidas', () => {
      expect(validateHeight(-1)).toBe(false);
      expect(validateHeight(301)).toBe(false);
      expect(validateHeight('noesnumero')).toBe(false);
    });
  });
});
