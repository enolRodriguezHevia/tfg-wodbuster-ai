/// <reference types="cypress" />

describe('Signup E2E', () => {
  it('flujo completo: signup, login y navegación', () => {
    // Ir a signup
    cy.visit('http://localhost:3001/signup');

    // Rellenar datos de usuario
    cy.get('input[name="username"]').type('e2etestuser_signup_6');
    cy.get('input[name="email"]').type('e2etestuser_signup6@example.com');
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
    cy.get('.navbar-link-btn').contains('Configuración IA').should('be.visible');

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
