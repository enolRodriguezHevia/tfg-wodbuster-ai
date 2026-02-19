/// <reference types="cypress" />

describe('PlanEntrenamiento E2E', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3001/login');
  });

  it('flujo completo: login, navegar y generar plan', () => {
    // --- Login ---
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección
    cy.url().should('not.include', '/login');

    // --- Ir a Plan de Entrenamiento ---
    cy.contains('Plan de Entrenamiento').click();
    cy.url().should('include', '/plan-entrenamiento');

    // --- Completar el nombre del plan (opcional) ---
    cy.get('input#nombrePlan').type('Semana 1 - Fuerza');

    // --- Generar plan ---
    cy.get('button.btn-generar').click();

    // --- Verificar que aparece la tarjeta de plan generado ---
    cy.get('.plan-generado-card', { timeout: 60000 }).should('exist');
    cy.contains('✅ Plan de Entrenamiento Generado').should('exist');

    // --- Abrir modal de plan completo ---
    cy.get('button.btn-ver-plan').click();
    cy.get('.modal-overlay').should('exist');

    // --- Cerrar modal antes de interactuar con la tarjeta ---
    cy.get('button.btn-close-modal').click();
    cy.get('.modal-overlay').should('not.exist');

    // --- Copiar plan desde la tarjeta ---
    cy.get('button.btn-action').contains('📋').click();

    // --- Descargar plan desde la tarjeta ---
    cy.get('button.btn-action').contains('💾').click();

    // --- Borrar plan generado ---
    cy.get('button.btn-eliminar').contains('🗑️').click();
    cy.get('.plan-generado-card').should('not.exist');

    // --- Opcional: verificar planes anteriores si existieran ---
    cy.get('h2').contains('📚 Planes Anteriores').should('exist');
  });
});
