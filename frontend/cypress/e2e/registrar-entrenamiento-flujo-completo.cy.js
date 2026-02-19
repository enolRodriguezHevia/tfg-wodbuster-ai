/// <reference types="cypress" />

describe('Entrenamientos E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3001/login');
  });

  it('flujo completo: login, registrar y borrar entrenamiento', () => {
    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');

    // Ir a Entrenamientos
    cy.contains('Entrenamientos').click();
    cy.url().should('include', '/entrenamientos');

    // Abrir formulario
    cy.get('button.btn-nuevo-entrenamiento').click();
    cy.get('form.entrenamiento-form').should('be.visible');

    // Rellenar datos del primer ejercicio
    cy.get('select').first().select('Squat');
    cy.get('input').eq(1).clear().type('3'); // series
    cy.get('input').eq(2).clear().type('5'); // repeticiones
    cy.get('input').eq(3).clear().type('100'); // peso
    cy.get('input').eq(4).clear().type('8'); // valoración

    // Guardar entrenamiento
    cy.get('button.btn-submit').click();

    // Verificar mensaje de éxito
    cy.contains('Entrenamiento registrado con éxito').should('be.visible');

    // Verificar que aparece en el historial
    cy.get('.entrenamientos-list').should('be.visible');
    cy.get('.entrenamiento-card').within(() => {
      cy.get('.card-titulo').should('contain', '19 feb 2026');
      cy.get('.stat-text').should('contain', '1 ejercicios');
      cy.get('.ejercicio-tag').should('contain', 'Squat');
    });

    // Borrar el entrenamiento
    cy.get('.entrenamiento-card').first().find('button.btn-delete-card').click();
    cy.get('.btn-modal-action.btn-eliminar').should('be.visible').click();

    // Verificar que desaparece
    cy.get('.entrenamiento-card').should('not.exist');
  });
});
