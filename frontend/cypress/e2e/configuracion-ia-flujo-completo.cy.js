/// <reference types="cypress" />

describe('Configuración IA E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3001/login');
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');
  });

  it('flujo completo: cambiar modelo IA', () => {
    // Ir a Configuración IA desde navbar
    cy.get('.navbar-link-btn').contains('Configuración IA').click();
    cy.url().should('include', '/configuracion-ia');

    // Verificar cards de modelos
    cy.get('.llm-model-card').should('have.length', 2);
    cy.get('.llm-model-card.selected').should('contain', 'GPT-4o');
    cy.get('.llm-model-card').contains('Claude Sonnet 4.5').should('be.visible');

    // Cambiar modelo IA a Claude
    cy.get('.llm-model-card').contains('Claude Sonnet 4.5')
      .parents('.llm-model-card')
      .find('button.select-model-btn').click();

    // Verificar badge de seleccionado
    cy.get('.llm-model-card.selected').should('contain', 'Claude Sonnet 4.5');
    cy.get('.llm-selected-badge').should('contain', '✓ Seleccionado');

    // Verificar mensaje de éxito
    cy.contains('Modelo de IA actualizado a Claude Sonnet 4.5').should('be.visible');
  });
});
