/// <reference types="cypress" />

describe('AnalisisVideos E2E', () => {
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

  it('flujo completo: login, navegar y analizar video', () => {
    // Ir a Login desde la página raíz
    cy.contains('Ir a Login').click();
    cy.url().should('include', '/login');

    // Login
    cy.get('input[name="username"]').type('e2etestuser');
    cy.get('input[name="password"]').type('testpassword');
    cy.get('button[type="submit"]').click();

    // Esperar redirección al dashboard o home
    cy.url().should('not.include', '/login');

    // Ir a Análisis de Videos
    cy.get('.navbar-link-btn').contains('Análisis de Videos').click();
    cy.url().should('include', '/analisis-videos');

    // Seleccionar ejercicio
    cy.get('select[aria-label="Ejercicio"]').select('sentadilla');
    // Subir video de ejemplo
    cy.fixture('BuenaSentadillaPerfil.mp4', 'base64').then(video => {
      const blob = Cypress.Blob.base64StringToBlob(video, 'video/mp4');
      const file = new File([blob], 'BuenaSentadillaPerfil.mp4', { type: 'video/mp4' });
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      cy.get('input[type="file"]').then(input => {
        input[0].files = dataTransfer.files;
        cy.wrap(input).trigger('change', { force: true });
      });
    });
    // Analizar
    cy.get('button[type="submit"]').click();
    // Esperar feedback (timeout aumentado para operaciones con IA)
    cy.contains('feedback', { matchCase: false, timeout: 30000 }).should('exist');
  });
});
