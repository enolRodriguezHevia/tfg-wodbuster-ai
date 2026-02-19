/// <reference types="cypress" />

describe('AnalisisVideos E2E', () => {
  beforeEach(() => {
    // Asume que la app corre en localhost:3001 (ajusta si es necesario)
    cy.visit('http://localhost:3001/login');
  });

  it('flujo completo: login, navegar y analizar video', () => {
    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección al dashboard o home
    cy.url().should('not.include', '/login');

    // Ir a Análisis de Videos (ajusta el selector si es un link o botón diferente)
    cy.contains('Benchmarks').click();
    cy.url().should('include', '/benchmarks');

    // Seleccionar ejercicio
    cy.contains('Snatch').click();
    cy.url().should('include', '/benchmarks');

    // Registrar nuevo 1RM
    cy.get('input[name="peso"]').type('120');
    cy.get('input[name="fecha"]').clear().type('2026-02-19');
    cy.get('form.onerm-form').submit();

    // Verificar mensaje de éxito
    cy.contains('1RM registrado con éxito').should('be.visible');

    // Verificar que aparece en el historial
    cy.contains('Historial de Registros').should('be.visible');
    cy.contains('120').should('be.visible');
    cy.contains('19/2/2026').should('be.visible');

    // Borrar la marca registrada
    cy.contains('120').parent().parent().within(() => {
      cy.get('button').contains('Eliminar').click();
    });
    // Confirmar en el modal
    cy.get('.btn-modal-action.btn-eliminar').should('be.visible').click();

    // Verificar que desaparece el registro
    cy.contains('120').should('not.exist');
    cy.contains('19/2/2026').should('not.exist');
  });
});
