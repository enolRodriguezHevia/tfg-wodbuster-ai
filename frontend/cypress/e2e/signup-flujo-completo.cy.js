/// <reference types="cypress" />

describe('Signup E2E', () => {
  it('flujo completo: signup, login y navegación', () => {
    // Ir a la página raíz
    cy.visit('/');

    // Ir a Sign Up desde la página raíz
    cy.contains('Ir a Sign Up').click();
    cy.url().should('include', '/signup');

    // Rellenar datos de usuario con timestamp corto para evitar conflictos
    const timestamp = Date.now().toString().slice(-6); // Solo últimos 6 dígitos
    const username = `e2e${timestamp}`; // Ejemplo: e2e123456 (9 caracteres)
    
    cy.get('input[name="username"]').type(username);
    cy.get('input[name="email"]').type(`${username}@example.com`);
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección y login
    cy.url().should('not.include', '/signup');
    cy.get('.navbar').should('be.visible');
    cy.get('.navbar-link-btn').contains('Benchmarks').should('be.visible');
    cy.get('.navbar-link-btn').contains('Entrenamientos').should('be.visible');
    cy.get('.navbar-link-btn').contains('WODs CrossFit').should('be.visible');
    cy.get('.navbar-link-btn').contains('Plan de Entrenamiento').should('be.visible');
    cy.get('.navbar-link-btn').contains('Análisis de Videos IA').should('be.visible');

    // Navegar a Benchmarks
    cy.get('.navbar-link-btn').contains('Benchmarks').click();
    cy.url().should('include', '/benchmarks');
    cy.contains('Ejercicios Disponibles').should('be.visible');

    // Navegar a Entrenamientos
    cy.get('.navbar-link-btn').contains('Entrenamientos').click();
    cy.url().should('include', '/entrenamientos');
    cy.contains('Mis Entrenamientos').should('be.visible');

    // Navegar a WODs CrossFit
    cy.get('.navbar-link-btn').contains('WODs CrossFit').click();
    cy.url().should('include', '/wods-crossfit');
    cy.contains('Historial de WODs').should('be.visible');

    // Volver al dashboard principal desde historial de WODs
    cy.get('.navbar-brand .navbar-logo').click();
    cy.url().should('include', '/dashboard');
  });
});
