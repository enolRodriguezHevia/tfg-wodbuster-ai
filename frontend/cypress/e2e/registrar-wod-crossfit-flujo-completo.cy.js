/// <reference types="cypress" />

describe('WODs CrossFit E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3001/login');
  });

  it('flujo completo: login, registrar y borrar WOD', () => {
    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');

    // Ir a WODs CrossFit
    cy.contains('WODs CrossFit').click();
    cy.url().should('include', '/wods-crossfit');

    // Abrir formulario
    cy.get('button.btn-nuevo-wod').click();
    cy.get('form.wod-form').should('be.visible');

    // Seleccionar WOD y nivel
    cy.get('select').first().select('Fran');
    cy.get('input[type="radio"][value="rx"]').check();

    // Rellenar fecha y tiempo
    cy.get('input[type="date"]').clear().type('2026-02-19');
    cy.get('input').filter('[placeholder="0"]').first().clear().type('5'); // minutos
    cy.get('input').filter('[placeholder="0"]').last().clear().type('30'); // segundos

    // Guardar WOD
    cy.get('button.btn-submit').click();

    // Verificar mensaje de éxito
    cy.contains('WOD registrado con éxito').should('be.visible');

    // Verificar que aparece en la lista
    cy.get('.wod-item').should('contain', 'Fran');
    cy.get('.nivel-badge').should('contain', 'RX');
    cy.get('.tiempo-valor').should('contain', '5:30');
    cy.get('.wod-fecha').should('contain', '19 de febrero de 2026');

    // Borrar el WOD
    cy.get('.wod-item').first().find('button.btn-delete').click();
    cy.get('.btn-modal-action.btn-eliminar').should('be.visible').click();

    // Verificar que desaparece
    cy.get('.wod-item').should('not.exist');
  });
});
