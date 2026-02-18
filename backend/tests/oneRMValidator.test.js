const { validateOneRMData } = require('../validators/oneRMValidator');

describe('oneRMValidator', () => {
  it('valida datos correctos', () => {
    const data = { username: 'user1', nombreEjercicio: 'Sentadilla', peso: 100 };
    const result = validateOneRMData(data);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('rechaza si faltan campos', () => {
    const data = { username: '', nombreEjercicio: '', peso: null };
    const result = validateOneRMData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Faltan campos/);
  });

  it('rechaza username inválido', () => {
    const data = { username: '!', nombreEjercicio: 'Sentadilla', peso: 100 };
    const result = validateOneRMData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Username inválido/);
  });

  it('rechaza nombreEjercicio inválido', () => {
    const data = { username: 'user1', nombreEjercicio: '', peso: 100 };
    const result = validateOneRMData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/Nombre de ejercicio inválido/);
  });

  it('rechaza peso inválido', () => {
    const data = { username: 'user1', nombreEjercicio: 'Sentadilla', peso: 0 };
    const result = validateOneRMData(data);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/peso/);
  });
});
