/// <reference types="cypress" />

describe('Configuración IA E2E', () => {
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
    
    // Ir a Login desde la página raíz
    cy.contains('Ir a Login').click();
    cy.url().should('include', '/login');
    
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
    cy.get('.llm-model-card.selected').should('exist');
    cy.get('.llm-model-card').contains('Claude').should('be.visible');

    // Cambiar modelo IA a Claude (si no está ya seleccionado)
    cy.get('.llm-model-card').contains('Claude')
      .parents('.llm-model-card')
      .then(($card) => {
        if (!$card.hasClass('selected')) {
          cy.wrap($card).find('button.select-model-btn').click();
          
          // Verificar badge de seleccionado
          cy.get('.llm-model-card.selected').should('contain', 'Claude');
          cy.get('.llm-selected-badge').should('contain', '✓ Seleccionado');
          
          // Verificar mensaje de éxito
          cy.contains('Modelo de IA actualizado').should('be.visible');
        }
      });
  });
});
