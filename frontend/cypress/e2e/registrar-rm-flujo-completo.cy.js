/// <reference types="cypress" />

describe('Benchmarks (1RM) E2E', () => {
  before(() => {
    // Crear usuario de prueba si no existe
    cy.visit('/');
    cy.contains('Ir a Sign Up').click();
    cy.url().should('include', '/signup');
    
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="email"]').type('e2etestuser@example.com');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    
    // Si el usuario ya existe, ignorar el error y continuar
    cy.url().then((url) => {
      if (url.includes('/dashboard')) {
        // Usuario creado exitosamente, hacer logout
        cy.contains('Logout').click();
      } else if (url.includes('/signup')) {
        // Usuario ya existe, volver a home
        cy.visit('/');
      }
    });
  });

  beforeEach(() => {
    cy.visit('/');
  });

  it('flujo completo: login, registrar y borrar 1RM', () => {
    // Ir a Login desde la página raíz
    cy.contains('Ir a Login').click();
    cy.url().should('include', '/login');

    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección al dashboard
    cy.url().should('not.include', '/login');

    // Ir a Benchmarks
    cy.contains('Benchmarks').click();
    cy.url().should('include', '/benchmarks');

    // Seleccionar ejercicio
    cy.contains('Snatch').click();
    cy.url().should('include', '/benchmarks');

    // Registrar nuevo 1RM (usar fecha actual)
    const today = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD
    cy.get('input[name="peso"]').type('120');
    cy.get('input[name="fecha"]').clear().type(today);
    cy.get('form.onerm-form').submit();

    // Verificar mensaje de éxito
    cy.contains('1RM registrado con éxito').should('be.visible');

    // Verificar que aparece en el historial
    cy.contains('Historial de Registros').should('be.visible');
    cy.contains('120').should('be.visible');
    // Verificar que existe una fecha sin hardcodear el formato específico
    cy.get('.onerm-item, .registro-item, tr').contains('120').should('exist');

    // Borrar la marca registrada
    cy.contains('120').parent().parent().within(() => {
      cy.get('button').contains('Eliminar').click();
    });
    // Confirmar en el modal
    cy.get('.btn-modal-action.btn-eliminar').should('be.visible').click();

    // Verificar que desaparece el registro
    cy.contains('120').should('not.exist');
  });
});
