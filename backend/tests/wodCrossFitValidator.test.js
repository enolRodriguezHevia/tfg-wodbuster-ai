const { validateWodData } = require('../validators/wodCrossFitValidator');

describe('wodCrossFitValidator', () => {
  it('valida datos correctos', () => {
    const data = { username: 'user1', nombreWod: 'Fran', nivel: 'rx', tiempo: 300 };
    const result = validateWodData(data);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('rechaza si faltan campos', () => {
    const data = { username: '', nombreWod: '', nivel: '', tiempo: undefined };
    const result = validateWodData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Faltan campos/);
  });

  it('rechaza username inválido', () => {
    const data = { username: '!', nombreWod: 'Fran', nivel: 'rx', tiempo: 300 };
    const result = validateWodData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Username inválido/);
  });

  it('rechaza nombreWod inválido', () => {
    const data = { username: 'user1', nombreWod: 'NoExiste', nivel: 'rx', tiempo: 300 };
    const result = validateWodData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/WOD inválido/);
  });

  it('rechaza nivel inválido', () => {
    const data = { username: 'user1', nombreWod: 'Fran', nivel: 'pro', tiempo: 300 };
    const result = validateWodData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Nivel inválido/);
  });
});
