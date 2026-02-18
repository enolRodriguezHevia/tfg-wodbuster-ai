const { validateEjercicios } = require('../validators/entrenamientoValidator');

describe('entrenamientoValidator', () => {
  it('valida un array de ejercicios correcto', () => {
    const ejercicios = [
      { nombre: 'Sentadilla', series: 3, repeticiones: 10, peso: 100, valoracion: 8 },
      { nombre: 'Press', series: 4, repeticiones: 8, peso: 80, valoracion: 7 }
    ];
    const result = validateEjercicios(ejercicios);
    expect(result.valid).toBe(true);
    expect(result.error).toBeNull();
  });

  it('rechaza array vacío', () => {
    const result = validateEjercicios([]);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/no vacío/);
  });

  it('rechaza si falta nombre', () => {
    const ejercicios = [
      { series: 3, repeticiones: 10, peso: 100, valoracion: 8 }
    ];
    const result = validateEjercicios(ejercicios);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/nombre/);
  });

  it('rechaza si series < 1', () => {
    const ejercicios = [
      { nombre: 'Sentadilla', series: 0, repeticiones: 10, peso: 100, valoracion: 8 }
    ];
    const result = validateEjercicios(ejercicios);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/series/);
  });
});
